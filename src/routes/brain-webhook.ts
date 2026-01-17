/**
 * Dooz Bridge - Webhook Routes for Brain
 * 
 * Receives intents from Brain and processes them.
 */

import { Hono } from 'hono';
import { db } from '../db';
import { intents, aiProposals } from '../db/schema';
import { nanoid } from 'nanoid';

export const brainWebhookRoutes = new Hono();

// POST /webhooks/brain - Receive intents from Brain via dooz-bridge
brainWebhookRoutes.post('/', async (c) => {
    const eventId = c.req.header('X-Bridge-Event-Id');
    const topic = c.req.header('X-Bridge-Topic');
    const source = c.req.header('X-Bridge-Source');

    console.log(`[Webhook] Received ${topic} from ${source} (${eventId})`);

    const payload = await c.req.json();

    // Handle Brain Pulse intents
    if (topic === 'brain.pulse.intent.created') {
        const intentType = payload.intent_type;

        if (intentType === 'SURFACE_TASK') {
            // Brain wants to surface a stale task - create AI proposal
            await db.insert(aiProposals).values({
                id: nanoid(),
                intentId: payload.memory_id || null,
                proposalType: 'question',
                content: JSON.stringify({
                    type: 'BRAIN_SURFACE',
                    reason: payload.reason,
                    brainPulseId: payload.id,
                }),
                modelUsed: 'brain',
                status: 'pending',
            });
        } else if (intentType === 'REQUEST_INPUT') {
            // Brain is asking for missing information
            await db.insert(aiProposals).values({
                id: nanoid(),
                intentId: null,
                proposalType: 'question',
                content: JSON.stringify({
                    type: 'BRAIN_REQUEST',
                    question: payload.payload?.question,
                    context: payload.payload?.context,
                    brainPulseId: payload.id,
                }),
                modelUsed: 'brain',
                status: 'pending',
            });
        }

        return c.json({ success: true, processed: intentType });
    }

    // Handle Brain memory events
    if (topic === 'brain.memory.created') {
        console.log(`[Webhook] Brain memory created: ${payload.title}`);
        // Could cross-reference with PM decisions
        return c.json({ success: true, processed: 'memory.created' });
    }

    return c.json({ success: true, processed: 'unknown' });
});
