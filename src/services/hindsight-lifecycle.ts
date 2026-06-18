import { emitIntentTransitioned, emitDecisionCommitted, onBridgeEvent } from '../lib/bridge';
import { AssumptionMonitor } from './assumption-monitor';
import { InsightsService } from './insights';
import { IntentHealthService } from './intent-health';

export class HindsightLifecycle {
    private static unsubscribers: (() => void)[] = [];

    static start(): void {
        this.unsubscribers.push(
            onBridgeEvent('pm.intent.transitioned', async (event: { payload: Record<string, unknown> }) => {
                const { intentId, from, to } = event.payload as {
                    intentId: string;
                    from: string;
                    to: string;
                };

                if (to === 'execution') {
                    await this.onIntentEntersExecution(intentId);
                }

                if (to === 'archived') {
                    await this.onIntentArchived(intentId);
                }
            })
        );

        this.unsubscribers.push(
            onBridgeEvent('pm.assumption.invalidated', async (event: { payload: Record<string, unknown> }) => {
                const { intentId } = event.payload as { intentId: string };
                await this.onAssumptionInvalidated(intentId);
            })
        );

        this.unsubscribers.push(
            onBridgeEvent('brain.memory.decayed', async (event: { payload: Record<string, unknown> }) => {
                const { scopeId } = event.payload as { scopeId: string };
                if (scopeId?.startsWith('pm-suite-')) {
                    await this.onMemoryDecayed(scopeId.replace('pm-suite-', ''));
                }
            })
        );

        console.log('[HindsightLifecycle] Subscribed to bridge events');
    }

    static stop(): void {
        for (const unsub of this.unsubscribers) {
            unsub();
        }
        this.unsubscribers = [];
    }

    private static async onIntentEntersExecution(intentId: string): Promise<void> {
        try {
            const decayResult = await AssumptionMonitor.checkIntentAssumptions(intentId);

            if (decayResult.alerts.length > 0) {
                console.warn(
                    `[Hindsight] Intent ${intentId} entering execution with ${decayResult.alerts.length} assumption alerts`
                );
            }
        } catch (e) {
            console.warn('[Hindsight] Assumption check on transition failed:', e);
        }
    }

    private static async onIntentArchived(intentId: string): Promise<void> {
        try {
            const health = await IntentHealthService.calculateHealth(intentId);
            console.log(`[Hindsight] Intent ${intentId} archived with health: ${health.overall}`);
        } catch (e) {
            console.warn('[Hindsight] Health check on archive failed:', e);
        }
    }

    private static async onAssumptionInvalidated(intentId: string): Promise<void> {
        try {
            const insights = await InsightsService.getIntentInsights(intentId, 'default');
            const warnings = insights.insights.filter(
                (i) => i.type === 'warning' || i.type === 'conflict'
            );

            if (warnings.length > 0) {
                console.warn(
                    `[Hindsight] Assumption invalidated for ${intentId}: ${warnings.length} warnings`
                );
            }
        } catch (e) {
            console.warn('[Hindsight] Insight check on invalidation failed:', e);
        }
    }

    private static async onMemoryDecayed(tenantId: string): Promise<void> {
        try {
            const decayResult = await AssumptionMonitor.checkForDecay(tenantId);

            if (decayResult.alerts.length > 0) {
                console.info(
                    `[Hindsight] Memory decay check for tenant ${tenantId}: ${decayResult.alerts.length} alerts`
                );
            }
        } catch (e) {
            console.warn('[Hindsight] Memory decay check failed:', e);
        }
    }
}
