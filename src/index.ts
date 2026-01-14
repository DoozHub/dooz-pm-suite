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

import { intentsRoutes } from './routes/intents';
import { decisionsRoutes } from './routes/decisions';
import { ingestionRoutes } from './routes/ingestion';
import { graphRoutes } from './routes/graph';

// Types
export type Env = {
    Variables: {
        tenantId: string;
        userId: string;
    };
};

// Create Hono app
const app = new Hono<Env>();

// =============================================================================
// MIDDLEWARE
// =============================================================================

app.use('*', logger());
app.use('*', timing());
app.use('*', cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
}));

// Tenant context middleware (placeholder - will integrate with @dooz/sdk)
app.use('/api/*', async (c, next) => {
    // TODO: Integrate with @dooz/sdk for real tenant resolution
    const tenantId = c.req.header('X-Tenant-ID') || 'dev-tenant';
    const userId = c.req.header('X-User-ID') || 'dev-user';

    c.set('tenantId', tenantId);
    c.set('userId', userId);

    await next();
});

// =============================================================================
// ROUTES
// =============================================================================

// Health check
app.get('/health', (c) => {
    return c.json({
        status: 'ok',
        service: 'dooz-pm-suite',
        version: '0.1.0',
        timestamp: new Date().toISOString(),
    });
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
            ingestion: '/api/ingestion',
            graph: '/api/graph',
        },
    });
});

// Mount route modules
app.route('/api/intents', intentsRoutes);
app.route('/api/decisions', decisionsRoutes);
app.route('/api/ingestion', ingestionRoutes);
app.route('/api/graph', graphRoutes);

// =============================================================================
// SERVER STARTUP
// =============================================================================

const port = Number(process.env.PORT) || 3000;

console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    DOOZ PM SUITE                              ║
║         AI-Era Project Management Control Plane              ║
╠══════════════════════════════════════════════════════════════╣
║  Server running at: http://localhost:${port}                    ║
║  Environment: ${process.env.NODE_ENV || 'development'}                             ║
╚══════════════════════════════════════════════════════════════╝
`);

export default {
    port,
    fetch: app.fetch,
};
