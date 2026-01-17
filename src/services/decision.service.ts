/**
 * Decision Service
 * 
 * Handles the append-only Decision Ledger.
 * Decisions are immutable after commit - they can only be superseded.
 */

import { nanoid } from 'nanoid';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { decisions, type Decision, type NewDecision } from '../db/schema';
import type { CreateDecisionInput } from '../lib/types';
import { getProvider, getProviderMode } from '../ai';

export class DecisionService {
    /**
     * Commit a new Decision
     * This is an APPEND operation - decisions are immutable
     */
    static async commit(
        tenantId: string,
        userId: string,
        input: CreateDecisionInput
    ): Promise<Decision> {
        const newDecision: NewDecision = {
            id: nanoid(),
            intentId: input.intentId,
            decisionStatement: input.decisionStatement,
            optionsConsidered: input.optionsConsidered ? JSON.stringify(input.optionsConsidered) : null,
            finalChoice: input.finalChoice,
            humanApprover: userId,
            aiInputsReferenced: input.aiInputsReferenced ? JSON.stringify(input.aiInputsReferenced) : null,
            revisitCondition: input.revisitCondition,
            status: 'active',
        };

        const [created] = await db.insert(decisions).values(newDecision).returning();

        // Sync to Brain if in Brain mode
        if (getProviderMode() === 'brain') {
            try {
                const provider = getProvider();
                await provider.storeMemory({
                    scopeId: `pm-suite-${tenantId}`,
                    title: `Decision: ${input.finalChoice}`,
                    content: `## Decision\n${input.decisionStatement}\n\n## Final Choice\n${input.finalChoice}\n\n## Options Considered\n${(input.optionsConsidered || []).map(o => `- ${o}`).join('\n')}\n\n## Intent\n${input.intentId}`,
                    bucketId: 'decisions',
                });
                console.log(`[Decision] Synced to Brain: ${created.id}`);
            } catch (e) {
                console.warn('[Decision] Brain sync failed:', e);
                // Non-blocking - decision is still committed locally
            }
        }

        // Always emit to bridge for cross-app awareness
        try {
            const { BridgeClient, PmTopics } = await import('../lib/bridge');
            BridgeClient.emit(PmTopics.DECISION_COMMITTED, {
                decisionId: created.id,
                intentId: input.intentId,
                tenantId,
                userId,
                decisionStatement: input.decisionStatement,
                finalChoice: input.finalChoice,
                optionsConsidered: input.optionsConsidered,
                timestamp: new Date().toISOString(),
            }).catch(console.error);
        } catch (e) {
            // Bridge not available - non-blocking
        }

        return created;
    }

    /**
     * Get Decision by ID
     */
    static async getById(id: string): Promise<Decision | null> {
        const [decision] = await db.select().from(decisions).where(eq(decisions.id, id));
        return decision || null;
    }

    /**
     * List Decisions for an Intent (chronological order)
     */
    static async listByIntent(intentId: string): Promise<Decision[]> {
        return db
            .select()
            .from(decisions)
            .where(eq(decisions.intentId, intentId))
            .orderBy(desc(decisions.decisionTimestamp));
    }

    /**
     * Supersede a Decision
     * Creates a new decision and marks the old one as superseded
     */
    static async supersede(
        tenantId: string,
        userId: string,
        originalId: string,
        newInput: CreateDecisionInput
    ): Promise<{ original: Decision; replacement: Decision } | null> {
        const original = await this.getById(originalId);
        if (!original || original.status !== 'active') {
            return null;
        }

        // Mark original as superseded
        await db
            .update(decisions)
            .set({ status: 'superseded' })
            .where(eq(decisions.id, originalId));

        // Create new decision with reference
        const replacement = await this.commit(tenantId, userId, {
            ...newInput,
            aiInputsReferenced: [
                ...(newInput.aiInputsReferenced || []),
                `supersedes:${originalId}`,
            ],
        });

        return { original: { ...original, status: 'superseded' }, replacement };
    }

    /**
     * Get the Decision Ledger (full audit trail)
     */
    static async getLedger(intentId: string): Promise<Decision[]> {
        return db
            .select()
            .from(decisions)
            .where(eq(decisions.intentId, intentId))
            .orderBy(decisions.decisionTimestamp);
    }

    /**
     * Get active decisions only
     */
    static async getActiveByIntent(intentId: string): Promise<Decision[]> {
        return db
            .select()
            .from(decisions)
            .where(and(eq(decisions.intentId, intentId), eq(decisions.status, 'active')))
            .orderBy(desc(decisions.decisionTimestamp));
    }
}
