import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Filter, Loader2, Target } from 'lucide-react'
import { api } from '../api/client'
import IntentCard from '../components/IntentCard'

export default function Intents() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [stateFilter, setStateFilter] = useState<string>('all')
  const [showCreate, setShowCreate] = useState(false)

  const { data: intents, isLoading } = useQuery({
    queryKey: ['intents'],
    queryFn: () => api.listIntents(),
    select: (r) => r.data || [],
  })

  const createMutation = useMutation({
    mutationFn: (data: { title: string; description?: string }) => api.createIntent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intents'] })
      setShowCreate(false)
    },
  })

  const filtered = (intents || []).filter((intent) => {
    const matchesSearch = intent.title.toLowerCase().includes(search.toLowerCase()) ||
      (intent.description?.toLowerCase().includes(search.toLowerCase()) || false)
    const matchesState = stateFilter === 'all' || intent.currentState === stateFilter
    return matchesSearch && matchesState
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Intents</h1>
          <p className="text-sm text-text-secondary mt-1">Manage and track all project intents</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors"
        >
          <Plus size={14} />
          New Intent
        </motion.button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search intents..."
            className="w-full bg-background-tertiary border border-border-subtle rounded-lg pl-9 pr-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-text-muted" />
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="bg-background-tertiary border border-border-subtle rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent/50"
          >
            <option value="all">All States</option>
            <option value="research">Research</option>
            <option value="planning">Planning</option>
            <option value="execution">Execution</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-text-muted" size={24} />
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((intent) => (
              <IntentCard key={intent.id} intent={intent} />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="glass-card p-8 text-center">
          <Target size={40} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary">
            {intents?.length === 0 ? 'No intents yet. Create your first one!' : 'No intents match your filters.'}
          </p>
        </div>
      )}

      <AnimatePresence>
        {showCreate && (
          <CreateIntentModal
            onClose={() => setShowCreate(false)}
            onSubmit={(data) => createMutation.mutate(data)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function CreateIntentModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (data: { title: string; description?: string }) => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      onSubmit({ title: title.trim(), description: description.trim() || undefined })
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
        <h2 className="text-lg font-semibold mb-4">Create New Intent</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you intend to accomplish?"
              autoFocus
              className="w-full bg-background-tertiary border border-border-subtle rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional context..."
              rows={3}
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
              disabled={!title.trim()}
              className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Create Intent
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
