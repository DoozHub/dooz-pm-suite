/**
 * Decisions Routes
 * 
 * REST API for the Decision Ledger (append-only).
 */

import { Hono } from 'hono';
import { DecisionService } from '../services/decision.service';
import { CreateDecisionSchema } from '../lib/types';

type Env = {
    Variables: {
        tenantId: string;
        userId: string;
    };
};

export const decisionsRoutes = new Hono<Env>();

// Get decision ledger for an intent
decisionsRoutes.get('/intent/:intentId', async (c) => {
    const intentId = c.req.param('intentId');
    const includeSuperseded = c.req.query('all') === 'true';

    const decisions = includeSuperseded
        ? await DecisionService.getLedger(intentId)
        : await DecisionService.getActiveByIntent(intentId);

    return c.json({ data: decisions });
});

// Get single decision
decisionsRoutes.get('/:id', async (c) => {
    const id = c.req.param('id');

    const decision = await DecisionService.getById(id);
    if (!decision) {
        return c.json({ error: 'Decision not found' }, 404);
    }

    return c.json({ data: decision });
});

// Commit new decision (append to ledger)
decisionsRoutes.post('/', async (c) => {
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');

    const body = await c.req.json();
    const parsed = CreateDecisionSchema.safeParse(body);

    if (!parsed.success) {
        return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
    }

    const decision = await DecisionService.commit(tenantId, userId, parsed.data);
    return c.json({ data: decision }, 201);
});

// Supersede a decision (mark old as superseded, create new)
decisionsRoutes.post('/:id/supersede', async (c) => {
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');
    const originalId = c.req.param('id');

    const body = await c.req.json();
    const parsed = CreateDecisionSchema.safeParse(body);

    if (!parsed.success) {
        return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
    }

    const result = await DecisionService.supersede(tenantId, userId, originalId, parsed.data);

    if (!result) {
        return c.json({ error: 'Decision not found or already superseded' }, 400);
    }

    return c.json({
        data: result.replacement,
        superseded: result.original,
    }, 201);
});
