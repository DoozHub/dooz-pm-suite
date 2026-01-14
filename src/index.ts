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
import { assumptionsRoutes } from './routes/assumptions';
import { risksRoutes } from './routes/risks';
import { tasksRoutes } from './routes/tasks';
import { edgesRoutes } from './routes/edges';
import { sdkContext, isSdkConfigured } from './middleware/sdk';
import type { Tenant } from '@dooz/sdk';

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

app.use('*', logger());
app.use('*', timing());
app.use('*', cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
}));

// SDK context middleware - resolves tenant and user
app.use('/api/*', sdkContext());

// =============================================================================
// ROUTES
// =============================================================================

// Health check
app.get('/health', (c) => {
    return c.json({
        status: 'ok',
        service: 'dooz-pm-suite',
        version: '0.2.0',
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
            assumptions: '/api/assumptions',
            risks: '/api/risks',
            tasks: '/api/tasks',
            edges: '/api/edges',
            ingestion: '/api/ingestion',
            graph: '/api/graph',
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
