import { useCalibration } from '../../hooks/useCalibration'
import { CalibrationChart } from './CalibrationChart'
import { TrendingUp, TrendingDown, Minus, Target, BarChart2, AlertTriangle } from 'lucide-react'

export function CalibrationDashboard() {
  const {
    metrics,
    hasEnoughData,
    isCalibrationGood,
    report,
    getCalibrationLabel,
    getCalibrationColor,
  } = useCalibration()

  const TrendIcon =
    metrics.trend.direction === 'improving'
      ? TrendingUp
      : metrics.trend.direction === 'declining'
        ? TrendingDown
        : Minus

  const trendColor =
    metrics.trend.direction === 'improving'
      ? 'var(--accent-mint)'
      : metrics.trend.direction === 'declining'
        ? 'var(--accent-lilac)'
        : 'var(--ink-muted)'

  if (!hasEnoughData) {
    return (
      <div className="calibration-dashboard">
        <div className="empty-calibration">
          <Target size={64} />
          <h2>Not Enough Data Yet</h2>
          <p>
            Record and review at least 5 decisions to see your calibration metrics.
          </p>
          <div className="progress-indicator">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(metrics.decisions_reviewed / 5) * 100}%` }}
              />
            </div>
            <span>{metrics.decisions_reviewed} / 5 decisions reviewed</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="calibration-dashboard">
      <div className="dashboard-header">
        <h2>Calibration Overview</h2>
        <p>How accurate are your predictions?</p>
      </div>

      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-header">
            <Target size={24} />
            <span>Overall Calibration</span>
          </div>
          <div
            className="metric-value large"
            style={{ color: getCalibrationColor(metrics.overall_score) }}
          >
            {metrics.overall_score > 0 ? '+' : ''}
            {metrics.overall_score.toFixed(2)}
          </div>
          <div className="metric-label">{getCalibrationLabel(metrics.overall_score)}</div>
          {isCalibrationGood && (
            <div className="metric-badge success">Well Calibrated</div>
          )}
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <BarChart2 size={20} />
            <span>Decisions Reviewed</span>
          </div>
          <div className="metric-value">{metrics.decisions_reviewed}</div>
          <div className="metric-sublabel">
            {metrics.decisions_pending} pending review
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <TrendIcon size={20} style={{ color: trendColor }} />
            <span>Trend</span>
          </div>
          <div className="metric-value capitalize" style={{ color: trendColor }}>
            {metrics.trend.direction}
          </div>
          <div className="metric-sublabel">
            {metrics.trend.change > 0 ? '+' : ''}
            {(metrics.trend.change * 100).toFixed(1)}% change
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h3>Calibration Over Time</h3>
        <CalibrationChart data={metrics.trend.data_points} />
      </div>

      <div className="dashboard-section">
        <h3>By Category</h3>
        <div className="category-calibration-grid">
          {Object.entries(metrics.by_category)
            .filter(([_, data]) => data.count > 0)
            .sort((a, b) => b[1].count - a[1].count)
            .map(([category, data]) => (
              <div key={category} className="category-card">
                <div className="category-header">
                  <span className="category-name">{data.label}</span>
                  <span className="category-count">{data.count} decisions</span>
                </div>
                <div
                  className="category-score"
                  style={{ color: getCalibrationColor(data.score) }}
                >
                  {data.score > 0 ? '+' : ''}
                  {data.score.toFixed(2)}
                </div>
                <div className="category-bar">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${50 + data.score * 50}%`,
                      backgroundColor: getCalibrationColor(data.score),
                    }}
                  />
                  <div className="bar-center" />
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="dashboard-section">
        <h3>Confidence vs Accuracy</h3>
        <div className="confidence-grid">
          {Object.entries(metrics.by_confidence)
            .filter(([_, data]) => data.count > 0)
            .map(([level, data]) => (
              <div key={level} className="confidence-card">
                <div className="confidence-header">
                  <span className="confidence-level">{level.replace('_', ' ')}</span>
                  <span className="confidence-count">{data.count}</span>
                </div>
                <div className="confidence-comparison">
                  <div className="comparison-row">
                    <span>Predicted</span>
                    <div className="comparison-bar">
                      <div
                        className="bar-fill predicted"
                        style={{ width: `${data.predicted_confidence * 100}%` }}
                      />
                    </div>
                    <span>{Math.round(data.predicted_confidence * 100)}%</span>
                  </div>
                  <div className="comparison-row">
                    <span>Actual</span>
                    <div className="comparison-bar">
                      <div
                        className="bar-fill actual"
                        style={{ width: `${data.actual_success_rate * 100}%` }}
                      />
                    </div>
                    <span>{Math.round(data.actual_success_rate * 100)}%</span>
                  </div>
                </div>
                <div
                  className="calibration-gap"
                  style={{ color: getCalibrationColor(data.calibration_gap) }}
                >
                  Gap: {data.calibration_gap > 0 ? '+' : ''}
                  {Math.round(data.calibration_gap * 100)}%
                </div>
              </div>
            ))}
        </div>
      </div>

      {report.recommendations.length > 0 && (
        <div className="dashboard-section">
          <h3>Recommendations</h3>
          <div className="recommendations-list">
            {report.recommendations.map((rec) => (
              <div key={rec.id} className="recommendation-card" data-priority={rec.priority}>
                <div className="rec-header">
                  <AlertTriangle size={16} />
                  <h4>{rec.title}</h4>
                  <span className="priority-badge">{rec.priority}</span>
                </div>
                <p className="rec-description">{rec.description}</p>
                <p className="rec-action">
                  <strong>Action:</strong> {rec.action}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
