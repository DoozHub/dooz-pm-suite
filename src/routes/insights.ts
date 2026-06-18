/**
 * Insights Routes
 * 
 * API endpoints for health scores, insights, and assumption monitoring.
 */

import { Hono } from 'hono';
import { AssumptionMonitor } from '../services/assumption-monitor';
import { IntentHealthService } from '../services/intent-health';
import { InsightsService } from '../services/insights';
import { HindsightLifecycle } from '../services/hindsight-lifecycle';

const insights = new Hono();

insights.get('/health/:intentId', async (c) => {
    const intentId = c.req.param('intentId');

    try {
        const health = await IntentHealthService.calculateHealth(intentId);
        return c.json(health);
    } catch (e) {
        console.error('[Route] Health check failed:', e);
        return c.json({ error: 'Failed to calculate health' }, 500);
    }
});

insights.get('/health', async (c) => {
    const tenantId = c.req.query('tenantId') || 'default';

    try {
        const scores = await IntentHealthService.getAllHealth(tenantId);
        return c.json({ scores, count: scores.length });
    } catch (e) {
        console.error('[Route] All health check failed:', e);
        return c.json({ error: 'Failed to get health scores' }, 500);
    }
});

insights.get('/assumptions', async (c) => {
    try {
        const result = await AssumptionMonitor.checkForDecay();
        return c.json(result);
    } catch (e) {
        console.error('[Route] Assumption check failed:', e);
        return c.json({ error: 'Failed to check assumptions' }, 500);
    }
});

insights.get('/assumptions/:intentId', async (c) => {
    const intentId = c.req.param('intentId');

    try {
        const result = await AssumptionMonitor.checkIntentAssumptions(intentId);
        return c.json(result);
    } catch (e) {
        console.error('[Route] Intent assumption check failed:', e);
        return c.json({ error: 'Failed to check assumptions' }, 500);
    }
});

insights.post('/assumptions/:id/invalidate', async (c) => {
    const assumptionId = c.req.param('id');

    try {
        await AssumptionMonitor.invalidate(assumptionId);
        return c.json({ success: true, assumptionId });
    } catch (e) {
        console.error('[Route] Invalidate failed:', e);
        return c.json({ error: 'Failed to invalidate assumption' }, 500);
    }
});

insights.post('/generate', async (c) => {
    const tenantId = c.req.query('tenantId') || 'default';
    const intentId = c.req.query('intentId');

    try {
        if (intentId) {
            const result = await InsightsService.getIntentInsights(intentId, tenantId);
            return c.json(result);
        }

        const allHealth = await IntentHealthService.getAllHealth(tenantId);
        const lowHealthIntents = allHealth.filter((h: any) => h.score < 0.6);

        const allInsights = [];
        for (const health of lowHealthIntents.slice(0, 10)) {
            try {
                const result = await InsightsService.getIntentInsights(health.intentId, tenantId);
                allInsights.push(...result.insights);
            } catch {}
        }

        const decayResult = await AssumptionMonitor.checkForDecay(tenantId);

        return c.json({
            insights: allInsights,
            assumptionAlerts: decayResult.alerts,
            totalChecked: decayResult.totalChecked,
            generatedAt: new Date().toISOString(),
        });
    } catch (e) {
        console.error('[Route] Generate insights failed:', e);
        return c.json({ error: 'Failed to generate insights' }, 500);
    }
});

insights.post('/hindsight/start', async (c) => {
    HindsightLifecycle.start();
    return c.json({ status: 'started', message: 'Hindsight lifecycle listening to bridge events' });
});

insights.post('/hindsight/stop', async (c) => {
    HindsightLifecycle.stop();
    return c.json({ status: 'stopped' });
});

insights.get('/:intentId', async (c) => {
    const intentId = c.req.param('intentId');
    const tenantId = c.req.query('tenantId') || 'default';

    try {
        const result = await InsightsService.getIntentInsights(intentId, tenantId);
        return c.json(result);
    } catch (e) {
        console.error('[Route] Insights failed:', e);
        return c.json({ error: 'Failed to get insights' }, 500);
    }
});

export { insights };
