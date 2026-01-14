/**
 * Task Service
 * 
 * CRUD operations for tasks derived from decisions.
 */

import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { tasks, type Task } from '../db/schema';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';

export class TaskService {
    /**
     * Create a new task
     */
    static async create(
        tenantId: string,
        data: {
            intentId: string;
            decisionId?: string;
            title: string;
            description?: string;
            owner?: string;
            sla?: string;
            externalSystemRef?: string;
        }
    ): Promise<Task> {
        const id = nanoid();

        await db.insert(tasks).values({
            id,
            intentId: data.intentId,
            decisionId: data.decisionId,
            title: data.title,
            description: data.description,
            owner: data.owner,
            status: 'pending',
            sla: data.sla,
            externalSystemRef: data.externalSystemRef,
        });

        const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
        return task;
    }

    /**
     * Get all tasks for an intent
     */
    static async listByIntent(intentId: string): Promise<Task[]> {
        return db.select().from(tasks).where(eq(tasks.intentId, intentId));
    }

    /**
     * Get all tasks for a decision
     */
    static async listByDecision(decisionId: string): Promise<Task[]> {
        return db.select().from(tasks).where(eq(tasks.decisionId, decisionId));
    }

    /**
     * Get task by ID
     */
    static async getById(id: string): Promise<Task | undefined> {
        const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
        return task;
    }

    /**
     * Update task
     */
    static async update(
        id: string,
        data: Partial<{
            title: string;
            description: string;
            owner: string;
            status: TaskStatus;
            sla: string;
            externalSystemRef: string;
        }>
    ): Promise<Task | undefined> {
        await db.update(tasks).set(data).where(eq(tasks.id, id));
        return this.getById(id);
    }

    /**
     * Transition task status
     */
    static async transition(id: string, status: TaskStatus): Promise<Task | undefined> {
        return this.update(id, { status });
    }

    /**
     * Delete task
     */
    static async delete(id: string): Promise<boolean> {
        await db.delete(tasks).where(eq(tasks.id, id));
        return true;
    }
}
