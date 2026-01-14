/**
 * Risks Routes
 * 
 * REST API for risk management.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { RiskService } from '../services/risk.service';

type Env = {
    Variables: {
        tenantId: string;
        userId: string;
    };
};

export const risksRoutes = new Hono<Env>();

const CreateRiskSchema = z.object({
    intentId: z.string(),
    riskStatement: z.string().min(1),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    likelihood: z.enum(['low', 'medium', 'high']).optional(),
    createdFrom: z.enum(['human', 'ai']).optional(),
    mitigationNotes: z.string().optional(),
});

const UpdateRiskSchema = z.object({
    riskStatement: z.string().min(1).optional(),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    likelihood: z.enum(['low', 'medium', 'high']).optional(),
    mitigationNotes: z.string().optional(),
    status: z.enum(['active', 'mitigated', 'accepted']).optional(),
});

// Get risks for an intent
risksRoutes.get('/', async (c) => {
    const intentId = c.req.query('intentId');
    if (!intentId) {
        return c.json({ error: 'intentId query parameter required' }, 400);
    }

    const risks = await RiskService.listByIntent(intentId);
    return c.json({ data: risks, count: risks.length });
});

// Get single risk
risksRoutes.get('/:id', async (c) => {
    const risk = await RiskService.getById(c.req.param('id'));
    if (!risk) {
        return c.json({ error: 'Risk not found' }, 404);
    }
    return c.json({ data: risk });
});

// Create risk
risksRoutes.post('/', async (c) => {
    const tenantId = c.get('tenantId');
    const body = await c.req.json();
    const parsed = CreateRiskSchema.safeParse(body);

    if (!parsed.success) {
        return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
    }

    const risk = await RiskService.create(tenantId, parsed.data);
    return c.json({ data: risk }, 201);
});

// Update risk
risksRoutes.patch('/:id', async (c) => {
    const body = await c.req.json();
    const parsed = UpdateRiskSchema.safeParse(body);

    if (!parsed.success) {
        return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
    }

    const risk = await RiskService.update(c.req.param('id'), parsed.data);
    if (!risk) {
        return c.json({ error: 'Risk not found' }, 404);
    }
    return c.json({ data: risk });
});

// Mitigate risk
risksRoutes.post('/:id/mitigate', async (c) => {
    const body = await c.req.json();
    const notes = body.mitigationNotes || '';

    const risk = await RiskService.mitigate(c.req.param('id'), notes);
    if (!risk) {
        return c.json({ error: 'Risk not found' }, 404);
    }
    return c.json({ data: risk, message: 'Risk mitigated' });
});

// Delete risk
risksRoutes.delete('/:id', async (c) => {
    await RiskService.delete(c.req.param('id'));
    return c.json({ message: 'Deleted' });
});
