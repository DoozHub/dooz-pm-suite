import { format } from 'date-fns'
import { useDecisionCalibration } from '../../hooks/useCalibration'
import type { Decision } from '../../types'
import { Clock, Tag, CheckCircle, AlertCircle, Calendar } from 'lucide-react'

interface DecisionCardProps {
  decision: Decision
  onReview?: () => void
  compact?: boolean
}

const importanceColors = {
  low: 'var(--ink-muted)',
  medium: 'var(--accent-powder)',
  high: 'var(--accent-lilac)',
  critical: 'var(--accent-blue)',
}

const statusIcons = {
  pending: Clock,
  reviewed: CheckCircle,
  expired: AlertCircle,
  cancelled: AlertCircle,
}

export function DecisionCard({ decision, onReview, compact = false }: DecisionCardProps) {
  const { score, label, color, hasOutcome } = useDecisionCalibration(decision)

  const StatusIcon = statusIcons[decision.status]
  const createdDate = format(new Date(decision.created_at), 'MMM d, yyyy')

  const nextReview = decision.review_dates.find((rd) => !rd.completed)
  const isReviewDue = nextReview && new Date(nextReview.date) <= new Date()

  if (compact) {
    return (
      <div className={`decision-card compact ${isReviewDue ? 'review-due' : ''}`}>
        <div className="card-main">
          <span className="category-badge" data-category={decision.category}>
            {decision.category}
          </span>
          <h4>{decision.what}</h4>
          <span className="date">{createdDate}</span>
        </div>
        {isReviewDue && onReview && (
          <button className="btn btn-sm btn-primary" onClick={onReview}>
            Review
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={`decision-card ${isReviewDue ? 'review-due' : ''}`}>
      <div className="card-header">
        <div className="card-meta">
          <span className="category-badge" data-category={decision.category}>
            {decision.category}
          </span>
          <span
            className="importance-indicator"
            style={{ backgroundColor: importanceColors[decision.importance] }}
          >
            {decision.importance}
          </span>
          <span className="status-badge" data-status={decision.status}>
            <StatusIcon size={14} />
            {decision.status}
          </span>
        </div>
        <span className="date">
          <Calendar size={14} />
          {createdDate}
        </span>
      </div>

      <div className="card-body">
        <h3 className="decision-what">{decision.what}</h3>
        <p className="decision-why">{decision.why}</p>

        <div className="prediction-box">
          <h4>Predicted Outcome</h4>
          <p>{decision.predicted_outcome.description}</p>
          <div className="prediction-meta">
            <span className="confidence" data-level={decision.predicted_outcome.confidence}>
              {decision.predicted_outcome.confidence_percent}% confident
            </span>
            <span className="timeframe">
              <Clock size={14} />
              {decision.predicted_outcome.timeframe_days} days
            </span>
          </div>
        </div>

        {hasOutcome && decision.actual_outcome && (
          <div className="outcome-box">
            <h4>Actual Outcome</h4>
            <p>{decision.actual_outcome.description}</p>
            <div className="outcome-meta">
              <span className="match-score">
                {decision.actual_outcome.match_score}% match
              </span>
              {score !== null && (
                <span className="calibration-score" style={{ backgroundColor: color || undefined }}>
                  {label} ({score > 0 ? '+' : ''}{score.toFixed(2)})
                </span>
              )}
            </div>
          </div>
        )}

        {decision.alternatives.length > 0 && (
          <div className="alternatives-section">
            <h4>Alternatives Considered</h4>
            <ul>
              {decision.alternatives.map((alt, i) => (
                <li key={i}>
                  <strong>{alt.description}</strong>
                  <span className="rejected-reason">— {alt.reason_rejected}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {decision.tags.length > 0 && (
          <div className="tags-section">
            <Tag size={14} />
            {decision.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {isReviewDue && onReview && (
        <div className="card-footer">
          <div className="review-prompt">
            <AlertCircle size={16} />
            <span>Review due — How did this turn out?</span>
          </div>
          <button className="btn btn-primary" onClick={onReview}>
            Record Outcome
          </button>
        </div>
      )}
    </div>
  )
}
