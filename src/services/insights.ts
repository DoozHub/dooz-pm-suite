/**
 * Insights Service
 * 
 * Provides cross-intent insights using Brain's RAG capabilities.
 * Falls back to local analysis in standalone mode.
 */

import { eq, desc } from 'drizzle-orm';
import { db } from '../db';
import { intents, decisions, assumptions, risks } from '../db/schema';
import { getProvider, getProviderMode } from '../ai';

export interface Insight {
    type: 'pattern' | 'conflict' | 'opportunity' | 'warning';
    title: string;
    description: string;
    relatedIntents: string[];
    confidence: number;
    source: 'brain' | 'local';
}

export interface InsightsResult {
    insights: Insight[];
    generatedAt: string;
    mode: 'brain' | 'standalone';
}

export class InsightsService {
    /**
     * Get insights for an intent
     */
    static async getIntentInsights(intentId: string, tenantId: string): Promise<InsightsResult> {
        const mode = getProviderMode();

        if (mode === 'brain') {
            return this.getBrainInsights(intentId, tenantId);
        } else {
            return this.getLocalInsights(intentId);
        }
    }

    /**
     * Brain-powered insights using RAG
     */
    private static async getBrainInsights(intentId: string, tenantId: string): Promise<InsightsResult> {
        const provider = getProvider();

        // Get intent details
        const [intent] = await db.select().from(intents).where(eq(intents.id, intentId));
        if (!intent) {
            return { insights: [], generatedAt: new Date().toISOString(), mode: 'brain' };
        }

        // Get context from Brain
        const context = await provider.getContext({
            query: `${intent.title} ${intent.description || ''}`,
            scopeId: `pm-suite-${tenantId}`,
            maxChars: 4000,
        });

        if (!context.context) {
            // Fall back to local if no Brain context
            return this.getLocalInsights(intentId);
        }

        // Ask Brain to analyze
        const analysisPrompt = `Analyze these related memories and identify patterns, conflicts, or opportunities.

Intent: ${intent.title}
${intent.description || ''}

Related Context:
${context.context}

Provide 2-3 actionable insights in JSON format:
[
  {
    "type": "pattern|conflict|opportunity|warning",
    "title": "Short title",
    "description": "Detailed insight"
  }
]`;

        try {
            const response = await provider.complete({
                prompt: analysisPrompt,
                systemPrompt: 'You are a project management analyst. Respond only with valid JSON array.',
                temperature: 0.3,
            });

            // Parse JSON from response
            const jsonMatch = response.content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                const insights: Insight[] = parsed.map((p: any) => ({
                    type: p.type || 'pattern',
                    title: p.title,
                    description: p.description,
                    relatedIntents: [intentId],
                    confidence: 0.7,
                    source: 'brain' as const,
                }));

                return {
                    insights,
                    generatedAt: new Date().toISOString(),
                    mode: 'brain',
                };
            }
        } catch (e) {
            console.warn('[Insights] Brain analysis failed:', e);
        }

        // Fall back to local
        return this.getLocalInsights(intentId);
    }

    /**
     * Local insights without Brain
     */
    private static async getLocalInsights(intentId: string): Promise<InsightsResult> {
        const insights: Insight[] = [];

        // Get intent with related data
        const [intent] = await db.select().from(intents).where(eq(intents.id, intentId));
        if (!intent) {
            return { insights: [], generatedAt: new Date().toISOString(), mode: 'standalone' };
        }

        // Check for stale intent
        const lastReview = intent.lastHumanReviewedAt ? new Date(intent.lastHumanReviewedAt) : null;
        if (!lastReview || (Date.now() - lastReview.getTime()) > 14 * 24 * 60 * 60 * 1000) {
            insights.push({
                type: 'warning',
                title: 'Review Needed',
                description: 'This intent has not been reviewed recently. Consider validating assumptions and progress.',
                relatedIntents: [intentId],
                confidence: 0.9,
                source: 'local',
            });
        }

        // Check confidence level
        if (intent.confidenceLevel && intent.confidenceLevel < 0.5) {
            insights.push({
                type: 'warning',
                title: 'Low Confidence Intent',
                description: 'This intent has low confidence. Consider gathering more information or validating assumptions.',
                relatedIntents: [intentId],
                confidence: 0.85,
                source: 'local',
            });
        }

        // Check assumptions count
        const assumptionsList = await db
            .select()
            .from(assumptions)
            .where(eq(assumptions.intentId, intentId));

        if (assumptionsList.length > 5) {
            insights.push({
                type: 'pattern',
                title: 'Many Assumptions',
                description: `This intent has ${assumptionsList.length} assumptions. Consider validating key ones to reduce uncertainty.`,
                relatedIntents: [intentId],
                confidence: 0.8,
                source: 'local',
            });
        }

        // Check unmitigated risks
        const risksList = await db
            .select()
            .from(risks)
            .where(eq(risks.intentId, intentId));

        const unmitigated = risksList.filter(r =>
            (r.severity === 'high' || r.severity === 'critical') && !r.mitigationNotes
        );

        if (unmitigated.length > 0) {
            insights.push({
                type: 'warning',
                title: 'Unmitigated High Risks',
                description: `${unmitigated.length} high-priority risk(s) without mitigation plans.`,
                relatedIntents: [intentId],
                confidence: 0.95,
                source: 'local',
            });
        }

        return {
            insights,
            generatedAt: new Date().toISOString(),
            mode: 'standalone',
        };
    }
}
