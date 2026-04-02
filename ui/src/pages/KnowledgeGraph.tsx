import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Loader2, Network, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import cytoscape from 'cytoscape'
import type { Core } from 'cytoscape'
import { api, type GraphNode } from '../api/client'

const nodeColors: Record<string, string> = {
  intent: '#6366F1',
  decision: '#10B981',
  assumption: '#F59E0B',
  risk: '#EF4444',
  task: '#3B82F6',
}

export default function KnowledgeGraph() {
  const containerRef = useRef<HTMLDivElement>(null)
  const cyRef = useRef<Core | null>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)

  const { data: graphData, isLoading } = useQuery({
    queryKey: ['knowledge-graph'],
    queryFn: () => api.getKnowledgeGraph(),
    select: (r) => r.data,
  })

  useEffect(() => {
    if (!containerRef.current) return

    const cy = cytoscape({
      container: containerRef.current,
      elements: [],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (ele: cytoscape.NodeSingular) => nodeColors[ele.data('nodeType')] || '#6366F1',
            'label': (ele: cytoscape.NodeSingular) => ele.data('label'),
            'color': '#F5F5F7',
            'font-size': '12px',
            'font-family': 'Inter, sans-serif',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 8,
            'width': 40,
            'height': 40,
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': 'rgba(255, 255, 255, 0.15)',
            'target-arrow-color': 'rgba(255, 255, 255, 0.15)',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': (ele: cytoscape.EdgeSingular) => ele.data('label') || '',
            'font-size': '10px',
            'color': '#A1A1AA',
            'text-rotation': 'autorotate',
            'text-margin-y': -8,
          },
        },
        {
          selector: ':selected',
          style: {
            'border-width': 3,
            'border-color': '#6366F1',
          },
        },
      ],
      layout: {
        name: 'cose',
        animate: true,
        animationDuration: 500,
        nodeRepulsion: 4500,
        idealEdgeLength: 100,
      },
    })

    cy.on('tap', 'node', (evt) => {
      const node = evt.target
      setSelectedNode({
        id: node.id(),
        type: node.data('nodeType'),
        label: node.data('label'),
        data: node.data(),
      })
    })

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setSelectedNode(null)
      }
    })

    cyRef.current = cy

    return () => {
      cy.destroy()
      cyRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!cyRef.current || !graphData) return

    const cy = cyRef.current
    cy.elements().remove()

    const elements = [
      ...graphData.nodes.map((n) => ({
        data: { id: n.id, label: n.label, nodeType: n.type },
      })),
      ...graphData.edges.map((e) => ({
        data: { id: e.id, source: e.source, target: e.target, label: e.label || e.type },
      })),
    ]

    cy.add(elements)
    cy.layout({
      name: 'cose',
      animate: true,
      animationDuration: 500,
      nodeRepulsion: 4500,
      idealEdgeLength: 100,
    }).run()
    cy.fit()
  }, [graphData])

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.3)
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.7)
  const handleFit = () => cyRef.current?.fit()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Knowledge Graph</h1>
          <p className="text-sm text-text-secondary mt-1">Visualize relationships between intents, decisions, and entities</p>
        </div>
      </div>

      <div className="glass-card p-1 relative">
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1">
          <button
            onClick={handleZoomIn}
            className="p-1.5 bg-background-secondary/80 backdrop-blur rounded-md hover:bg-background-tertiary text-text-secondary transition-colors"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 bg-background-secondary/80 backdrop-blur rounded-md hover:bg-background-tertiary text-text-secondary transition-colors"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={handleFit}
            className="p-1.5 bg-background-secondary/80 backdrop-blur rounded-md hover:bg-background-tertiary text-text-secondary transition-colors"
          >
            <Maximize2 size={14} />
          </button>
        </div>

        <div ref={containerRef} className="w-full h-[600px] rounded-lg" />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg">
            <Loader2 className="animate-spin text-text-muted" size={24} />
          </div>
        )}

        {!isLoading && (!graphData || graphData.nodes.length === 0) && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg">
            <div className="text-center">
              <Network size={40} className="text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary">No graph data available</p>
            </div>
          </div>
        )}
      </div>

      {selectedNode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: nodeColors[selectedNode.type] || '#6366F1' }}
            />
            <span className="text-sm font-medium">{selectedNode.label}</span>
            <span className="text-xs text-text-muted px-2 py-0.5 bg-background-tertiary rounded-full">
              {selectedNode.type}
            </span>
          </div>
          <div className="text-xs text-text-muted font-mono">
            ID: {selectedNode.id}
          </div>
        </motion.div>
      )}

      <div className="glass-card p-4">
        <h3 className="text-sm font-medium mb-3">Legend</h3>
        <div className="flex flex-wrap gap-4">
          {Object.entries(nodeColors).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-text-secondary capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
