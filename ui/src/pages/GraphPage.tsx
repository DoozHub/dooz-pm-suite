/**
 * Graph Page
 * 
 * Full-page knowledge graph visualization.
 */

import { useState, useEffect } from 'react';
import { KnowledgeGraph } from '../components/KnowledgeGraph';
import '../components/KnowledgeGraph.css';
import './GraphPage.css';

interface GraphNode {
    id: string;
    type: 'intent' | 'decision' | 'task' | 'assumption' | 'risk';
    label?: string;
}

interface GraphEdge {
    id: string;
    sourceId: string;
    targetId: string;
    edgeType: string;
}

// Demo data for visualization
const DEMO_NODES: GraphNode[] = [
    { id: 'i1', type: 'intent', label: 'Build PM Suite' },
    { id: 'd1', type: 'decision', label: 'Use Hono' },
    { id: 'd2', type: 'decision', label: 'Use Drizzle ORM' },
    { id: 'a1', type: 'assumption', label: 'SQLite OK for dev' },
    { id: 'r1', type: 'risk', label: 'Schema migration' },
    { id: 't1', type: 'task', label: 'Create API routes' },
    { id: 't2', type: 'task', label: 'Build UI' },
];

const DEMO_EDGES: GraphEdge[] = [
    { id: 'e1', sourceId: 'i1', targetId: 'd1', edgeType: 'led_to' },
    { id: 'e2', sourceId: 'i1', targetId: 'd2', edgeType: 'led_to' },
    { id: 'e3', sourceId: 'd2', targetId: 'a1', edgeType: 'assumes' },
    { id: 'e4', sourceId: 'a1', targetId: 'r1', edgeType: 'invalidates' },
    { id: 'e5', sourceId: 'd1', targetId: 't1', edgeType: 'derived_from' },
    { id: 'e6', sourceId: 'd2', targetId: 't2', edgeType: 'derived_from' },
    { id: 'e7', sourceId: 't2', targetId: 't1', edgeType: 'depends_on' },
];

export function GraphPage() {
    const [nodes, setNodes] = useState<GraphNode[]>([]);
    const [edges, setEdges] = useState<GraphEdge[]>([]);
    const [useDemoData, setUseDemoData] = useState(true);

    useEffect(() => {
        if (useDemoData) {
            setNodes(DEMO_NODES);
            setEdges(DEMO_EDGES);
        } else {
            // TODO: Fetch from API
            setNodes([]);
            setEdges([]);
        }
    }, [useDemoData]);

    const handleNodeClick = (node: GraphNode) => {
        console.log('Node clicked:', node);
    };

    return (
        <div className="graph-page">
            <header className="graph-page-header">
                <div>
                    <h1>Knowledge Graph</h1>
                    <p className="subtitle">Visualize relationships between intents, decisions, and tasks</p>
                </div>
                <label className="demo-toggle">
                    <input
                        type="checkbox"
                        checked={useDemoData}
                        onChange={(e) => setUseDemoData(e.target.checked)}
                    />
                    <span>Show demo data</span>
                </label>
            </header>

            <div className="graph-wrapper">
                <KnowledgeGraph
                    nodes={nodes}
                    edges={edges}
                    onNodeClick={handleNodeClick}
                />
            </div>
        </div>
    );
}
