import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { CalibrationDataPoint } from '../../types'

interface CalibrationChartProps {
  data: CalibrationDataPoint[]
}

export function CalibrationChart({ data }: CalibrationChartProps) {
  const hasData = data.some((d) => d.decisions_count > 0)

  if (!hasData) {
    return (
      <div className="chart-placeholder">
        <p>Not enough historical data to show trends</p>
      </div>
    )
  }

  const chartData = data.map((d) => ({
    ...d,
    displayScore: d.decisions_count > 0 ? d.score : null,
  }))

  return (
    <div className="calibration-chart">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="date"
            stroke="var(--ink-muted)"
            fontSize={12}
            tickFormatter={(value) => {
              const [year, month] = value.split('-')
              const date = new Date(parseInt(year), parseInt(month) - 1)
              return date.toLocaleDateString('en-US', { month: 'short' })
            }}
          />
          <YAxis
            domain={[-1, 1]}
            stroke="var(--ink-muted)"
            fontSize={12}
            tickFormatter={(value) => value.toFixed(1)}
            ticks={[-1, -0.5, 0, 0.5, 1]}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) return null

              const dataPoint = payload[0].payload as CalibrationDataPoint

              if (dataPoint.decisions_count === 0) {
                return (
                  <div className="chart-tooltip">
                    <p className="tooltip-label">{formatMonth(label)}</p>
                    <p className="tooltip-empty">No reviews this month</p>
                  </div>
                )
              }

              return (
                <div className="chart-tooltip">
                  <p className="tooltip-label">{formatMonth(label)}</p>
                  <p className="tooltip-value">
                    Score: {dataPoint.score > 0 ? '+' : ''}
                    {dataPoint.score.toFixed(2)}
                  </p>
                  <p className="tooltip-count">{dataPoint.decisions_count} decisions</p>
                </div>
              )
            }}
          />
          <ReferenceLine
            y={0}
            stroke="var(--accent-mint)"
            strokeWidth={2}
            strokeDasharray="5 5"
            label={{
              value: 'Perfect Calibration',
              position: 'right',
              fill: 'var(--accent-mint)',
              fontSize: 11,
            }}
          />
          <ReferenceLine
            y={0.2}
            stroke="var(--ink-muted)"
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.5}
          />
          <ReferenceLine
            y={-0.2}
            stroke="var(--ink-muted)"
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.5}
          />
          <Line
            type="monotone"
            dataKey="displayScore"
            stroke="var(--accent-blue)"
            strokeWidth={2}
            dot={{ fill: 'var(--accent-blue)', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: 'var(--accent-blue)' }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-color pessimistic" />
          <span>Pessimistic (-1 to 0)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color calibrated" />
          <span>Well Calibrated (around 0)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color optimistic" />
          <span>Optimistic (0 to +1)</span>
        </div>
      </div>
    </div>
  )
}

function formatMonth(dateStr: string): string {
  const [year, month] = dateStr.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}
