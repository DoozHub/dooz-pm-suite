import { useState } from 'react'
import { useDecisions } from '../../hooks/useDecisions'
import type { DecisionCategory, ConfidenceLevel, Alternative } from '../../types'
import { X, Plus, Trash2 } from 'lucide-react'

interface DecisionFormProps {
  onClose: () => void
}

const categories: { value: DecisionCategory; label: string }[] = [
  { value: 'technical', label: 'Technical' },
  { value: 'product', label: 'Product' },
  { value: 'hiring', label: 'Hiring' },
  { value: 'strategy', label: 'Strategy' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'operations', label: 'Operations' },
  { value: 'financial', label: 'Financial' },
  { value: 'other', label: 'Other' },
]

const confidenceLevels: { value: ConfidenceLevel; label: string; desc: string }[] = [
  { value: 'low', label: 'Low (25%)', desc: 'Uncertain, could go either way' },
  { value: 'medium', label: 'Medium (50%)', desc: 'Reasonably confident' },
  { value: 'high', label: 'High (75%)', desc: 'Very confident' },
  { value: 'very_high', label: 'Very High (90%)', desc: 'Almost certain' },
]

const importanceLevels = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

export function DecisionForm({ onClose }: DecisionFormProps) {
  const { addDecision } = useDecisions()

  const [what, setWhat] = useState('')
  const [why, setWhy] = useState('')
  const [context, setContext] = useState('')
  const [category, setCategory] = useState<DecisionCategory>('other')
  const [importance, setImportance] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [alternatives, setAlternatives] = useState<Alternative[]>([])
  const [tags, setTags] = useState('')
  const [predictedOutcome, setPredictedOutcome] = useState('')
  const [confidence, setConfidence] = useState<ConfidenceLevel>('medium')
  const [timeframeDays, setTimeframeDays] = useState(30)
  const [successCriteria, setSuccessCriteria] = useState<string[]>([''])

  const addAlternative = () => {
    setAlternatives([...alternatives, { description: '', reason_rejected: '' }])
  }

  const updateAlternative = (index: number, field: keyof Alternative, value: string) => {
    const updated = [...alternatives]
    updated[index][field] = value
    setAlternatives(updated)
  }

  const removeAlternative = (index: number) => {
    setAlternatives(alternatives.filter((_, i) => i !== index))
  }

  const addCriterion = () => {
    setSuccessCriteria([...successCriteria, ''])
  }

  const updateCriterion = (index: number, value: string) => {
    const updated = [...successCriteria]
    updated[index] = value
    setSuccessCriteria(updated)
  }

  const removeCriterion = (index: number) => {
    setSuccessCriteria(successCriteria.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!what.trim() || !why.trim() || !predictedOutcome.trim()) {
      return
    }

    addDecision({
      what: what.trim(),
      why: why.trim(),
      context: context.trim() || undefined,
      alternatives: alternatives.filter((a) => a.description.trim()),
      predicted_outcome: {
        description: predictedOutcome.trim(),
        confidence,
        timeframe_days: timeframeDays,
        success_criteria: successCriteria.filter((c) => c.trim()),
      },
      category,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      importance,
    })

    onClose()
  }

  return (
    <div className="decision-form">
      <div className="form-header">
        <h2>Record New Decision</h2>
        <button className="btn-icon" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>The Decision</h3>

          <div className="form-group">
            <label htmlFor="what">What did you decide?</label>
            <textarea
              id="what"
              value={what}
              onChange={(e) => setWhat(e.target.value)}
              placeholder="We decided to use PostgreSQL instead of MongoDB..."
              rows={2}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="why">Why this decision?</label>
            <textarea
              id="why"
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              placeholder="Better support for complex queries, team expertise..."
              rows={2}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="context">Additional context (optional)</label>
            <textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Team discussion, market research, constraints..."
              rows={2}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as DecisionCategory)}
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="importance">Importance</label>
              <select
                id="importance"
                value={importance}
                onChange={(e) =>
                  setImportance(e.target.value as 'low' | 'medium' | 'high' | 'critical')
                }
              >
                {importanceLevels.map((i) => (
                  <option key={i.value} value={i.value}>
                    {i.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags (comma-separated)</label>
            <input
              type="text"
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="database, infrastructure, q1-2024"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Alternatives Considered</h3>
          <p className="form-hint">What else did you consider? Why did you reject it?</p>

          {alternatives.map((alt, index) => (
            <div key={index} className="alternative-row">
              <div className="form-group flex-1">
                <input
                  type="text"
                  value={alt.description}
                  onChange={(e) => updateAlternative(index, 'description', e.target.value)}
                  placeholder="Alternative option..."
                />
              </div>
              <div className="form-group flex-1">
                <input
                  type="text"
                  value={alt.reason_rejected}
                  onChange={(e) => updateAlternative(index, 'reason_rejected', e.target.value)}
                  placeholder="Why rejected..."
                />
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => removeAlternative(index)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          <button type="button" className="btn btn-sm" onClick={addAlternative}>
            <Plus size={16} /> Add Alternative
          </button>
        </div>

        <div className="form-section">
          <h3>Predicted Outcome</h3>

          <div className="form-group">
            <label htmlFor="predicted">What do you expect to happen?</label>
            <textarea
              id="predicted"
              value={predictedOutcome}
              onChange={(e) => setPredictedOutcome(e.target.value)}
              placeholder="This will reduce query times by 50% and simplify our data model..."
              rows={3}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="confidence">Confidence Level</label>
              <select
                id="confidence"
                value={confidence}
                onChange={(e) => setConfidence(e.target.value as ConfidenceLevel)}
              >
                {confidenceLevels.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <span className="form-hint">
                {confidenceLevels.find((c) => c.value === confidence)?.desc}
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="timeframe">Review in (days)</label>
              <select
                id="timeframe"
                value={timeframeDays}
                onChange={(e) => setTimeframeDays(Number(e.target.value))}
              >
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
                <option value={180}>180 days</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Success Criteria</label>
            <p className="form-hint">How will you know this succeeded?</p>

            {successCriteria.map((criterion, index) => (
              <div key={index} className="criteria-row">
                <input
                  type="text"
                  value={criterion}
                  onChange={(e) => updateCriterion(index, e.target.value)}
                  placeholder="Query times under 100ms..."
                />
                {successCriteria.length > 1 && (
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => removeCriterion(index)}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}

            <button type="button" className="btn btn-sm" onClick={addCriterion}>
              <Plus size={16} /> Add Criterion
            </button>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Record Decision
          </button>
        </div>
      </form>
    </div>
  )
}
