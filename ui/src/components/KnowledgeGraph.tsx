/**
 * KnowledgeGraph Component
 * 
 * Interactive graph visualization using Cytoscape.js
 */

import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import type { ElementDefinition, Core } from 'cytoscape';
import { motion } from 'framer-motion';
import { Network, ZoomIn, ZoomOut, Maximize2, RefreshCw } from 'lucide-react';
import './KnowledgeGraph.css';

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

interface KnowledgeGraphProps {
    nodes: GraphNode[];
    edges: GraphEdge[];
    onNodeClick?: (node: GraphNode) => void;
    onRefresh?: () => void;
}

const NODE_COLORS: Record<string, string> = {
    intent: '#6366F1',
    decision: '#10B981',
    task: '#3B82F6',
    assumption: '#F59E0B',
    risk: '#EF4444',
};

const EDGE_COLORS: Record<string, string> = {
    led_to: '#6366F1',
    depends_on: '#3B82F6',
    invalidates: '#EF4444',
    supports: '#10B981',
    blocks: '#F59E0B',
    derived_from: '#8B5CF6',
    mitigates: '#10B981',
    assumes: '#F59E0B',
};

export function KnowledgeGraph({ nodes, edges, onNodeClick, onRefresh }: KnowledgeGraphProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const cyRef = useRef<Core | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Convert to Cytoscape elements
        const elements: ElementDefinition[] = [
            // Nodes
            ...nodes.map((node) => ({
                data: {
                    id: node.id,
                    label: node.label || node.type,
                    type: node.type,
                },
            })),
            // Edges
            ...edges.map((edge) => ({
                data: {
                    id: edge.id,
                    source: edge.sourceId,
                    target: edge.targetId,
                    edgeType: edge.edgeType,
                },
            })),
        ];

        // Initialize Cytoscape
        cyRef.current = cytoscape({
            container: containerRef.current,
            elements,
            style: [
                {
                    selector: 'node',
                    style: {
                        'background-color': (ele) => NODE_COLORS[ele.data('type')] || '#6B7280',
                        'label': 'data(label)',
                        'color': '#F5F5F7',
                        'font-size': '11px',
                        'text-valign': 'bottom',
                        'text-margin-y': 8,
                        'width': 40,
                        'height': 40,
                        'border-width': 2,
                        'border-color': 'rgba(255,255,255,0.2)',
                    },
                },
                {
                    selector: 'node:selected',
                    style: {
                        'border-width': 3,
                        'border-color': '#fff',
                        'width': 50,
                        'height': 50,
                    },
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 2,
                        'line-color': (ele) => EDGE_COLORS[ele.data('edgeType')] || '#6B7280',
                        'target-arrow-color': (ele) => EDGE_COLORS[ele.data('edgeType')] || '#6B7280',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier',
                        'opacity': 0.7,
                    },
                },
                {
                    selector: 'edge:selected',
                    style: {
                        'width': 3,
                        'opacity': 1,
                    },
                },
            ],
            layout: {
                name: 'cose',
                animate: true,
                animationDuration: 500,
                nodeRepulsion: () => 8000,
                idealEdgeLength: () => 100,
                padding: 50,
            },
        });

        // Event handlers
        cyRef.current.on('tap', 'node', (evt) => {
            const nodeId = evt.target.id();
            const nodeData = nodes.find((n) => n.id === nodeId);
            if (nodeData && onNodeClick) {
                onNodeClick(nodeData);
            }
        });

        cyRef.current.on('tap', (evt) => {
            if (evt.target === cyRef.current) {
                // Click on empty area - could add deselect logic here
            }
        });

        return () => {
            cyRef.current?.destroy();
        };
    }, [nodes, edges, onNodeClick]);

    const handleZoomIn = () => {
        cyRef.current?.zoom(cyRef.current.zoom() * 1.2);
    };

    const handleZoomOut = () => {
        cyRef.current?.zoom(cyRef.current.zoom() / 1.2);
    };

    const handleFit = () => {
        cyRef.current?.fit(undefined, 50);
    };

    const handleRefresh = () => {
        cyRef.current?.layout({ name: 'cose', animate: true }).run();
        onRefresh?.();
    };

    const isEmpty = nodes.length === 0;

    return (
        <div className="knowledge-graph">
            {/* Header */}
            <div className="graph-header">
                <div className="graph-title">
                    <Network size={18} />
                    <span>Knowledge Graph</span>
                    <span className="node-count">{nodes.length} nodes</span>
                </div>
                <div className="graph-controls">
                    <motion.button
                        className="control-btn"
                        onClick={handleZoomIn}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Zoom In"
                    >
                        <ZoomIn size={16} />
                    </motion.button>
                    <motion.button
                        className="control-btn"
                        onClick={handleZoomOut}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Zoom Out"
                    >
                        <ZoomOut size={16} />
                    </motion.button>
                    <motion.button
                        className="control-btn"
                        onClick={handleFit}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Fit to View"
                    >
                        <Maximize2 size={16} />
                    </motion.button>
                    <motion.button
                        className="control-btn"
                        onClick={handleRefresh}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Refresh Layout"
                    >
                        <RefreshCw size={16} />
                    </motion.button>
                </div>
            </div>

            {/* Graph Container */}
            {isEmpty ? (
                <div className="graph-empty">
                    <Network size={48} />
                    <h3>No connections yet</h3>
                    <p>Create decisions, assumptions, and risks to build the knowledge graph</p>
                </div>
            ) : (
                <div ref={containerRef} className="graph-container" />
            )}

            {/* Legend */}
            <div className="graph-legend">
                {Object.entries(NODE_COLORS).map(([type, color]) => (
                    <div key={type} className="legend-item">
                        <span className="legend-dot" style={{ backgroundColor: color }} />
                        <span className="legend-label">{type}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
