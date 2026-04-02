import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { Clock, User, ArrowRight } from 'lucide-react'
import type { Intent } from '../api/client'
import StateBadge from './StateBadge'

interface IntentCardProps {
  intent: Intent
  compact?: boolean
}

export default function IntentCard({ intent, compact }: IntentCardProps) {
  return (
    <Link to={`/intents/${intent.id}`}>
      <motion.div
        whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)' }}
        className="glass-card p-4 block"
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <StateBadge state={intent.currentState} />
          {!compact && (
            <ArrowRight size={14} className="text-text-muted shrink-0" />
          )}
        </div>
        <h3 className="font-medium text-text text-sm mb-1 line-clamp-1">{intent.title}</h3>
        {intent.description && !compact && (
          <p className="text-text-secondary text-xs line-clamp-2 mb-2">{intent.description}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <User size={12} />
            {intent.createdBy}
          </span>
          {intent.createdAt && (
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {new Date(intent.createdAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </motion.div>
    </Link>
  )
}
