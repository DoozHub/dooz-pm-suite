/**
 * Intents Routes
 * 
 * REST API for Intent management with state machine enforcement.
 */

import { Hono } from 'hono';
import { IntentService } from '../services/intent.service';
import { CreateIntentSchema, UpdateIntentSchema, IntentState } from '../lib/types';

type Env = {
    Variables: {
        tenantId: string;
        userId: string;
    };
};

export const intentsRoutes = new Hono<Env>();

// List all intents (optionally filter by state)
intentsRoutes.get('/', async (c) => {
    const tenantId = c.get('tenantId');
    const state = c.req.query('state') as IntentState | undefined;

    const intents = await IntentService.list(tenantId, state);
    return c.json({ data: intents });
});

// Get single intent
intentsRoutes.get('/:id', async (c) => {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');

    const intent = await IntentService.getById(tenantId, id);
    if (!intent) {
        return c.json({ error: 'Intent not found' }, 404);
    }

    return c.json({ data: intent });
});

// Create new intent
intentsRoutes.post('/', async (c) => {
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');

    const body = await c.req.json();
    const parsed = CreateIntentSchema.safeParse(body);

    if (!parsed.success) {
        return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
    }

    const intent = await IntentService.create(tenantId, userId, parsed.data);
    return c.json({ data: intent }, 201);
});

// Update intent
intentsRoutes.patch('/:id', async (c) => {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');

    const body = await c.req.json();
    const parsed = UpdateIntentSchema.safeParse(body);

    if (!parsed.success) {
        return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
    }

    const intent = await IntentService.update(tenantId, id, parsed.data);
    if (!intent) {
        return c.json({ error: 'Intent not found' }, 404);
    }

    return c.json({ data: intent });
});

// Transition intent state (explicit human action)
intentsRoutes.post('/:id/transition', async (c) => {
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');
    const id = c.req.param('id');

    const body = await c.req.json();
    const newState = body.state as IntentState;

    if (!newState || !['research', 'planning', 'execution', 'archived'].includes(newState)) {
        return c.json({ error: 'Invalid state. Must be: research, planning, execution, or archived' }, 400);
    }

    const result = await IntentService.transition(tenantId, userId, id, newState);

    if (!result.success) {
        return c.json({ error: result.error }, 400);
    }

    return c.json({ data: result.intent });
});

// Mark intent as reviewed by human
intentsRoutes.post('/:id/review', async (c) => {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');

    const intent = await IntentService.markReviewed(tenantId, id);
    if (!intent) {
        return c.json({ error: 'Intent not found' }, 404);
    }

    return c.json({ data: intent });
});
