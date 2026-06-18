import type {
  Decision,
  CalibrationMetrics,
  CalibrationScore,
  CalibrationReport,
  CalibrationTrend,
  CalibrationDataPoint,
  CategoryCalibration,
  ConfidenceCalibration,
  DecisionCategory,
  ConfidenceLevel,
  Recommendation,
} from '../types'
import { detectPatterns } from './patterns'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'

export function calculateCalibrationScore(decision: Decision): CalibrationScore | null {
  if (!decision.actual_outcome) return null

  const predictedConfidence = decision.predicted_outcome.confidence_percent / 100
  const actualMatchScore = decision.actual_outcome.match_score / 100

  const score = predictedConfidence - actualMatchScore

  return Math.max(-1, Math.min(1, score))
}

export function calculateOverallCalibration(decisions: Decision[]): CalibrationScore {
  const reviewedDecisions = decisions.filter((d) => d.actual_outcome)

  if (reviewedDecisions.length === 0) return 0

  const scores = reviewedDecisions
    .map((d) => calculateCalibrationScore(d))
    .filter((s): s is number => s !== null)

  if (scores.length === 0) return 0

  return scores.reduce((sum, s) => sum + s, 0) / scores.length
}

export function calculateCategoryCalibration(
  decisions: Decision[]
): Record<DecisionCategory, CategoryCalibration> {
  const categories: DecisionCategory[] = [
    'technical',
    'product',
    'hiring',
    'strategy',
    'marketing',
    'operations',
    'financial',
    'other',
  ]

  const result: Record<DecisionCategory, CategoryCalibration> = {} as Record<
    DecisionCategory,
    CategoryCalibration
  >

  const categoryLabels: Record<DecisionCategory, string> = {
    technical: 'Technical',
    product: 'Product',
    hiring: 'Hiring',
    strategy: 'Strategy',
    marketing: 'Marketing',
    operations: 'Operations',
    financial: 'Financial',
    other: 'Other',
  }

  categories.forEach((category) => {
    const categoryDecisions = decisions.filter(
      (d) => d.category === category && d.actual_outcome
    )

    const scores = categoryDecisions
      .map((d) => calculateCalibrationScore(d))
      .filter((s): s is number => s !== null)

    result[category] = {
      score: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      count: categoryDecisions.length,
      label: categoryLabels[category],
    }
  })

  return result
}

export function calculateConfidenceCalibration(
  decisions: Decision[]
): Record<ConfidenceLevel, ConfidenceCalibration> {
  const levels: ConfidenceLevel[] = ['low', 'medium', 'high', 'very_high']
  const confidencePercents: Record<ConfidenceLevel, number> = {
    low: 25,
    medium: 50,
    high: 75,
    very_high: 90,
  }

  const result: Record<ConfidenceLevel, ConfidenceCalibration> = {} as Record<
    ConfidenceLevel,
    ConfidenceCalibration
  >

  levels.forEach((level) => {
    const levelDecisions = decisions.filter(
      (d) => d.predicted_outcome.confidence === level && d.actual_outcome
    )

    const actualSuccessRates = levelDecisions.map(
      (d) => d.actual_outcome!.match_score / 100
    )

    const avgSuccessRate =
      actualSuccessRates.length > 0
        ? actualSuccessRates.reduce((a, b) => a + b, 0) / actualSuccessRates.length
        : 0

    const predictedConfidence = confidencePercents[level] / 100

    result[level] = {
      predicted_confidence: predictedConfidence,
      actual_success_rate: avgSuccessRate,
      count: levelDecisions.length,
      calibration_gap: predictedConfidence - avgSuccessRate,
    }
  })

  return result
}

