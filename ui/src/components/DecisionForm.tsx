import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GitBranch, Plus, X } from 'lucide-react'

interface DecisionFormProps {
  intentId: string
  onSubmit: (data: {
    decisionStatement: string
    finalChoice: string
    optionsConsidered: string[]
    revisitCondition?: string
  }) => void
  onCancel: () => void
}

export default function DecisionForm({ intentId: _intentId, onSubmit, onCancel }: DecisionFormProps) {
  const [decisionStatement, setDecisionStatement] = useState('')
  const [finalChoice, setFinalChoice] = useState('')
  const [optionsText, setOptionsText] = useState('')
  const [revisitCondition, setRevisitCondition] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (decisionStatement.trim() && finalChoice.trim()) {
      const optionsConsidered = optionsText
        .split('\n')
        .map((o) => o.trim())
        .filter((o) => o.length > 0)
      onSubmit({
        decisionStatement,
        finalChoice,
        optionsConsidered,
        revisitCondition: revisitCondition.trim() || undefined,
      })
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-card w-full max-w-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GitBranch size={18} className="text-accent" />
              <h2 className="text-lg font-semibold">Commit Decision</h2>
            </div>
            <button
              onClick={onCancel}
              className="p-1.5 rounded-md hover:bg-background-tertiary text-text-secondary"
            >
              <X size={16} />
            </button>
          </div>

          <p className="text-sm text-text-secondary mb-4">
            Decisions are immutable. Once committed, they cannot be edited — only superseded.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                Decision Statement <span className="text-red-400">*</span>
              </label>
              <textarea
                value={decisionStatement}
                onChange={(e) => setDecisionStatement(e.target.value)}
                placeholder="What was decided? Be specific and complete."
                rows={3}
                autoFocus
                className="w-full bg-background-tertiary border border-border-subtle rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                Final Choice <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={finalChoice}
                onChange={(e) => setFinalChoice(e.target.value)}
                placeholder="The specific option chosen"
                className="w-full bg-background-tertiary border border-border-subtle rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                Options Considered (one per line)
              </label>
              <textarea
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                placeholder="Option A&#10;Option B&#10;Option C"
                rows={3}
                className="w-full bg-background-tertiary border border-border-subtle rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                Revisit Condition (optional)
              </label>
              <input
                type="text"
                value={revisitCondition}
                onChange={(e) => setRevisitCondition(e.target.value)}
                placeholder="When should this decision be revisited?"
                className="w-full bg-background-tertiary border border-border-subtle rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-text-secondary border border-border-light rounded-lg hover:bg-background-tertiary transition-colors"
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={!decisionStatement.trim() || !finalChoice.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={14} />
                Commit Decision
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
