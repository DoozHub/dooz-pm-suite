/**
 * Edge Service
 * 
 * Knowledge graph edges connecting entities.
 */

import { nanoid } from 'nanoid';
import { eq, or, and } from 'drizzle-orm';
import { db } from '../db';
import { edges, type Edge } from '../db/schema';

export type NodeType = 'intent' | 'decision' | 'task' | 'assumption' | 'risk';
export type EdgeType = 'led_to' | 'depends_on' | 'invalidates' | 'supports' | 'blocks' | 'derived_from' | 'mitigates' | 'assumes';

export class EdgeService {
    /**
     * Create an edge between two nodes
     */
    static async create(
        createdBy: string,
        data: {
            sourceId: string;
            sourceType: NodeType;
            targetId: string;
            targetType: NodeType;
            edgeType: EdgeType;
        }
    ): Promise<Edge> {
        const id = nanoid();

        await db.insert(edges).values({
            id,
            sourceId: data.sourceId,
            sourceType: data.sourceType,
            targetId: data.targetId,
            targetType: data.targetType,
            edgeType: data.edgeType,
            createdBy,
        });

        const [edge] = await db.select().from(edges).where(eq(edges.id, id));
        return edge;
    }

    /**
     * Get all edges for a node (as source or target)
     */
    static async getByNode(nodeId: string): Promise<Edge[]> {
        return db.select().from(edges).where(
            or(
                eq(edges.sourceId, nodeId),
                eq(edges.targetId, nodeId)
            )
        );
    }

    /**
     * Get outgoing edges from a node
     */
    static async getOutgoing(nodeId: string): Promise<Edge[]> {
        return db.select().from(edges).where(eq(edges.sourceId, nodeId));
    }

    /**
     * Get incoming edges to a node
     */
    static async getIncoming(nodeId: string): Promise<Edge[]> {
        return db.select().from(edges).where(eq(edges.targetId, nodeId));
    }

    /**
     * Get edges by type
     */
    static async getByType(edgeType: EdgeType): Promise<Edge[]> {
        return db.select().from(edges).where(eq(edges.edgeType, edgeType));
    }

    /**
     * Delete an edge
     */
    static async delete(id: string): Promise<boolean> {
        await db.delete(edges).where(eq(edges.id, id));
        return true;
    }

    /**
     * Delete all edges for a node
     */
    static async deleteByNode(nodeId: string): Promise<boolean> {
        await db.delete(edges).where(
            or(
                eq(edges.sourceId, nodeId),
                eq(edges.targetId, nodeId)
            )
        );
        return true;
    }

    /**
     * Build graph data for visualization
     */
    static async buildGraph(intentId: string): Promise<{
        nodes: { id: string; type: NodeType }[];
        edges: Edge[];
    }> {
        // Get all edges where source or target is related to this intent
        const allEdges = await db.select().from(edges);

        // Extract unique nodes
        const nodeSet = new Map<string, NodeType>();
        for (const edge of allEdges) {
            nodeSet.set(edge.sourceId, edge.sourceType as NodeType);
            nodeSet.set(edge.targetId, edge.targetType as NodeType);
        }

        const nodes = Array.from(nodeSet.entries()).map(([id, type]) => ({ id, type }));

        return { nodes, edges: allEdges };
    }
}
