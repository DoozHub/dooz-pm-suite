/**
 * Dooz PM Suite - Hono Server Entry Point
 * 
 * AI-Era Project Management Control Plane
 * Human-in-the-loop intent management, decision tracking, and organizational memory.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { timing } from 'hono/timing';
import { errorHandler } from './lib/error-handler';
import { rateLimitMiddleware } from './middleware/rate-limit';

import { intentsRoutes } from './routes/intents';
import { decisionsRoutes } from './routes/decisions';
import { ingestionRoutes } from './routes/ingestion';
import { graphRoutes } from './routes/graph';
import { assumptionsRoutes } from './routes/assumptions';
import { risksRoutes } from './routes/risks';
import { tasksRoutes } from './routes/tasks';
import { edgesRoutes } from './routes/edges';
import { insights } from './routes/insights';
import { brainWebhookRoutes } from './routes/brain-webhook';
import { sdkContext, isSdkConfigured } from './middleware/sdk';
import type { Tenant } from './lib/sdk-types';
import { metrics } from './lib/metrics';
import { getOpenApiSpec } from './lib/openapi';
import { db } from './db';

// Types
export type Env = {
    Variables: {
        tenantId: string;
        userId: string;
        tenant?: Tenant;
        dooz?: unknown;
    };
};

// Create Hono app
const app = new Hono<Env>();

// =============================================================================
// MIDDLEWARE
// =============================================================================

// Error handling (must be first)
app.use('*', errorHandler());

app.use('*', logger());
app.use('*', timing());
app.use('*', async (c, next) => {
    const start = Date.now();
    await next();
    metrics.recordHttpRequest(c.req.method, c.req.path, c.res.status, Date.now() - start);
});
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001,http://localhost:3333,http://localhost:5173')
    .split(',')
    .map((o: string) => o.trim())
    .filter(Boolean);

app.use('*', cors({
    origin: CORS_ORIGINS,
    credentials: true,
}));

app.use('/api/*', sdkContext());

if (isSdkConfigured()) {
    app.use('/api/*', async (c, next) => {
        const ctx = c.get('dooz') as Record<string, unknown> | undefined;
        if (!ctx) {
            return c.json({ error: 'Authentication required' }, 401);
        }
        await next();
    });
}

// Rate limiting
app.use('/api/*', rateLimitMiddleware());

// =============================================================================
// ROUTES
// =============================================================================

app.get('/openapi.json', (c) => {
    return c.json(getOpenApiSpec());
});

app.get('/api-docs', (c) => {
    const html = `<!DOCTYPE html>
<html>
<head>
<title>Dooz PM Suite API Docs</title>
<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
<div id="swagger-ui"></div>
<script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
<script>
SwaggerUIBundle({url: '/openapi.json', dom_id: '#swagger-ui'});
</script>
</body>
</html>`;
    return c.html(html);
});

app.get('/health', async (c) => {
    const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};
    let allHealthy = true;

    try {
        const start = Date.now();
        await db.execute({ sql: 'SELECT 1' });
        checks.db = { status: 'ok', latencyMs: Date.now() - start };
    } catch (e) {
        checks.db = { status: 'down', error: String(e) };
        allHealthy = false;
    }

    const bridgeUrl = process.env.BRIDGE_URL || 'http://localhost:3001';
    try {
        const start = Date.now();
        const res = await fetch(`${bridgeUrl}/health`, { signal: AbortSignal.timeout(5000) });
        checks.bridge = { status: res.ok ? 'ok' : 'degraded', latencyMs: Date.now() - start };
    } catch (e) {
        checks.bridge = { status: 'down', error: String(e) };
        allHealthy = false;
    }

    return c.json({
        status: allHealthy ? 'ok' : 'degraded',
        service: 'dooz-pm-suite',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        checks,
    }, allHealthy ? 200 : 503);
});

app.get('/metrics', (c) => {
    return c.text(metrics.format(), 200, { 'Content-Type': 'text/plain; version=0.0.4' });
});

// API info
app.get('/api', (c) => {
    return c.json({
        name: 'Dooz PM Suite API',
        version: 'v1',
        description: 'AI-Era Project Management Control Plane',
        endpoints: {
            intents: '/api/intents',
            decisions: '/api/decisions',
            assumptions: '/api/assumptions',
            risks: '/api/risks',
            tasks: '/api/tasks',
            edges: '/api/edges',
            ingestion: '/api/ingestion',
            graph: '/api/graph',
            insights: '/api/insights',
        },
    });
});

// Mount route modules
app.route('/api/intents', intentsRoutes);
app.route('/api/decisions', decisionsRoutes);
app.route('/api/assumptions', assumptionsRoutes);
app.route('/api/risks', risksRoutes);
app.route('/api/tasks', tasksRoutes);
app.route('/api/edges', edgesRoutes);
app.route('/api/ingestion', ingestionRoutes);
app.route('/api/graph', graphRoutes);
app.route('/api/insights', insights);

// Webhook routes (for receiving events from dooz-bridge)
app.route('/webhooks/brain', brainWebhookRoutes);

// =============================================================================
// SERVER STARTUP
// =============================================================================

const port = Number(process.env.PORT) || 3000;

console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    DOOZ PM SUITE                             ║
║         AI-Era Project Management Control Plane              ║
╠══════════════════════════════════════════════════════════════╣
║  Server running at: http://localhost:${port}                 ║
║  Environment: ${process.env.NODE_ENV || 'development'}       ║
╚══════════════════════════════════════════════════════════════╝
`);

export default {
    port,
    fetch: app.fetch,
};