export function calculateCalibrationTrend(decisions: Decision[]): CalibrationTrend {
  const dataPoints: CalibrationDataPoint[] = []
  const now = new Date()

  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i))
    const monthEnd = endOfMonth(subMonths(now, i))

    const monthDecisions = decisions.filter((d) => {
      if (!d.actual_outcome) return false
      const reviewedAt = new Date(d.actual_outcome.recorded_at)
      return reviewedAt >= monthStart && reviewedAt <= monthEnd
    })

    const scores = monthDecisions
      .map((d) => calculateCalibrationScore(d))
      .filter((s): s is number => s !== null)

    dataPoints.push({
      date: format(monthStart, 'yyyy-MM'),
      score: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      decisions_count: monthDecisions.length,
    })
  }

  const recentPoints = dataPoints.slice(-3).filter((p) => p.decisions_count > 0)

  let direction: CalibrationTrend['direction'] = 'stable'
  let change = 0

  if (recentPoints.length >= 2) {
    const first = recentPoints[0].score
    const last = recentPoints[recentPoints.length - 1].score
    change = last - first

    if (Math.abs(change) < 0.05) {
      direction = 'stable'
    } else if (Math.abs(last) < Math.abs(first)) {
      direction = 'improving'
    } else {
      direction = 'declining'
    }
  }

  return { direction, change, data_points: dataPoints }
}

export function generateRecommendations(
  metrics: CalibrationMetrics
): Recommendation[] {
  const recommendations: Recommendation[] = []

  if (metrics.overall_score > 0.2) {
    recommendations.push({
      id: 'overconfidence-general',
      title: 'Reduce Overall Confidence',
      description: `Your predictions tend to be overconfident by ${Math.round(metrics.overall_score * 100)}%`,
      action: 'Consider adding buffer time and being more conservative with success estimates',
      priority: 'high',
    })
  } else if (metrics.overall_score < -0.2) {
    recommendations.push({
      id: 'underconfidence-general',
      title: 'Trust Your Judgment More',
      description: `Your predictions tend to be too pessimistic by ${Math.round(Math.abs(metrics.overall_score) * 100)}%`,
      action: 'Your outcomes are often better than predicted. Consider being more confident',
      priority: 'medium',
    })
  }

  Object.entries(metrics.by_category).forEach(([category, cal]) => {
    if (cal.count >= 3) {
      if (cal.score > 0.3) {
        recommendations.push({
          id: `overconfidence-${category}`,
          title: `Overconfidence in ${cal.label} Decisions`,
          description: `${cal.label} decisions show ${Math.round(cal.score * 100)}% overconfidence`,
          action: `Seek more input before making ${category} decisions`,
          priority: 'high',
        })
      } else if (cal.score < -0.3) {
        recommendations.push({
          id: `underconfidence-${category}`,
          title: `Underconfidence in ${cal.label} Decisions`,
          description: `${cal.label} decisions show ${Math.round(Math.abs(cal.score) * 100)}% underconfidence`,
          action: `You're better at ${category} than you think`,
          priority: 'low',
        })
      }
    }
  })

  return recommendations
}

export function calculateCalibrationMetrics(decisions: Decision[]): CalibrationMetrics {
  const reviewedDecisions = decisions.filter((d) => d.actual_outcome)
  const pendingDecisions = decisions.filter((d) => d.status === 'pending')

  const now = new Date()
  const sixMonthsAgo = subMonths(now, 6)

  return {
    overall_score: calculateOverallCalibration(decisions),
    decisions_reviewed: reviewedDecisions.length,
    decisions_pending: pendingDecisions.length,
    by_category: calculateCategoryCalibration(decisions),
    by_confidence: calculateConfidenceCalibration(decisions),
    trend: calculateCalibrationTrend(decisions),
    period_start: format(sixMonthsAgo, 'yyyy-MM-dd'),
    period_end: format(now, 'yyyy-MM-dd'),
  }
}

export function generateCalibrationReport(decisions: Decision[]): CalibrationReport {
  const metrics = calculateCalibrationMetrics(decisions)
  const patterns = detectPatterns(decisions)
  const recommendations = generateRecommendations(metrics)

  return {
    metrics,
    patterns,
    recommendations,
    generated_at: new Date().toISOString(),
  }
}

export function getCalibrationLabel(score: CalibrationScore): string {
  if (score < -0.4) return 'Very Pessimistic'
  if (score < -0.2) return 'Pessimistic'
  if (score < -0.05) return 'Slightly Pessimistic'
  if (score <= 0.05) return 'Well Calibrated'
  if (score <= 0.2) return 'Slightly Optimistic'
  if (score <= 0.4) return 'Optimistic'
  return 'Very Optimistic'
}

export function getCalibrationColor(score: CalibrationScore): string {
  const absScore = Math.abs(score)
  if (absScore <= 0.1) return 'var(--accent-mint)'
  if (absScore <= 0.3) return 'var(--accent-powder)'
  return 'var(--accent-lilac)'
}
