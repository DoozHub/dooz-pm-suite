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

        // TODO: Emit event to dooz-bridge when available
        // await bridge.emit('pm.decision.committed', { decisionId: created.id, intentId: input.intentId });

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
