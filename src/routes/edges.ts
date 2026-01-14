/**
 * Edges Routes
 * 
 * REST API for knowledge graph edge management.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { EdgeService } from '../services/edge.service';

type Env = {
    Variables: {
        tenantId: string;
        userId: string;
    };
};

export const edgesRoutes = new Hono<Env>();

const NodeTypes = ['intent', 'decision', 'task', 'assumption', 'risk'] as const;
const EdgeTypes = ['led_to', 'depends_on', 'invalidates', 'supports', 'blocks', 'derived_from', 'mitigates', 'assumes'] as const;

const CreateEdgeSchema = z.object({
    sourceId: z.string(),
    sourceType: z.enum(NodeTypes),
    targetId: z.string(),
    targetType: z.enum(NodeTypes),
    edgeType: z.enum(EdgeTypes),
});

// Get edges for a node
edgesRoutes.get('/', async (c) => {
    const nodeId = c.req.query('nodeId');
    const direction = c.req.query('direction'); // 'in' | 'out' | undefined (both)

    if (!nodeId) {
        return c.json({ error: 'nodeId query parameter required' }, 400);
    }

    let edges;
    if (direction === 'in') {
        edges = await EdgeService.getIncoming(nodeId);
    } else if (direction === 'out') {
        edges = await EdgeService.getOutgoing(nodeId);
    } else {
        edges = await EdgeService.getByNode(nodeId);
    }

    return c.json({ data: edges, count: edges.length });
});

// Create edge
edgesRoutes.post('/', async (c) => {
    const userId = c.get('userId');
    const body = await c.req.json();
    const parsed = CreateEdgeSchema.safeParse(body);

    if (!parsed.success) {
        return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
    }

    const edge = await EdgeService.create(userId, parsed.data);
    return c.json({ data: edge }, 201);
});

// Delete edge
edgesRoutes.delete('/:id', async (c) => {
    await EdgeService.delete(c.req.param('id'));
    return c.json({ message: 'Deleted' });
});

// Get graph data for visualization
edgesRoutes.get('/graph/:intentId', async (c) => {
    const intentId = c.req.param('intentId');
    const graph = await EdgeService.buildGraph(intentId);
    return c.json({ data: graph });
});
