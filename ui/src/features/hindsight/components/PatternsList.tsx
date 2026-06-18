import { useCalibration } from '../../hooks/useCalibration'
import { getPatternTypeLabel, getPatternIcon } from '../../api/patterns'
import type { DecisionPattern } from '../../types'
import { Brain, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react'

export function PatternsList() {
  const { patterns, hasEnoughData } = useCalibration()

  if (!hasEnoughData) {
    return (
      <div className="patterns-list">
        <div className="empty-patterns">
          <Brain size={64} />
          <h2>Pattern Detection Needs More Data</h2>
          <p>
            Review more decisions to enable pattern detection. We need at least 5
            reviewed decisions to identify patterns.
          </p>
        </div>
      </div>
    )
  }

  if (patterns.length === 0) {
    return (
      <div className="patterns-list">
        <div className="empty-patterns success">
          <Brain size={64} />
          <h2>No Significant Patterns Detected</h2>
          <p>
            Great news! We haven't found any concerning patterns in your
            decision-making. Keep recording decisions to get ongoing insights.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="patterns-list">
      <div className="patterns-header">
        <h2>Detected Patterns</h2>
        <p>
          Patterns are identified by analyzing your predictions vs actual outcomes
          across multiple decisions.
        </p>
      </div>

      <div className="patterns-grid">
        {patterns.map((pattern) => (
          <PatternCard key={pattern.id} pattern={pattern} />
        ))}
      </div>

      <div className="patterns-explanation">
        <h3>Understanding Patterns</h3>
        <div className="explanation-grid">
          <div className="explanation-item">
            <TrendingUp size={20} className="positive" />
            <div>
              <strong>Overconfidence</strong>
              <p>Predictions are more optimistic than outcomes</p>
            </div>
          </div>
          <div className="explanation-item">
            <TrendingDown size={20} className="negative" />
            <div>
              <strong>Underconfidence</strong>
              <p>Outcomes are better than predictions</p>
            </div>
          </div>
          <div className="explanation-item">
            <Minus size={20} className="neutral" />
            <div>
              <strong>Well Calibrated</strong>
              <p>Predictions match reality closely</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PatternCard({ pattern }: { pattern: DecisionPattern }) {
  const icon = getPatternIcon(pattern.type)
  const label = getPatternTypeLabel(pattern.type)

  const impactColor =
    pattern.impact === 'positive'
      ? 'var(--accent-mint)'
      : pattern.impact === 'negative'
        ? 'var(--accent-lilac)'
        : 'var(--ink-muted)'

  return (
    <div className="pattern-card" data-impact={pattern.impact}>
      <div className="pattern-header">
        <span className="pattern-icon">{icon}</span>
        <div className="pattern-title">
          <h3>{label}</h3>
          {pattern.category && (
            <span className="category-badge">{pattern.category}</span>
          )}
        </div>
        <div className="pattern-confidence">
          <span className="confidence-value">
            {Math.round(pattern.confidence * 100)}%
          </span>
          <span className="confidence-label">confidence</span>
        </div>
      </div>

      <p className="pattern-description">{pattern.description}</p>

      <div className="pattern-frequency">
        <div className="frequency-bar">
          <div
            className="frequency-fill"
            style={{
              width: `${pattern.frequency * 100}%`,
              backgroundColor: impactColor,
            }}
          />
        </div>
        <span>{Math.round(pattern.frequency * 100)}% of decisions</span>
      </div>

      {pattern.examples.length > 0 && (
        <div className="pattern-examples">
          <h4>Examples</h4>
          <ul>
            {pattern.examples.map((example, i) => (
              <li key={i}>{example}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="pattern-impact" style={{ color: impactColor }}>
        <AlertCircle size={14} />
        <span>
          {pattern.impact === 'positive'
            ? 'This is a strength'
            : pattern.impact === 'negative'
              ? 'Area for improvement'
              : 'Neutral observation'}
        </span>
      </div>
    </div>
  )
}
