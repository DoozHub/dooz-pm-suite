import { useState } from 'react'
import { useDecisions } from '../../hooks/useDecisions'
import type { Decision } from '../../types'
import { X, CheckCircle, XCircle } from 'lucide-react'

interface OutcomeModalProps {
  decision: Decision
  onClose: () => void
}

export function OutcomeModal({ decision, onClose }: OutcomeModalProps) {
  const { recordOutcome } = useDecisions()

  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [successCriteriaMet, setSuccessCriteriaMet] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {}
      decision.predicted_outcome.success_criteria.forEach((c) => {
        initial[c] = false
      })
      return initial
    }
  )

  const toggleCriterion = (criterion: string) => {
    setSuccessCriteriaMet((prev) => ({
      ...prev,
      [criterion]: !prev[criterion],
    }))
  }

  const calculateMatchScore = (): number => {
    const criteria = decision.predicted_outcome.success_criteria
    if (criteria.length === 0) return 50

    const metCount = Object.values(successCriteriaMet).filter(Boolean).length
    return Math.round((metCount / criteria.length) * 100)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!description.trim()) return

    recordOutcome(decision.id, {
      description: description.trim(),
      match_score: calculateMatchScore(),
      success_criteria_met: successCriteriaMet,
      notes: notes.trim() || undefined,
    })

    onClose()
  }

  const matchScore = calculateMatchScore()

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal outcome-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Record Outcome</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="original-decision">
            <h4>Original Decision</h4>
            <p className="decision-what">{decision.what}</p>

            <div className="prediction-reminder">
              <h5>You predicted:</h5>
              <p>{decision.predicted_outcome.description}</p>
              <span className="confidence-badge">
                {decision.predicted_outcome.confidence_percent}% confident
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="outcome">What actually happened?</label>
              <textarea
                id="outcome"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the actual outcome..."
                rows={4}
                required
              />
            </div>

            {decision.predicted_outcome.success_criteria.length > 0 && (
              <div className="form-group">
                <label>Success Criteria</label>
                <p className="form-hint">Which criteria were met?</p>

                <div className="criteria-checklist">
                  {decision.predicted_outcome.success_criteria.map((criterion) => (
                    <button
                      key={criterion}
                      type="button"
                      className={`criterion-toggle ${successCriteriaMet[criterion] ? 'met' : 'not-met'}`}
                      onClick={() => toggleCriterion(criterion)}
                    >
                      {successCriteriaMet[criterion] ? (
                        <CheckCircle size={18} />
                      ) : (
                        <XCircle size={18} />
                      )}
                      <span>{criterion}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="match-score-preview">
              <span className="label">Match Score</span>
              <div className="score-bar">
                <div className="score-fill" style={{ width: `${matchScore}%` }} />
              </div>
              <span className="score-value">{matchScore}%</span>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Additional Notes (optional)</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What did you learn? What would you do differently?"
                rows={3}
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Outcome
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
