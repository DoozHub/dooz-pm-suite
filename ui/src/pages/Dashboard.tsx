import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { Target, GitBranch, Brain, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react'
import { api } from '../api/client'
import IntentCard from '../components/IntentCard'
import StateBadge from '../components/StateBadge'

export default function Dashboard() {
  const { data: intents, isLoading } = useQuery({
    queryKey: ['intents'],
    queryFn: () => api.listIntents(),
    select: (r) => r.data || [],
  })

  const stats = {
    total: intents?.length || 0,
    research: intents?.filter((i) => i.currentState === 'research').length || 0,
    planning: intents?.filter((i) => i.currentState === 'planning').length || 0,
    execution: intents?.filter((i) => i.currentState === 'execution').length || 0,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-text-secondary mt-1">Overview of all intents and their lifecycle status</p>
        </div>
        <Link
          to="/intents"
          className="flex items-center gap-1.5 text-sm text-accent hover:text-accent/80 transition-colors"
        >
          View all intents
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Intents"
          value={stats.total}
          icon={Target}
          color="text-accent"
          bg="bg-accent/10"
        />
        <StatCard
          label="Research"
          value={stats.research}
          icon={Brain}
          color="text-blue-400"
          bg="bg-blue-500/10"
        />
        <StatCard
          label="Planning"
          value={stats.planning}
          icon={GitBranch}
          color="text-amber-400"
          bg="bg-amber-500/10"
        />
        <StatCard
          label="Execution"
          value={stats.execution}
          icon={AlertTriangle}
          color="text-emerald-400"
          bg="bg-emerald-500/10"
        />
      </div>

      <div>
        <h2 className="text-base font-medium mb-4">Recent Intents</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-text-muted" size={24} />
          </div>
        ) : intents && intents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {intents.slice(0, 6).map((intent) => (
              <IntentCard key={intent.id} intent={intent} />
            ))}
          </div>
        ) : (
          <div className="glass-card p-8 text-center">
            <Target size={40} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary mb-4">No intents yet</p>
            <Link
              to="/intents"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors"
            >
              Create your first intent
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <h3 className="text-sm font-medium mb-3">State Distribution</h3>
          <div className="space-y-3">
            {(['research', 'planning', 'execution', 'archived'] as const).map((state) => {
              const count = intents?.filter((i) => i.currentState === state).length || 0
              const pct = stats.total > 0 ? (count / stats.total) * 100 : 0
              return (
                <div key={state} className="flex items-center gap-3">
                  <StateBadge state={state} size="sm" />
                  <div className="flex-1 h-2 bg-background-tertiary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-accent/60 rounded-full"
                    />
                  </div>
                  <span className="text-xs text-text-muted w-8 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="glass-card p-4">
          <h3 className="text-sm font-medium mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <QuickAction to="/intents" label="Create new intent" />
            <QuickAction to="/knowledge-graph" label="View knowledge graph" />
            <QuickAction to="/intents" label="Review pending proposals" />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
}: {
  label: string
  value: number
  icon: React.ElementType
  color: string
  bg: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-text-secondary">{label}</span>
        <div className={`p-1.5 rounded-lg ${bg}`}>
          <Icon size={14} className={color} />
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </motion.div>
  )
}

function QuickAction({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-background-tertiary hover:text-text transition-colors"
    >
      <ArrowRight size={14} />
      {label}
    </Link>
  )
}
