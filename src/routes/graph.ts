/**
 * Graph Routes
 *
 * Knowledge Graph API for edges and traversal.
 */

import { Hono } from 'hono';
import { eq, and, inArray, or } from 'drizzle-orm';
import { db } from '../db';
import { edges, decisions, assumptions, risks, tasks } from '../db/schema';
import { EdgeService, type NodeType, type EdgeType } from '../services/edge.service';
import { CreateEdgeSchema } from '../lib/types';

type Env = {
    Variables: {
        tenantId: string;
        userId: string;
    };
};

export const graphRoutes = new Hono<Env>();

// Get all edges for a node
graphRoutes.get('/node/:id/edges', async (c) => {
    const nodeId = c.req.param('id');
    const direction = c.req.query('direction'); // incoming | outgoing | both

    let rows;
    if (direction === 'outgoing') {
        rows = await EdgeService.getOutgoing(nodeId);
    } else if (direction === 'incoming') {
        rows = await EdgeService.getIncoming(nodeId);
    } else {
        rows = await EdgeService.getByNode(nodeId);
    }

    return c.json({ data: rows });
});

// Create an edge between nodes (human action)
graphRoutes.post('/edges', async (c) => {
    const userId = c.get('userId');

    const body = await c.req.json();
    const parsed = CreateEdgeSchema.safeParse(body);

    if (!parsed.success) {
        return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
    }

    // CreateEdgeSchema may include node types (ai_insight, evidence) that EdgeService.create
    // does not know about. Persist directly with the schema's wider text columns.
    const id = (await import('nanoid')).nanoid();
    const now = new Date().toISOString();
    await db.insert(edges).values({
        id,
        sourceId: parsed.data.sourceId,
        sourceType: parsed.data.sourceType as string,
        targetId: parsed.data.targetId,
        targetType: parsed.data.targetType as string,
        edgeType: parsed.data.edgeType as string,
        createdBy: userId,
        createdAt: now,
    });
    const [created] = await db.select().from(edges).where(eq(edges.id, id));
    return c.json({ data: created }, 201);
});

// Traverse graph from a starting node (BFS up to depth)
graphRoutes.get('/traverse/:startId', async (c) => {
    const startId = c.req.param('startId');
    const depth = Math.min(Math.max(Number(c.req.query('depth')) || 2, 1), 5);
    const edgeTypesFilter = c.req.query('edgeTypes')?.split(',').filter(Boolean) as EdgeType[] | undefined;

    const visited = new Map<string, NodeType>();
    const traversedEdges: { id: string; sourceId: string; targetId: string; edgeType: EdgeType }[] = [];
    let frontier: string[] = [startId];

    for (let i = 0; i <= depth && frontier.length > 0; i++) {
        const next: string[] = [];
        for (const id of frontier) {
            if (visited.has(id)) continue;
            // Get node type from a quick lookup; for the seed we just mark it unknown
            if (i === 0) {
                visited.set(id, 'intent');
            }
            const outgoing = await EdgeService.getOutgoing(id);
            for (const e of outgoing as Array<{ id: string; sourceId: string; targetId: string; targetType: string; edgeType: string }>) {
                if (edgeTypesFilter && !edgeTypesFilter.includes(e.edgeType as EdgeType)) continue;
                traversedEdges.push({
                    id: e.id,
                    sourceId: e.sourceId,
                    targetId: e.targetId,
                    edgeType: e.edgeType as EdgeType,
                });
                if (!visited.has(e.targetId)) {
                    visited.set(e.targetId, e.targetType as NodeType);
                    next.push(e.targetId);
                }
            }
        }
        frontier = next;
    }

    return c.json({
        data: {
            startId,
            depth,
            nodes: Array.from(visited.entries()).map(([id, type]) => ({ id, type })),
            edges: traversedEdges,
        },
    });
});

// Get graph statistics for an intent
graphRoutes.get('/stats/:intentId', async (c) => {
    const intentId = c.req.param('intentId');

    const intentEdges = await db
        .select()
        .from(edges)
        .where(or(eq(edges.sourceId, intentId), eq(edges.targetId, intentId)));

    // Collect node IDs touched by the edges
    const nodeIds = Array.from(new Set((intentEdges as Array<{ sourceId: string; targetId: string }>).flatMap((e) => [e.sourceId, e.targetId]))).filter((id) => id !== intentId);

    let decisionCount = 0;
    let assumptionCount = 0;
    let riskCount = 0;
    let taskCount = 0;

    if (nodeIds.length > 0) {
        const [d, a, r, t] = await Promise.all([
            db.select({ id: decisions.id }).from(decisions).where(inArray(decisions.id, nodeIds as string[])),
            db.select({ id: assumptions.id }).from(assumptions).where(inArray(assumptions.id, nodeIds as string[])),
            db.select({ id: risks.id }).from(risks).where(inArray(risks.id, nodeIds as string[])),
            db.select({ id: tasks.id }).from(tasks).where(inArray(tasks.id, nodeIds as string[])),
        ]);
        decisionCount = d.length;
        assumptionCount = a.length;
        riskCount = r.length;
        taskCount = t.length;
    }

    const nodeCount = nodeIds.length + 1; // +1 for the intent itself

    return c.json({
        data: {
            intentId,
            nodeCount,
            edgeCount: intentEdges.length,
            decisionCount,
            assumptionCount,
            riskCount,
            taskCount,
        },
    });
});
