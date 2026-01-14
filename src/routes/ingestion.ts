/**
 * Ingestion Routes
 * 
 * AI Chat/Document ingestion with human confirmation flow.
 */

import { Hono } from 'hono';
import { IngestionRequestSchema } from '../lib/types';
import { ingestionService } from '../services/ingestion.service';
import { isAiAvailable } from '../ai';

type Env = {
    Variables: {
        tenantId: string;
        userId: string;
    };
};

export const ingestionRoutes = new Hono<Env>();

// Check AI availability
ingestionRoutes.get('/status', async (c) => {
    return c.json({
        aiAvailable: isAiAvailable(),
        message: isAiAvailable()
            ? 'AI router is configured and ready'
            : 'AI not configured. Set OPENROUTER_API_KEY or OLLAMA_ENABLED=true',
    });
});

// Upload and process content for AI extraction
ingestionRoutes.post('/', async (c) => {
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');

    const body = await c.req.json();
    const parsed = IngestionRequestSchema.safeParse(body);

    if (!parsed.success) {
        return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
    }

    const result = await ingestionService.process(tenantId, userId, parsed.data);

    if (result.error) {
        return c.json({
            message: 'Processing completed with issues',
            error: result.error,
            proposals: result.proposals,
        }, 202);
    }

    return c.json({
        message: `Extracted ${result.proposals.length} proposals for review`,
        data: {
            proposals: result.proposals,
            sourceType: parsed.data.sourceType,
            intentId: parsed.data.intentId,
        },
    }, 201);
});

// Get pending AI proposals for review
ingestionRoutes.get('/proposals', async (c) => {
    const intentId = c.req.query('intentId');

    if (!intentId) {
        return c.json({ error: 'intentId query parameter required' }, 400);
    }

    const proposals = await ingestionService.getPendingProposals(intentId);

    return c.json({
        data: proposals,
        count: proposals.length,
    });
});

// Accept an AI proposal (human confirmation)
ingestionRoutes.post('/proposals/:id/accept', async (c) => {
    const userId = c.get('userId');
    const proposalId = c.req.param('id');

    const result = await ingestionService.acceptProposal(proposalId, userId);

    if (!result.success) {
        return c.json({ error: result.error }, 400);
    }

    return c.json({
        message: 'Proposal accepted',
        proposalId,
    });
});

// Reject an AI proposal
ingestionRoutes.post('/proposals/:id/reject', async (c) => {
    const userId = c.get('userId');
    const proposalId = c.req.param('id');

    const result = await ingestionService.rejectProposal(proposalId, userId);

    if (!result.success) {
        return c.json({ error: result.error }, 400);
    }

    return c.json({
        message: 'Proposal rejected',
        proposalId,
    });
});

// Park an AI proposal for later
ingestionRoutes.post('/proposals/:id/park', async (c) => {
    const userId = c.get('userId');
    const proposalId = c.req.param('id');

    const result = await ingestionService.parkProposal(proposalId, userId);

    if (!result.success) {
        return c.json({ error: result.error }, 400);
    }

    return c.json({
        message: 'Proposal parked for later',
        proposalId,
    });
});
