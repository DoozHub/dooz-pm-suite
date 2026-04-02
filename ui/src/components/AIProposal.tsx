import { motion } from 'framer-motion'
import { Check, X, Clock, Brain } from 'lucide-react'
import type { Proposal } from '../api/client'

interface AIProposalProps {
  proposal: Proposal
  onAccept: (id: string) => void
  onReject: (id: string) => void
  onPark: (id: string) => void
}

const typeColors = {
  decision: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  assumption: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  risk: 'text-red-400 bg-red-500/10 border-red-500/20',
  question: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
}

const statusColors = {
  pending: 'text-amber-400',
  accepted: 'text-emerald-400',
  rejected: 'text-red-400',
  parked: 'text-zinc-400',
}

export default function AIProposal({ proposal, onAccept, onReject, onPark }: AIProposalProps) {
  const content = (() => {
    try {
      return JSON.parse(proposal.content)
    } catch {
      return { text: proposal.content }
    }
  })()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-accent" />
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${typeColors[proposal.proposalType]}`}>
            {proposal.proposalType}
          </span>
          <span className={`text-xs font-medium ${statusColors[proposal.status]}`}>
            {proposal.status}
          </span>
        </div>
        {proposal.confidence && (
          <span className="text-xs text-text-muted">
            {Math.round(proposal.confidence * 100)}% confidence
          </span>
        )}
      </div>

      <div className="text-sm text-text mb-3">
        {content.text || content.statement || proposal.content}
      </div>

      {proposal.modelUsed && (
        <div className="text-xs text-text-muted mb-3">
          Model: {proposal.modelUsed}
        </div>
      )}

      {proposal.status === 'pending' && (
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAccept(proposal.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-xs font-medium hover:bg-emerald-500/20 transition-colors"
          >
            <Check size={12} />
            Accept
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onReject(proposal.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md text-xs font-medium hover:bg-red-500/20 transition-colors"
          >
            <X size={12} />
            Reject
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onPark(proposal.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 rounded-md text-xs font-medium hover:bg-zinc-500/20 transition-colors"
          >
            <Clock size={12} />
            Park
          </motion.button>
        </div>
      )}
    </motion.div>
  )
}
