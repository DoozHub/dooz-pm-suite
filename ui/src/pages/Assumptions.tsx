import { useState } from 'react'
import { useParams, Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Brain, Plus, Loader2 } from 'lucide-react'
import { api, type Assumption, type Risk } from '../api/client'

export default function Assumptions() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'assumptions' | 'risks'>('assumptions')
  const [showAddAssumption, setShowAddAssumption] = useState(false)
  const [showAddRisk, setShowAddRisk] = useState(false)

  const { data: assumptions, isLoading: assumptionsLoading } = useQuery({
    queryKey: ['assumptions', id],
    queryFn: () => api.listAssumptions(id!),
    select: (r) => r.data || [],
    enabled: !!id,
  })

  const { data: risks, isLoading: risksLoading } = useQuery({
    queryKey: ['risks', id],
    queryFn: () => api.listRisks(id!),
    select: (r) => r.data || [],
    enabled: !!id,
  })

  const addAssumptionMutation = useMutation({
    mutationFn: (data: {
      intentId: string
      assumptionStatement: string
      confidenceLevel?: number
    }) => api.createAssumption(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assumptions', id] })
      setShowAddAssumption(false)
    },
  })

  const addRiskMutation = useMutation({
    mutationFn: (data: {
      intentId: string
      riskStatement: string
      severity?: 'low' | 'medium' | 'high' | 'critical'
      likelihood?: 'low' | 'medium' | 'high'
      mitigationNotes?: string
    }) => api.createRisk(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risks', id] })
      setShowAddRisk(false)
    },
  })

  const invalidateAssumptionMutation = useMutation({
    mutationFn: (assumptionId: string) => api.invalidateAssumption(assumptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assumptions', id] })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to={`/intents/${id}`} className="p-2 rounded-lg hover:bg-background-tertiary text-text-secondary transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold">Assumptions & Risks</h1>
          <p className="text-sm text-text-secondary mt-1">Track assumptions and risk register</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border-subtle">
        <button
          onClick={() => setActiveTab('assumptions')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'assumptions'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-secondary hover:text-text'
          }`}
        >
          Assumptions
        </button>
        <button
          onClick={() => setActiveTab('risks')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'risks'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-secondary hover:text-text'
          }`}
        >
          Risks
        </button>
      </div>

      {activeTab === 'assumptions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Assumptions</h3>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddAssumption(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white text-xs font-medium rounded-lg hover:bg-accent/90 transition-colors"
            >
              <Plus size={12} />
              Add Assumption
            </motion.button>
          </div>

          {assumptionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-text-muted" size={24} />
            </div>
          ) : assumptions && assumptions.length > 0 ? (
            <div className="space-y-3">
              {assumptions.map((a) => (
                <AssumptionCard
                  key={a.id}
                  assumption={a}
                  intentId={id!}
                  onInvalidate={() => invalidateAssumptionMutation.mutate(a.id)}
                />
              ))}
            </div>
          ) : (
            <div className="glass-card p-8 text-center">
              <Brain size={40} className="text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary">No assumptions yet.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'risks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Risk Register</h3>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddRisk(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white text-xs font-medium rounded-lg hover:bg-accent/90 transition-colors"
            >
              <Plus size={12} />
              Add Risk
            </motion.button>
          </div>

          {risksLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-text-muted" size={24} />
            </div>
          ) : risks && risks.length > 0 ? (
            <div className="space-y-3">
              {risks.map((r) => (
                <RiskCard key={r.id} risk={r} />
              ))}
            </div>
          ) : (
            <div className="glass-card p-8 text-center">
              <Brain size={40} className="text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary">No risks identified yet.</p>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showAddAssumption && (
          <AddAssumptionModal
            intentId={id!}
            onClose={() => setShowAddAssumption(false)}
            onSubmit={(data) => addAssumptionMutation.mutate({ intentId: id!, ...data })}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddRisk && (
          <AddRiskModal
            intentId={id!}
            onClose={() => setShowAddRisk(false)}
            onSubmit={(data) => addRiskMutation.mutate({ intentId: id!, ...data })}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function AssumptionCard({
  assumption,
  onInvalidate,
}: {
  assumption: Assumption
  intentId: string
  onInvalidate: () => void
}) {
  return (
    <div className={`glass-card p-4 ${assumption.status === 'invalidated' ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          assumption.status === 'active'
            ? 'bg-amber-500/10 text-amber-400'
            : 'bg-zinc-500/10 text-zinc-400'
        }`}>
          {assumption.status}
        </span>
        <div className="flex items-center gap-3">
          {assumption.confidenceLevel && (
            <span className="text-xs text-text-muted">
              {Math.round(assumption.confidenceLevel * 100)}% confident
            </span>
          )}
          {assumption.status === 'active' && (
            <button
              onClick={onInvalidate}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Invalidate
            </button>
          )}
        </div>
      </div>
      <p className="text-sm text-text mb-2">{assumption.assumptionStatement}</p>
      <div className="flex items-center gap-3 text-xs text-text-muted">
        <span>Source: {assumption.createdFrom || 'human'}</span>
        {assumption.createdAt && (
          <span>Created: {new Date(assumption.createdAt).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  )
}

function RiskCard({ risk }: { risk: Risk }) {
  const severityColors: Record<string, string> = {
    low: 'bg-blue-500/10 text-blue-400',
    medium: 'bg-amber-500/10 text-amber-400',
    high: 'bg-orange-500/10 text-orange-400',
    critical: 'bg-red-500/10 text-red-400',
  }

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          risk.severity ? severityColors[risk.severity] : 'bg-zinc-500/10 text-zinc-400'
        }`}>
          {risk.severity || 'medium'}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          risk.status === 'active'
            ? 'bg-emerald-500/10 text-emerald-400'
            : risk.status === 'mitigated'
            ? 'bg-blue-500/10 text-blue-400'
            : 'bg-zinc-500/10 text-zinc-400'
        }`}>
          {risk.status}
        </span>
      </div>
      <p className="text-sm text-text mb-2">{risk.riskStatement}</p>
      {risk.mitigationNotes && (
        <p className="text-xs text-text-secondary">
          <span className="font-medium">Mitigation:</span> {risk.mitigationNotes}
        </p>
      )}
    </div>
  )
}

function AddAssumptionModal({
  intentId: _intentId,
  onClose,
  onSubmit,
}: {
  intentId: string
  onClose: () => void
  onSubmit: (data: { assumptionStatement: string; confidenceLevel?: number }) => void
}) {
  const [statement, setStatement] = useState('')
  const [confidence, setConfidence] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (statement.trim()) {
      onSubmit({
        assumptionStatement: statement.trim(),
        confidenceLevel: confidence ? parseFloat(confidence) / 100 : undefined,
      })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card w-full max-w-md p-6"
      >
        <h2 className="text-lg font-semibold mb-4">Add Assumption</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Assumption Statement</label>
            <textarea
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              placeholder="What are you assuming to be true?"
              rows={3}
              autoFocus
              className="w-full bg-background-tertiary border border-border-subtle rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Confidence Level (0-100)</label>
            <input
              type="number"
              value={confidence}
              onChange={(e) => setConfidence(e.target.value)}
              placeholder="75"
              min="0"
              max="100"
              className="w-full bg-background-tertiary border border-border-subtle rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-secondary border border-border-light rounded-lg hover:bg-background-tertiary transition-colors"
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={!statement.trim()}
              className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add Assumption
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

function AddRiskModal({
  intentId: _intentId,
  onClose,
  onSubmit,
}: {
  intentId: string
  onClose: () => void
  onSubmit: (data: {
    riskStatement: string
    severity?: 'low' | 'medium' | 'high' | 'critical'
    likelihood?: 'low' | 'medium' | 'high'
    mitigationNotes?: string
  }) => void
}) {
  const [statement, setStatement] = useState('')
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [likelihood, setLikelihood] = useState<'low' | 'medium' | 'high'>('medium')
  const [mitigation, setMitigation] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (statement.trim()) {
      onSubmit({
        riskStatement: statement.trim(),
        severity,
        likelihood,
        mitigationNotes: mitigation.trim() || undefined,
      })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card w-full max-w-md p-6"
      >
        <h2 className="text-lg font-semibold mb-4">Add Risk</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Risk Statement</label>
            <textarea
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              placeholder="What could go wrong?"
              rows={3}
              autoFocus
              className="w-full bg-background-tertiary border border-border-subtle rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as typeof severity)}
                className="w-full bg-background-tertiary border border-border-subtle rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent/50"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Likelihood</label>
              <select
                value={likelihood}
                onChange={(e) => setLikelihood(e.target.value as typeof likelihood)}
                className="w-full bg-background-tertiary border border-border-subtle rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent/50"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Mitigation Notes (optional)</label>
            <textarea
              value={mitigation}
              onChange={(e) => setMitigation(e.target.value)}
              placeholder="How can this risk be mitigated?"
              rows={2}
              className="w-full bg-background-tertiary border border-border-subtle rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 resize-none"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-secondary border border-border-light rounded-lg hover:bg-background-tertiary transition-colors"
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={!statement.trim()}
              className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add Risk
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
