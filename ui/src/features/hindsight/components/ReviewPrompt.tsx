import { useState } from 'react'
import type { Decision } from '../../types'
import { OutcomeModal } from './OutcomeModal'
import { AlertCircle, ChevronRight, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ReviewPromptProps {
  decisions: Decision[]
}

export function ReviewPrompt({ decisions }: ReviewPromptProps) {
  const [reviewingDecision, setReviewingDecision] = useState<Decision | null>(null)
  const [expanded, setExpanded] = useState(false)

  if (decisions.length === 0) return null

  const displayedDecisions = expanded ? decisions : decisions.slice(0, 3)

  return (
    <div className="review-prompt-banner">
      <div className="banner-header">
        <AlertCircle size={20} className="alert-icon" />
        <div>
          <h3>
            {decisions.length} decision{decisions.length !== 1 ? 's' : ''} ready for review
          </h3>
          <p>Time to check how your predictions turned out</p>
        </div>
      </div>

      <div className="review-list">
        {displayedDecisions.map((decision) => {
          const age = formatDistanceToNow(new Date(decision.created_at), {
            addSuffix: true,
          })

          return (
            <div key={decision.id} className="review-item">
              <div className="review-item-content">
                <span className="category-badge" data-category={decision.category}>
                  {decision.category}
                </span>
                <span className="decision-title">{decision.what}</span>
                <span className="decision-age">
                  <Clock size={14} />
                  {age}
                </span>
              </div>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => setReviewingDecision(decision)}
              >
                Review
                <ChevronRight size={14} />
              </button>
            </div>
          )
        })}
      </div>

      {decisions.length > 3 && (
        <button className="btn btn-sm expand-btn" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show less' : `Show ${decisions.length - 3} more`}
        </button>
      )}

      {reviewingDecision && (
        <OutcomeModal
          decision={reviewingDecision}
          onClose={() => setReviewingDecision(null)}
        />
      )}
    </div>
  )
}
