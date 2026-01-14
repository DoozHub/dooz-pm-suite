/**
 * Intent Service
 * 
 * Handles Intent CRUD and state machine transitions.
 * Intents are the primary artifact in Dooz PM Suite.
 */

import { nanoid } from 'nanoid';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { intents, type Intent, type NewIntent } from '../db/schema';
import type { CreateIntentInput, UpdateIntentInput, IntentState } from '../lib/types';

// State machine: valid transitions
const VALID_TRANSITIONS: Record<IntentState, IntentState[]> = {
    research: ['planning', 'archived'],
    planning: ['research', 'execution', 'archived'],
    execution: ['planning', 'archived'],
    archived: [], // Terminal state - no transitions allowed
};

export class IntentService {
    /**
     * Create a new Intent
     */
    static async create(
        tenantId: string,
        userId: string,
        input: CreateIntentInput
    ): Promise<Intent> {
        const newIntent: NewIntent = {
            id: nanoid(),
            tenantId,
            title: input.title,
            description: input.description,
            currentState: 'research', // Always starts in research
            createdBy: userId,
            confidenceLevel: input.confidenceLevel,
            visibilityScope: input.visibilityScope,
        };

        const [created] = await db.insert(intents).values(newIntent).returning();
        return created;
    }

    /**
     * Get Intent by ID (scoped to tenant)
     */
    static async getById(tenantId: string, id: string): Promise<Intent | null> {
        const [intent] = await db
            .select()
            .from(intents)
            .where(and(eq(intents.id, id), eq(intents.tenantId, tenantId)));

        return intent || null;
    }

    /**
     * List all Intents for a tenant
     */
    static async list(tenantId: string, state?: IntentState): Promise<Intent[]> {
        const conditions = [eq(intents.tenantId, tenantId)];

        if (state) {
            conditions.push(eq(intents.currentState, state));
        }

        return db.select().from(intents).where(and(...conditions));
    }

    /**
     * Update an Intent
     */
    static async update(
        tenantId: string,
        id: string,
        input: UpdateIntentInput
    ): Promise<Intent | null> {
        const existing = await this.getById(tenantId, id);
        if (!existing) return null;

        const [updated] = await db
            .update(intents)
            .set(input)
            .where(and(eq(intents.id, id), eq(intents.tenantId, tenantId)))
            .returning();

        return updated;
    }

    /**
     * Transition Intent to a new state
     * Enforces state machine rules - only humans can transition
     */
    static async transition(
        tenantId: string,
        userId: string,
        id: string,
        newState: IntentState
    ): Promise<{ success: boolean; intent?: Intent; error?: string }> {
        const intent = await this.getById(tenantId, id);

        if (!intent) {
            return { success: false, error: 'Intent not found' };
        }

        const currentState = intent.currentState as IntentState;
        const allowedTransitions = VALID_TRANSITIONS[currentState] || [];

        if (!allowedTransitions.includes(newState)) {
            return {
                success: false,
                error: `Invalid transition: ${currentState} → ${newState}. Allowed: ${allowedTransitions.join(', ') || 'none'}`,
            };
        }

        const [updated] = await db
            .update(intents)
            .set({
                currentState: newState,
                lastHumanReviewedAt: new Date(),
            })
            .where(and(eq(intents.id, id), eq(intents.tenantId, tenantId)))
            .returning();

        // TODO: Emit event to dooz-bridge when available
        // await bridge.emit('pm.intent.transitioned', { intentId: id, from: currentState, to: newState });

        return { success: true, intent: updated };
    }

    /**
     * Mark Intent as reviewed by human
     */
    static async markReviewed(tenantId: string, id: string): Promise<Intent | null> {
        const [updated] = await db
            .update(intents)
            .set({ lastHumanReviewedAt: new Date() })
            .where(and(eq(intents.id, id), eq(intents.tenantId, tenantId)))
            .returning();

        return updated;
    }
}
