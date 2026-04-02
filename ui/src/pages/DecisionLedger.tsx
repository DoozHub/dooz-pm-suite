import { useState } from 'react'
import { useParams, Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, GitBranch, Plus, Loader2, Filter } from 'lucide-react'
import { api, type Decision } from '../api/client'
import DecisionForm from '../components/DecisionForm'

export default function DecisionLedger() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [showSuperseded, setShowSuperseded] = useState(false)

  const { data: decisions, isLoading } = useQuery({
    queryKey: ['decisions', id, showSuperseded],
    queryFn: () => api.listDecisions(id!, showSuperseded),
    select: (r) => r.data || [],
    enabled: !!id,
  })

  const mutation = useMutation({
    mutationFn: (data: {
      decisionStatement: string
      finalChoice: string
      optionsConsidered: string[]
      revisitCondition?: string
    }) => api.commitDecision({ intentId: id!, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decisions', id] })
      setShowForm(false)
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/intents/${id}`} className="p-2 rounded-lg hover:bg-background-tertiary text-text-secondary transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold">Decision Ledger</h1>
            <p className="text-sm text-text-secondary mt-1">Append-only record of all decisions</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors"
        >
          <Plus size={14} />
          Commit Decision
        </motion.button>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowSuperseded(!showSuperseded)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            showSuperseded
              ? 'bg-accent/10 border-accent/50 text-accent'
              : 'bg-background-tertiary border-border-subtle text-text-secondary'
          }`}
        >
          <Filter size={12} />
          {showSuperseded ? 'Showing all' : 'Active only'}
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-text-muted" size={24} />
        </div>
      ) : decisions && decisions.length > 0 ? (
        <div className="space-y-4">
          {decisions.map((d, i) => (
            <DecisionEntry key={d.id} decision={d} index={i} />
          ))}
        </div>
      ) : (
        <div className="glass-card p-8 text-center">
          <GitBranch size={40} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary">No decisions recorded yet.</p>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <DecisionForm
            intentId={id!}
            onSubmit={(data) => mutation.mutate(data)}
            onCancel={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function DecisionEntry({ decision, index }: { decision: Decision; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`glass-card p-4 ${decision.status === 'superseded' ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-text-muted">#{index + 1}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            decision.status === 'active'
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-zinc-500/10 text-zinc-400'
          }`}>
            {decision.status}
          </span>
        </div>
        {decision.decisionTimestamp && (
          <span className="text-xs text-text-muted">
            {new Date(decision.decisionTimestamp).toLocaleString()}
          </span>
        )}
      </div>

      <p className="text-sm text-text mb-3">{decision.decisionStatement}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-text-muted block mb-1">Final Choice</span>
          <span className="text-text font-medium">{decision.finalChoice}</span>
        </div>
        {decision.optionsConsidered && (
          <div>
            <span className="text-text-muted block mb-1">Options Considered</span>
            <div className="flex flex-wrap gap-1">
              {(() => {
                try {
                  const opts = JSON.parse(decision.optionsConsidered)
                  return opts.map((opt: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-background-tertiary rounded text-text-secondary">
                      {opt}
                    </span>
                  ))
                } catch {
                  return <span className="text-text-secondary">{decision.optionsConsidered}</span>
                }
              })()}
            </div>
          </div>
        )}
      </div>

      {decision.revisitCondition && (
        <div className="mt-3 pt-3 border-t border-border-subtle">
          <span className="text-xs text-text-muted block mb-1">Revisit Condition</span>
          <span className="text-xs text-text-secondary">{decision.revisitCondition}</span>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-border-subtle text-xs text-text-muted">
        Approved by: {decision.humanApprover}
      </div>
    </motion.div>
  )
}
