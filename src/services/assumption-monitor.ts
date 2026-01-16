/**
 * Assumption Monitor Service
 * 
 * Tracks assumption decay and alerts when assumptions become stale.
 * Assumptions have "expiry hints" and confidence levels that decay over time.
 */

import { eq, and, lt, isNull, or } from 'drizzle-orm';
import { db } from '../db';
import { assumptions, intents } from '../db/schema';

export interface DecayAlert {
    assumptionId: string;
    intentId: string;
    intentTitle: string;
    assumptionStatement: string;
    reason: 'expired' | 'low_confidence' | 'stale';
    daysSinceCreated: number;
    suggestedAction: string;
}

export interface DecayCheckResult {
    totalChecked: number;
    alerts: DecayAlert[];
    healthyCount: number;
}

const STALE_THRESHOLD_DAYS = 30;
const LOW_CONFIDENCE_THRESHOLD = 0.3;

export class AssumptionMonitor {
    /**
     * Check all active assumptions for decay
     */
    static async checkForDecay(tenantId?: string): Promise<DecayCheckResult> {
        // Get all active assumptions with their intents
        const activeAssumptions = await db
            .select({
                assumption: assumptions,
                intentTitle: intents.title,
            })
            .from(assumptions)
            .leftJoin(intents, eq(assumptions.intentId, intents.id))
            .where(eq(assumptions.status, 'active'));

        const alerts: DecayAlert[] = [];
        const now = new Date();

        for (const { assumption, intentTitle } of activeAssumptions) {
            const createdAt = new Date(assumption.createdAt || now);
            const daysSinceCreated = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

            // Check for expiry hint
            if (assumption.expiryHint) {
                const expiryDate = new Date(assumption.expiryHint);
                if (now > expiryDate) {
                    alerts.push({
                        assumptionId: assumption.id,
                        intentId: assumption.intentId || '',
                        intentTitle: intentTitle || 'Unknown Intent',
                        assumptionStatement: assumption.assumptionStatement,
                        reason: 'expired',
                        daysSinceCreated,
                        suggestedAction: 'Validate this assumption - it has passed its expiry date.',
                    });
                    continue;
                }
            }

            // Check for low confidence
            if (assumption.confidenceLevel && assumption.confidenceLevel < LOW_CONFIDENCE_THRESHOLD) {
                alerts.push({
                    assumptionId: assumption.id,
                    intentId: assumption.intentId || '',
                    intentTitle: intentTitle || 'Unknown Intent',
                    assumptionStatement: assumption.assumptionStatement,
                    reason: 'low_confidence',
                    daysSinceCreated,
                    suggestedAction: 'This assumption has low confidence. Consider validating or removing it.',
                });
                continue;
            }

            // Check for staleness (no expiry hint but old)
            if (!assumption.expiryHint && daysSinceCreated > STALE_THRESHOLD_DAYS) {
                alerts.push({
                    assumptionId: assumption.id,
                    intentId: assumption.intentId || '',
                    intentTitle: intentTitle || 'Unknown Intent',
                    assumptionStatement: assumption.assumptionStatement,
                    reason: 'stale',
                    daysSinceCreated,
                    suggestedAction: `This assumption is ${daysSinceCreated} days old. Review if still valid.`,
                });
            }
        }

        return {
            totalChecked: activeAssumptions.length,
            alerts,
            healthyCount: activeAssumptions.length - alerts.length,
        };
    }

    /**
     * Check assumptions for a specific intent
     */
    static async checkIntentAssumptions(intentId: string): Promise<DecayCheckResult> {
        const intentAssumptions = await db
            .select({
                assumption: assumptions,
                intentTitle: intents.title,
            })
            .from(assumptions)
            .leftJoin(intents, eq(assumptions.intentId, intents.id))
            .where(and(
                eq(assumptions.intentId, intentId),
                eq(assumptions.status, 'active')
            ));

        const alerts: DecayAlert[] = [];
        const now = new Date();

        for (const { assumption, intentTitle } of intentAssumptions) {
            const createdAt = new Date(assumption.createdAt || now);
            const daysSinceCreated = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

            if (assumption.expiryHint) {
                const expiryDate = new Date(assumption.expiryHint);
                if (now > expiryDate) {
                    alerts.push({
                        assumptionId: assumption.id,
                        intentId: assumption.intentId || '',
                        intentTitle: intentTitle || 'Unknown',
                        assumptionStatement: assumption.assumptionStatement,
                        reason: 'expired',
                        daysSinceCreated,
                        suggestedAction: 'Validate - past expiry date.',
                    });
                    continue;
                }
            }

            if (assumption.confidenceLevel && assumption.confidenceLevel < LOW_CONFIDENCE_THRESHOLD) {
                alerts.push({
                    assumptionId: assumption.id,
                    intentId: assumption.intentId || '',
                    intentTitle: intentTitle || 'Unknown',
                    assumptionStatement: assumption.assumptionStatement,
                    reason: 'low_confidence',
                    daysSinceCreated,
                    suggestedAction: 'Low confidence - validate or remove.',
                });
                continue;
            }

            if (!assumption.expiryHint && daysSinceCreated > STALE_THRESHOLD_DAYS) {
                alerts.push({
                    assumptionId: assumption.id,
                    intentId: assumption.intentId || '',
                    intentTitle: intentTitle || 'Unknown',
                    assumptionStatement: assumption.assumptionStatement,
                    reason: 'stale',
                    daysSinceCreated,
                    suggestedAction: `${daysSinceCreated} days old - review.`,
                });
            }
        }

        return {
            totalChecked: intentAssumptions.length,
            alerts,
            healthyCount: intentAssumptions.length - alerts.length,
        };
    }

    /**
     * Invalidate an assumption
     */
    static async invalidate(assumptionId: string): Promise<boolean> {
        const result = await db
            .update(assumptions)
            .set({ status: 'invalidated' })
            .where(eq(assumptions.id, assumptionId));

        return true;
    }
}
