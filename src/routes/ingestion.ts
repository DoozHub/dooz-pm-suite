/**
 * Ingestion Routes
 * 
 * AI Chat/Document ingestion with human confirmation flow.
 */

import { Hono } from 'hono';
import { IngestionRequestSchema } from '../lib/types';

type Env = {
    Variables: {
        tenantId: string;
        userId: string;
    };
};

export const ingestionRoutes = new Hono<Env>();

// Upload and process content for AI extraction
ingestionRoutes.post('/', async (c) => {
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');

    const body = await c.req.json();
    const parsed = IngestionRequestSchema.safeParse(body);

    if (!parsed.success) {
        return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
    }

    // TODO: Integrate with @dooz/ai-router for extraction
    // For now, return a placeholder response
    return c.json({
        message: 'Ingestion queued for processing',
        data: {
            intentId: parsed.data.intentId || 'new-intent-candidate',
            sourceType: parsed.data.sourceType,
            status: 'processing',
            proposals: [],  // Will be populated by AI extraction
        },
    }, 202);
});

// Get pending AI proposals for review
ingestionRoutes.get('/proposals', async (c) => {
    const tenantId = c.get('tenantId');
    const intentId = c.req.query('intentId');

    // TODO: Fetch from ai_proposals table
    return c.json({
        data: [],
        message: 'AI proposal review endpoint - implementation pending @dooz/ai-router',
    });
});

// Accept an AI proposal (human confirmation)
ingestionRoutes.post('/proposals/:id/accept', async (c) => {
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');
    const proposalId = c.req.param('id');

    // TODO: Update proposal status and create corresponding entity
    return c.json({
        message: 'Proposal accepted',
        proposalId,
    });
});

// Reject an AI proposal
ingestionRoutes.post('/proposals/:id/reject', async (c) => {
    const tenantId = c.get('tenantId');
    const proposalId = c.req.param('id');

    // TODO: Update proposal status
    return c.json({
        message: 'Proposal rejected',
        proposalId,
    });
});

// Park an AI proposal for later
ingestionRoutes.post('/proposals/:id/park', async (c) => {
    const tenantId = c.get('tenantId');
    const proposalId = c.req.param('id');

    // TODO: Update proposal status
    return c.json({
        message: 'Proposal parked',
        proposalId,
    });
});
