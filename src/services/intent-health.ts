/**
 * Intent Health Service
 * 
 * Calculates health scores for intents based on:
 * - Activity level (recent decisions, updates)
 * - Assumption health (decay alerts)
 * - Risk coverage (mitigated vs unaddressed)
 * - Task completion rate
 */

import { eq, desc, count, and, gt } from 'drizzle-orm';
import { db } from '../db';
import { intents, decisions, assumptions, risks, tasks } from '../db/schema';
import { AssumptionMonitor } from './assumption-monitor';

export interface HealthScore {
    intentId: string;
    overall: number; // 0-100
    breakdown: {
        activity: number;      // 0-100
        assumptions: number;   // 0-100
        risks: number;         // 0-100
        tasks: number;         // 0-100
    };
    alerts: string[];
    lastActivity: string | null;
    daysSinceActivity: number;
}

const ACTIVITY_WEIGHT = 0.25;
const ASSUMPTIONS_WEIGHT = 0.25;
const RISKS_WEIGHT = 0.25;
const TASKS_WEIGHT = 0.25;

export class IntentHealthService {
    /**
     * Calculate health score for an intent
     */
    static async calculateHealth(intentId: string): Promise<HealthScore> {
        const alerts: string[] = [];
        const now = new Date();

        // Get intent
        const [intent] = await db.select().from(intents).where(eq(intents.id, intentId));
        if (!intent) {
            return {
                intentId,
                overall: 0,
                breakdown: { activity: 0, assumptions: 0, risks: 0, tasks: 0 },
                alerts: ['Intent not found'],
                lastActivity: null,
                daysSinceActivity: 999,
            };
        }

        // 1. Activity Score
        const recentDecisions = await db
            .select({ count: count() })
            .from(decisions)
            .where(and(
                eq(decisions.intentId, intentId),
                gt(decisions.decisionTimestamp, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            ));

        const lastDecision = await db
            .select()
            .from(decisions)
            .where(eq(decisions.intentId, intentId))
            .orderBy(desc(decisions.decisionTimestamp))
            .limit(1);

        const lastActivity = lastDecision[0]?.decisionTimestamp || intent.createdAt || null;
        const daysSinceActivity = lastActivity
            ? Math.floor((now.getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
            : 999;

        let activityScore = 100;
        if (daysSinceActivity > 30) {
            activityScore = 20;
            alerts.push('No activity in 30+ days');
        } else if (daysSinceActivity > 14) {
            activityScore = 50;
            alerts.push('Low activity (14+ days since last update)');
        } else if (daysSinceActivity > 7) {
            activityScore = 75;
        }

        // 2. Assumptions Score
        const assumptionCheck = await AssumptionMonitor.checkIntentAssumptions(intentId);
        const assumptionScore = assumptionCheck.totalChecked === 0
            ? 100
            : Math.round((assumptionCheck.healthyCount / assumptionCheck.totalChecked) * 100);

        if (assumptionCheck.alerts.length > 0) {
            alerts.push(`${assumptionCheck.alerts.length} assumption(s) need attention`);
        }

        // 3. Risks Score
        const allRisks = await db
            .select()
            .from(risks)
            .where(eq(risks.intentId, intentId));

        const highRisks = allRisks.filter(r =>
            r.severity === 'critical' || r.severity === 'high'
        );
        const unmitigatedHighRisks = highRisks.filter(r => !r.mitigationNotes);

        let risksScore = 100;
        if (unmitigatedHighRisks.length > 2) {
            risksScore = 30;
            alerts.push(`${unmitigatedHighRisks.length} high/critical risks without mitigation`);
        } else if (unmitigatedHighRisks.length > 0) {
            risksScore = 60;
            alerts.push('Some high-priority risks need mitigation');
        } else if (highRisks.length > 0) {
            risksScore = 85;
        }

        // 4. Tasks Score
        const allTasks = await db
            .select()
            .from(tasks)
            .where(eq(tasks.intentId, intentId));

        const completedTasks = allTasks.filter(t => t.status === 'completed').length;
        const tasksScore = allTasks.length === 0
            ? 100
            : Math.round((completedTasks / allTasks.length) * 100);

        if (allTasks.length > 0 && tasksScore < 50) {
            alerts.push('Low task completion rate');
        }

        // Calculate overall
        const overall = Math.round(
            activityScore * ACTIVITY_WEIGHT +
            assumptionScore * ASSUMPTIONS_WEIGHT +
            risksScore * RISKS_WEIGHT +
            tasksScore * TASKS_WEIGHT
        );

        return {
            intentId,
            overall,
            breakdown: {
                activity: activityScore,
                assumptions: assumptionScore,
                risks: risksScore,
                tasks: tasksScore,
            },
            alerts,
            lastActivity,
            daysSinceActivity,
        };
    }

    /**
     * Get health scores for all intents (dashboard view)
     */
    static async getAllHealth(tenantId: string): Promise<HealthScore[]> {
        const allIntents = await db
            .select()
            .from(intents)
            .where(eq(intents.tenantId, tenantId));

        const scores: HealthScore[] = [];
        for (const intent of allIntents) {
            scores.push(await this.calculateHealth(intent.id));
        }

        // Sort by health (lowest first - most attention needed)
        return scores.sort((a, b) => a.overall - b.overall);
    }
}
