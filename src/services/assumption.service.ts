/**
 * Assumption Service
 * 
 * CRUD operations for assumptions linked to intents.
 */

import { nanoid } from 'nanoid';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { assumptions, type Assumption } from '../db/schema';

export class AssumptionService {
    /**
     * Create a new assumption
     */
    static async create(
        tenantId: string,
        data: {
            intentId: string;
            assumptionStatement: string;
            confidenceLevel?: number;
            createdFrom?: 'human' | 'ai';
            expiryHint?: string;
        }
    ): Promise<Assumption> {
        const id = nanoid();

        await db.insert(assumptions).values({
            id,
            intentId: data.intentId,
            assumptionStatement: data.assumptionStatement,
            confidenceLevel: data.confidenceLevel,
            createdFrom: data.createdFrom || 'human',
            expiryHint: data.expiryHint,
            status: 'active',
        });

        const [assumption] = await db.select().from(assumptions).where(eq(assumptions.id, id));
        return assumption;
    }

    /**
     * Get all assumptions for an intent
     */
    static async listByIntent(intentId: string): Promise<Assumption[]> {
        return db.select().from(assumptions).where(eq(assumptions.intentId, intentId));
    }

    /**
     * Get assumption by ID
     */
    static async getById(id: string): Promise<Assumption | undefined> {
        const [assumption] = await db.select().from(assumptions).where(eq(assumptions.id, id));
        return assumption;
    }

    /**
     * Update assumption
     */
    static async update(
        id: string,
        data: Partial<{
            assumptionStatement: string;
            confidenceLevel: number;
            expiryHint: string;
            status: 'active' | 'invalidated';
        }>
    ): Promise<Assumption | undefined> {
        await db.update(assumptions).set(data).where(eq(assumptions.id, id));
        return this.getById(id);
    }

    /**
     * Invalidate an assumption
     */
    static async invalidate(id: string): Promise<Assumption | undefined> {
        return this.update(id, { status: 'invalidated' });
    }

    /**
     * Delete assumption
     */
    static async delete(id: string): Promise<boolean> {
        const result = await db.delete(assumptions).where(eq(assumptions.id, id));
        return true;
    }
}
