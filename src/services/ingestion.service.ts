/**
 * Ingestion Service
 * 
 * AI-powered extraction from chat exports and documents.
 * Creates proposals that require human confirmation.
 */

import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { aiProposals, type AiProposal } from '../db/schema';
import type { IngestionRequest, ProposalType } from '../lib/types';
import { getRouter } from '../ai';
import { PROMPTS } from '../ai/prompts/extraction';
import type { LlmRouter } from '@dooz/ai-router';

interface Extraction {
    type: ProposalType;
    statement: string;
    confidence: number;
    context?: string;
}

interface ExtractionResult {
    extractions: Extraction[];
}

export class IngestionService {
    /**
     * Process content and extract proposals
     */
    async process(
        tenantId: string,
        userId: string,
        input: IngestionRequest
    ): Promise<{ proposals: AiProposal[]; error?: string }> {
        const router = getRouter();

        if (!router) {
            return { proposals: [], error: 'AI router not configured. Set OPENROUTER_API_KEY or OLLAMA_ENABLED=true' };
        }

        try {
            // Call AI for extraction
            const response = await router.complete({
                messages: [
                    { role: 'user', content: `Extract structured information from this ${input.sourceType}:\n\n${input.content}` }
                ],
                systemPrompt: PROMPTS.extraction_v1.system,
                taskType: 'extraction',
            });

            // Parse extractions
            const parsed = this.parseExtractions(response.content);

            // Create proposal records
            const proposals: AiProposal[] = [];

            for (const extraction of parsed.extractions) {
                const proposal = {
                    id: nanoid(),
                    intentId: input.intentId || null,
                    proposalType: extraction.type,
                    content: JSON.stringify({
                        statement: extraction.statement,
                        context: extraction.context,
                    }),
                    promptTemplateId: PROMPTS.extraction_v1.id,
                    modelUsed: response.model,
                    confidence: extraction.confidence,
                    status: 'pending' as const,
                    reviewedBy: null,
                    reviewedAt: null,
                };

                await db.insert(aiProposals).values(proposal);

                // Fetch the inserted record with all fields
                const [inserted] = await db.select().from(aiProposals).where(eq(aiProposals.id, proposal.id));
                if (inserted) {
                    proposals.push(inserted);
                }
            }

            return { proposals };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('[ingestion] AI extraction failed:', message);
            return { proposals: [], error: message };
        }
    }

    /**
     * Parse AI response into extractions
     */
    private parseExtractions(content: string): ExtractionResult {
        try {
            // Try to find JSON in response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.warn('[ingestion] No JSON found in AI response');
                return { extractions: [] };
            }

            const parsed = JSON.parse(jsonMatch[0]) as ExtractionResult;

            // Validate extractions
            const validTypes: ProposalType[] = ['decision', 'assumption', 'risk', 'question'];
            const extractions = (parsed.extractions || []).filter(e =>
                validTypes.includes(e.type as ProposalType) &&
                typeof e.statement === 'string' &&
                typeof e.confidence === 'number'
            );

            return { extractions };
        } catch (e) {
            console.warn('[ingestion] Failed to parse AI response:', e);
            return { extractions: [] };
        }
    }

    /**
     * Get pending proposals for an intent
     */
    async getPendingProposals(intentId: string): Promise<AiProposal[]> {
        return db.select().from(aiProposals).where(
            eq(aiProposals.intentId, intentId)
        );
    }

    /**
     * Accept a proposal (creates the actual entity)
     */
    async acceptProposal(
        proposalId: string,
        userId: string
    ): Promise<{ success: boolean; error?: string }> {
        const [proposal] = await db.select().from(aiProposals).where(eq(aiProposals.id, proposalId));

        if (!proposal) {
            return { success: false, error: 'Proposal not found' };
        }

        if (proposal.status !== 'pending') {
            return { success: false, error: `Proposal already ${proposal.status}` };
        }

        // Update proposal status
        await db.update(aiProposals)
            .set({
                status: 'accepted',
                reviewedBy: userId,
                reviewedAt: new Date().toISOString(),
            })
            .where(eq(aiProposals.id, proposalId));

        // TODO: Create the actual entity (decision, assumption, risk) based on proposalType
        // This would create records in decisions, assumptions, or risks tables

        return { success: true };
    }

    /**
     * Reject a proposal
     */
    async rejectProposal(
        proposalId: string,
        userId: string
    ): Promise<{ success: boolean; error?: string }> {
        const [proposal] = await db.select().from(aiProposals).where(eq(aiProposals.id, proposalId));

        if (!proposal) {
            return { success: false, error: 'Proposal not found' };
        }

        await db.update(aiProposals)
            .set({
                status: 'rejected',
                reviewedBy: userId,
                reviewedAt: new Date().toISOString(),
            })
            .where(eq(aiProposals.id, proposalId));

        return { success: true };
    }

    /**
     * Park a proposal for later review
     */
    async parkProposal(
        proposalId: string,
        userId: string
    ): Promise<{ success: boolean; error?: string }> {
        const [proposal] = await db.select().from(aiProposals).where(eq(aiProposals.id, proposalId));

        if (!proposal) {
            return { success: false, error: 'Proposal not found' };
        }

        await db.update(aiProposals)
            .set({
                status: 'parked',
                reviewedBy: userId,
                reviewedAt: new Date().toISOString(),
            })
            .where(eq(aiProposals.id, proposalId));

        return { success: true };
    }
}

// Export singleton instance
export const ingestionService = new IngestionService();
