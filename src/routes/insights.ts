/**
 * Insights Routes
 * 
 * API endpoints for health scores, insights, and assumption monitoring.
 */

import { Hono } from 'hono';
import { AssumptionMonitor } from '../services/assumption-monitor';
import { IntentHealthService } from '../services/intent-health';
import { InsightsService } from '../services/insights';

const insights = new Hono();

/**
 * GET /api/insights/health/:intentId
 * Get health score for an intent
 */
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

/**
 * GET /api/insights/health
 * Get health scores for all intents (requires tenantId query param)
 */
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

/**
 * GET /api/insights/assumptions
 * Check all assumptions for decay
 */
insights.get('/assumptions', async (c) => {
    try {
        const result = await AssumptionMonitor.checkForDecay();
        return c.json(result);
    } catch (e) {
        console.error('[Route] Assumption check failed:', e);
        return c.json({ error: 'Failed to check assumptions' }, 500);
    }
});

/**
 * GET /api/insights/assumptions/:intentId
 * Check assumptions for a specific intent
 */
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

/**
 * POST /api/insights/assumptions/:id/invalidate
 * Mark an assumption as invalidated
 */
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

/**
 * GET /api/insights/:intentId
 * Get AI-powered insights for an intent
 */
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
