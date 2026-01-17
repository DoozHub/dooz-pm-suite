/**
 * Dooz Bridge Client
 * 
 * HTTP client for publishing events to dooz-bridge.
 */

const BRIDGE_URL = process.env.BRIDGE_URL || 'http://localhost:3001';
const APP_ID = 'dooz-pm-suite';

export class BridgeClient {
    /**
     * Publish an event to the bridge
     */
    static async emit(topic: string, payload: Record<string, unknown>, correlationId?: string) {
        try {
            const response = await fetch(`${BRIDGE_URL}/api/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-App-Id': APP_ID,
                },
                body: JSON.stringify({
                    topic,
                    payload,
                    correlationId,
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                console.error(`[Bridge] Failed to emit ${topic}:`, error);
                return false;
            }

            const result = await response.json();
            console.log(`[Bridge] Emitted ${topic} → ${result.subscriberCount} subscribers`);
            return true;
        } catch (error) {
            console.error(`[Bridge] Connection error for ${topic}:`, error);
            return false;
        }
    }

    /**
     * Subscribe to a topic pattern
     */
    static async subscribe(topicPattern: string, webhookUrl?: string) {
        try {
            const response = await fetch(`${BRIDGE_URL}/api/subscriptions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    appId: APP_ID,
                    topicPattern,
                    webhookUrl,
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                console.error(`[Bridge] Subscribe failed:`, error);
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error(`[Bridge] Connection error:`, error);
            return null;
        }
    }

    /**
     * Poll for events matching subscriptions
     */
    static async poll(since?: string, limit = 50) {
        try {
            const params = new URLSearchParams();
            if (since) params.set('since', since);
            params.set('limit', String(limit));

            const response = await fetch(`${BRIDGE_URL}/api/events?${params}`, {
                headers: {
                    'X-App-Id': APP_ID,
                },
            });

            if (!response.ok) return [];

            const result = await response.json();
            return result.data || [];
        } catch (error) {
            console.error(`[Bridge] Poll error:`, error);
            return [];
        }
    }
}

// Topic constants for PM Suite
export const PmTopics = {
    INTENT_CREATED: 'pm.intent.created',
    INTENT_TRANSITIONED: 'pm.intent.transitioned',
    DECISION_COMMITTED: 'pm.decision.committed',
    TASK_COMPLETED: 'pm.task.completed',
    ASSUMPTION_INVALIDATED: 'pm.assumption.invalidated',
    RISK_TRIGGERED: 'pm.risk.triggered',
} as const;
