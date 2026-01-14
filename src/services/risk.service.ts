/**
 * Risk Service
 * 
 * CRUD operations for risks linked to intents.
 */

import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { risks, type Risk } from '../db/schema';

export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type Likelihood = 'low' | 'medium' | 'high';

export class RiskService {
    /**
     * Create a new risk
     */
    static async create(
        tenantId: string,
        data: {
            intentId: string;
            riskStatement: string;
            severity?: Severity;
            likelihood?: Likelihood;
            createdFrom?: 'human' | 'ai';
            mitigationNotes?: string;
        }
    ): Promise<Risk> {
        const id = nanoid();

        await db.insert(risks).values({
            id,
            intentId: data.intentId,
            riskStatement: data.riskStatement,
            severity: data.severity,
            likelihood: data.likelihood,
            createdFrom: data.createdFrom || 'human',
            mitigationNotes: data.mitigationNotes,
            status: 'active',
        });

        const [risk] = await db.select().from(risks).where(eq(risks.id, id));
        return risk;
    }

    /**
     * Get all risks for an intent
     */
    static async listByIntent(intentId: string): Promise<Risk[]> {
        return db.select().from(risks).where(eq(risks.intentId, intentId));
    }

    /**
     * Get risk by ID
     */
    static async getById(id: string): Promise<Risk | undefined> {
        const [risk] = await db.select().from(risks).where(eq(risks.id, id));
        return risk;
    }

    /**
     * Update risk
     */
    static async update(
        id: string,
        data: Partial<{
            riskStatement: string;
            severity: Severity;
            likelihood: Likelihood;
            mitigationNotes: string;
            status: 'active' | 'mitigated' | 'accepted';
        }>
    ): Promise<Risk | undefined> {
        await db.update(risks).set(data).where(eq(risks.id, id));
        return this.getById(id);
    }

    /**
     * Mark risk as mitigated
     */
    static async mitigate(id: string, notes: string): Promise<Risk | undefined> {
        return this.update(id, { status: 'mitigated', mitigationNotes: notes });
    }

    /**
     * Delete risk
     */
    static async delete(id: string): Promise<boolean> {
        await db.delete(risks).where(eq(risks.id, id));
        return true;
    }
}
