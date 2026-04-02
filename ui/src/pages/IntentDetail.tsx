import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  GitBranch,
  Brain,
  AlertTriangle,
  Clock,
  User,
  Plus,
  CheckSquare,
  Loader2,
} from 'lucide-react'
import { api, type Decision, type Assumption, type Risk, type Task } from '../api/client'
import StateBadge from '../components/StateBadge'
import DecisionForm from '../components/DecisionForm'
import AIProposal from '../components/AIProposal'

export default function IntentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'overview' | 'decisions' | 'assumptions' | 'risks' | 'tasks' | 'proposals'>('overview')
  const [showDecisionForm, setShowDecisionForm] = useState(false)

  const { data: intent, isLoading: intentLoading } = useQuery({
    queryKey: ['intent', id],
    queryFn: () => api.getIntent(id!),
    select: (r) => r.data,
    enabled: !!id,
  })

  const { data: decisions } = useQuery({
    queryKey: ['decisions', id],
    queryFn: () => api.listDecisions(id!),
    select: (r) => r.data || [],
    enabled: !!id,
  })

  const { data: assumptions } = useQuery({
    queryKey: ['assumptions', id],
    queryFn: () => api.listAssumptions(id!),
    select: (r) => r.data || [],
    enabled: !!id,
  })

  const { data: risks } = useQuery({
    queryKey: ['risks', id],
    queryFn: () => api.listRisks(id!),
    select: (r) => r.data || [],
    enabled: !!id,
  })

  const { data: tasks } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => api.listTasks(id!),
    select: (r) => r.data || [],
    enabled: !!id,
  })

  const { data: proposals } = useQuery({
    queryKey: ['proposals', id],
    queryFn: () => api.getProposals(id!),
    select: (r) => r.data || [],
    enabled: !!id,
  })

  const transitionMutation = useMutation({
    mutationFn: ({ state }: { state: string }) => api.transitionIntent(id!, state),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intent', id] })
    },
  })

  const decisionMutation = useMutation({
    mutationFn: (data: {
      decisionStatement: string
      finalChoice: string
      optionsConsidered: string[]
      revisitCondition?: string
    }) => api.commitDecision({ intentId: id!, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decisions', id] })
      setShowDecisionForm(false)
    },
  })

  const acceptProposalMutation = useMutation({
    mutationFn: (proposalId: string) => api.acceptProposal(proposalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals', id] })
    },
  })

  const rejectProposalMutation = useMutation({
    mutationFn: (proposalId: string) => api.rejectProposal(proposalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals', id] })
    },
  })

  const parkProposalMutation = useMutation({
    mutationFn: (proposalId: string) => api.parkProposal(proposalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals', id] })
    },
  })

  const getNextStates = (current: string): string[] => {
    const transitions: Record<string, string[]> = {
      research: ['planning'],
      planning: ['execution', 'research'],
      execution: ['archived', 'planning'],
      archived: [],
    }
    return transitions[current] || []
  }

  if (intentLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-text-muted" size={24} />
      </div>
    )
  }

  if (!intent) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">Intent not found</p>
        <Link to="/intents" className="text-accent text-sm mt-2 inline-block">Back to intents</Link>
      </div>
    )
  }

  const nextStates = getNextStates(intent.currentState)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-background-tertiary text-text-secondary transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <StateBadge state={intent.currentState} size="md" />
          </div>
          <h1 className="text-xl font-semibold">{intent.title}</h1>
        </div>
      </div>

      {intent.description && (
        <p className="text-text-secondary text-sm">{intent.description}</p>
      )}

      {nextStates.length > 0 && (
        <div className="glass-card p-4">
          <span className="text-xs text-text-secondary mb-2 block">Transition to:</span>
          <div className="flex flex-wrap gap-2">
            {nextStates.map((state) => (
              <motion.button
                key={state}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => transitionMutation.mutate({ state })}
                disabled={transitionMutation.isPending}
                className="px-3 py-1.5 text-sm font-medium bg-background-tertiary border border-border-subtle rounded-lg text-text hover:border-accent/50 hover:text-accent transition-colors disabled:opacity-50"
              >
                {state}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatButton
          label="Decisions"
          count={decisions?.length || 0}
          icon={GitBranch}
          active={activeTab === 'decisions'}
          onClick={() => setActiveTab('decisions')}
        />
        <StatButton
          label="Assumptions"
          count={assumptions?.length || 0}
          icon={Brain}
          active={activeTab === 'assumptions'}
          onClick={() => setActiveTab('assumptions')}
        />
        <StatButton
          label="Risks"
          count={risks?.length || 0}
          icon={AlertTriangle}
          active={activeTab === 'risks'}
          onClick={() => setActiveTab('risks')}
        />
        <StatButton
          label="Tasks"
          count={tasks?.length || 0}
          icon={CheckSquare}
          active={activeTab === 'tasks'}
          onClick={() => setActiveTab('tasks')}
        />
        <StatButton
          label="AI Proposals"
          count={proposals?.length || 0}
          icon={Brain}
          active={activeTab === 'proposals'}
          onClick={() => setActiveTab('proposals')}
        />
      </div>

      <div className="flex gap-1 border-b border-border-subtle">
        {(['overview', 'decisions', 'assumptions', 'risks', 'tasks', 'proposals'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Clock size={14} />
            <span>Created: {intent.createdAt ? new Date(intent.createdAt).toLocaleDateString() : 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <User size={14} />
            <span>Created by: {intent.createdBy}</span>
          </div>
          {intent.lastHumanReviewedAt && (
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Clock size={14} />
              <span>Last reviewed: {new Date(intent.lastHumanReviewedAt).toLocaleDateString()}</span>
            </div>
          )}
          {intent.confidenceLevel && (
            <div className="text-sm text-text-secondary">
              Confidence: {Math.round(intent.confidenceLevel * 100)}%
            </div>
          )}
        </div>
      )}

      {activeTab === 'decisions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Decision Ledger</h3>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowDecisionForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white text-xs font-medium rounded-lg hover:bg-accent/90 transition-colors"
            >
              <Plus size={12} />
              Commit Decision
            </motion.button>
          </div>
          {decisions && decisions.length > 0 ? (
            <div className="space-y-3">
              {decisions.map((d) => (
                <DecisionCard key={d.id} decision={d} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary text-center py-8">No decisions yet.</p>
          )}
        </div>
      )}

      {activeTab === 'assumptions' && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Assumptions</h3>
          {assumptions && assumptions.length > 0 ? (
            <div className="space-y-3">
              {assumptions.map((a) => (
                <AssumptionCard key={a.id} assumption={a} intentId={id!} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary text-center py-8">No assumptions yet.</p>
          )}
        </div>
      )}

      {activeTab === 'risks' && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Risk Register</h3>
          {risks && risks.length > 0 ? (
            <div className="space-y-3">
              {risks.map((r) => (
                <RiskCard key={r.id} risk={r} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary text-center py-8">No risks identified yet.</p>
          )}
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Tasks</h3>
          {tasks && tasks.length > 0 ? (
            <div className="space-y-2">
              {tasks.map((t) => (
                <TaskCard key={t.id} task={t} intentId={id!} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary text-center py-8">No tasks yet.</p>
          )}
        </div>
      )}

      {activeTab === 'proposals' && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">AI Proposals</h3>
          {proposals && proposals.length > 0 ? (
            <div className="space-y-3">
              {proposals.map((p) => (
                <AIProposal
                  key={p.id}
                  proposal={p}
                  onAccept={(pid) => acceptProposalMutation.mutate(pid)}
                  onReject={(pid) => rejectProposalMutation.mutate(pid)}
                  onPark={(pid) => parkProposalMutation.mutate(pid)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary text-center py-8">No pending proposals.</p>
          )}
        </div>
      )}

      <AnimatePresence>
        {showDecisionForm && (
          <DecisionForm
            intentId={id!}
            onSubmit={(data) => decisionMutation.mutate(data)}
            onCancel={() => setShowDecisionForm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function StatButton({
  label,
  count,
  icon: Icon,
  active,
  onClick,
}: {
  label: string
  count: number
  icon: React.ElementType
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`glass-card p-3 text-left transition-colors ${
        active ? 'border-accent/50 bg-accent/5' : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className={active ? 'text-accent' : 'text-text-muted'} />
        <span className="text-xs text-text-secondary">{label}</span>
      </div>
      <p className="text-lg font-bold">{count}</p>
    </button>
  )
}

function DecisionCard({ decision }: { decision: Decision }) {
  return (
    <div className={`glass-card p-4 ${decision.status === 'superseded' ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          decision.status === 'active'
            ? 'bg-emerald-500/10 text-emerald-400'
            : 'bg-zinc-500/10 text-zinc-400'
        }`}>
          {decision.status}
        </span>
        {decision.decisionTimestamp && (
          <span className="text-xs text-text-muted">
            {new Date(decision.decisionTimestamp).toLocaleDateString()}
          </span>
        )}
      </div>
      <p className="text-sm text-text mb-2">{decision.decisionStatement}</p>
      <p className="text-xs text-text-secondary">
        <span className="font-medium">Choice:</span> {decision.finalChoice}
      </p>
    </div>
  )
}

function AssumptionCard({ assumption, intentId }: { assumption: Assumption; intentId: string }) {
  const queryClient = useQueryClient()
  const invalidateMutation = useMutation({
    mutationFn: () => api.invalidateAssumption(assumption.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assumptions', intentId] })
    },
  })

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
        {assumption.confidenceLevel && (
          <span className="text-xs text-text-muted">
            {Math.round(assumption.confidenceLevel * 100)}% confident
          </span>
        )}
      </div>
      <p className="text-sm text-text mb-2">{assumption.assumptionStatement}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">Source: {assumption.createdFrom || 'human'}</span>
        {assumption.status === 'active' && (
          <button
            onClick={() => invalidateMutation.mutate()}
            disabled={invalidateMutation.isPending}
            className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
          >
            Invalidate
          </button>
        )}
      </div>
    </div>
  )
}

function RiskCard({ risk }: { risk: Risk }) {
  const severityColors = {
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

function TaskCard({ task, intentId }: { task: Task; intentId: string }) {
  const queryClient = useQueryClient()
  const statusMutation = useMutation({
    mutationFn: (status: string) => api.updateTaskStatus(task.id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', intentId] })
    },
  })

  return (
    <div className={`glass-card p-3 flex items-center gap-3 ${task.status === 'done' ? 'opacity-60' : ''}`}>
      <input
        type="checkbox"
        checked={task.status === 'done'}
        onChange={() => {
          const newStatus = task.status === 'done' ? 'todo' : 'done'
          statusMutation.mutate(newStatus)
        }}
        className="w-4 h-4 rounded border-border-subtle bg-background-tertiary text-accent focus:ring-accent/20"
      />
      <div className="flex-1 min-w-0">
        <span className={`text-sm ${task.status === 'done' ? 'line-through text-text-muted' : 'text-text'}`}>
          {task.title}
        </span>
        {task.description && (
          <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{task.description}</p>
        )}
      </div>
      {task.owner && (
        <span className="text-xs text-text-muted shrink-0">{task.owner}</span>
      )}
    </div>
  )
}
