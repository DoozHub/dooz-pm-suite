/**
 * Assumptions Routes
 * 
 * REST API for assumption management.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { AssumptionService } from '../services/assumption.service';

type Env = {
    Variables: {
        tenantId: string;
        userId: string;
    };
};

export const assumptionsRoutes = new Hono<Env>();

const CreateAssumptionSchema = z.object({
    intentId: z.string(),
    assumptionStatement: z.string().min(1),
    confidenceLevel: z.number().min(0).max(1).optional(),
    createdFrom: z.enum(['human', 'ai']).optional(),
    expiryHint: z.string().optional(),
});

const UpdateAssumptionSchema = z.object({
    assumptionStatement: z.string().min(1).optional(),
    confidenceLevel: z.number().min(0).max(1).optional(),
    expiryHint: z.string().optional(),
    status: z.enum(['active', 'invalidated']).optional(),
});

// Get assumptions for an intent
assumptionsRoutes.get('/', async (c) => {
    const intentId = c.req.query('intentId');
    if (!intentId) {
        return c.json({ error: 'intentId query parameter required' }, 400);
    }

    const assumptions = await AssumptionService.listByIntent(intentId);
    return c.json({ data: assumptions, count: assumptions.length });
});

// Get single assumption
assumptionsRoutes.get('/:id', async (c) => {
    const assumption = await AssumptionService.getById(c.req.param('id'));
    if (!assumption) {
        return c.json({ error: 'Assumption not found' }, 404);
    }
    return c.json({ data: assumption });
});

// Create assumption
assumptionsRoutes.post('/', async (c) => {
    const tenantId = c.get('tenantId');
    const body = await c.req.json();
    const parsed = CreateAssumptionSchema.safeParse(body);

    if (!parsed.success) {
        return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
    }

    const assumption = await AssumptionService.create(tenantId, parsed.data);
    return c.json({ data: assumption }, 201);
});

// Update assumption
assumptionsRoutes.patch('/:id', async (c) => {
    const body = await c.req.json();
    const parsed = UpdateAssumptionSchema.safeParse(body);

    if (!parsed.success) {
        return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
    }

    const assumption = await AssumptionService.update(c.req.param('id'), parsed.data);
    if (!assumption) {
        return c.json({ error: 'Assumption not found' }, 404);
    }
    return c.json({ data: assumption });
});

// Invalidate assumption
assumptionsRoutes.post('/:id/invalidate', async (c) => {
    const assumption = await AssumptionService.invalidate(c.req.param('id'));
    if (!assumption) {
        return c.json({ error: 'Assumption not found' }, 404);
    }
    return c.json({ data: assumption, message: 'Assumption invalidated' });
});

// Delete assumption
assumptionsRoutes.delete('/:id', async (c) => {
    await AssumptionService.delete(c.req.param('id'));
    return c.json({ message: 'Deleted' });
});
