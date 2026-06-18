import { v4 as uuidv4 } from 'uuid'
import type {
  Decision,
  DecisionPattern,
  PatternType,
  Lesson,
  DecisionCategory,
} from '../types'
import { calculateCalibrationScore } from './calibration'

interface PatternDetector {
  type: PatternType
  detect: (decisions: Decision[]) => DecisionPattern | null
}

const patternDetectors: PatternDetector[] = [
  {
    type: 'overconfidence',
    detect: (decisions) => {
      const reviewed = decisions.filter((d) => d.actual_outcome)
      if (reviewed.length < 3) return null

      const overconfidentCount = reviewed.filter((d) => {
        const score = calculateCalibrationScore(d)
        return score !== null && score > 0.3
      }).length

      const frequency = overconfidentCount / reviewed.length

      if (frequency < 0.4) return null

      return {
        id: uuidv4(),
        type: 'overconfidence',
        description: `${Math.round(frequency * 100)}% of your predictions are overconfident`,
        frequency,
        impact: 'negative',
        confidence: Math.min(0.5 + reviewed.length * 0.05, 0.95),
        examples: reviewed
          .filter((d) => {
            const score = calculateCalibrationScore(d)
            return score !== null && score > 0.3
          })
          .slice(0, 3)
          .map((d) => d.what),
        detected_at: new Date().toISOString(),
      }
    },
  },
  {
    type: 'underconfidence',
    detect: (decisions) => {
      const reviewed = decisions.filter((d) => d.actual_outcome)
      if (reviewed.length < 3) return null

      const underconfidentCount = reviewed.filter((d) => {
        const score = calculateCalibrationScore(d)
        return score !== null && score < -0.3
      }).length

      const frequency = underconfidentCount / reviewed.length

      if (frequency < 0.4) return null

      return {
        id: uuidv4(),
        type: 'underconfidence',
        description: `${Math.round(frequency * 100)}% of your predictions are too pessimistic`,
        frequency,
        impact: 'neutral',
        confidence: Math.min(0.5 + reviewed.length * 0.05, 0.95),
        examples: reviewed
          .filter((d) => {
            const score = calculateCalibrationScore(d)
            return score !== null && score < -0.3
          })
          .slice(0, 3)
          .map((d) => d.what),
        detected_at: new Date().toISOString(),
      }
    },
  },
  {
    type: 'timeline_optimism',
    detect: (decisions) => {
      const techDecisions = decisions.filter(
        (d) => d.category === 'technical' && d.actual_outcome
      )
      if (techDecisions.length < 3) return null

      const overoptimistic = techDecisions.filter((d) => {
        const score = calculateCalibrationScore(d)
        return score !== null && score > 0.25
      })

      const frequency = overoptimistic.length / techDecisions.length

      if (frequency < 0.5) return null

      return {
        id: uuidv4(),
        type: 'timeline_optimism',
        description: 'Technical timeline estimates are consistently optimistic',
        category: 'technical',
        frequency,
        impact: 'negative',
        confidence: Math.min(0.5 + techDecisions.length * 0.08, 0.95),
        examples: overoptimistic.slice(0, 3).map((d) => d.what),
        detected_at: new Date().toISOString(),
      }
    },
  },
  {
    type: 'success_bias',
    detect: (decisions) => {
      const highConfidence = decisions.filter(
        (d) =>
          (d.predicted_outcome.confidence === 'high' ||
            d.predicted_outcome.confidence === 'very_high') &&
          d.actual_outcome
      )

      if (highConfidence.length < 5) return null

      const actualSuccessRate =
        highConfidence.reduce((sum, d) => sum + d.actual_outcome!.match_score, 0) /
        highConfidence.length /
        100

      if (actualSuccessRate >= 0.7) return null

      return {
        id: uuidv4(),
        type: 'success_bias',
        description: `High-confidence decisions succeed only ${Math.round(actualSuccessRate * 100)}% of the time`,
        frequency: 1 - actualSuccessRate,
        impact: 'negative',
        confidence: Math.min(0.5 + highConfidence.length * 0.05, 0.95),
        examples: highConfidence
          .filter((d) => d.actual_outcome!.match_score < 50)
          .slice(0, 3)
          .map((d) => d.what),
        detected_at: new Date().toISOString(),
      }
    },
  },
  {
    type: 'risk_aversion',
    detect: (decisions) => {
      if (decisions.length < 5) return null

      const lowConfidenceCount = decisions.filter(
        (d) => d.predicted_outcome.confidence === 'low'
      ).length

      const frequency = lowConfidenceCount / decisions.length

      if (frequency < 0.5) return null

      const reviewed = decisions.filter(
        (d) => d.predicted_outcome.confidence === 'low' && d.actual_outcome
      )
      const avgSuccess =
        reviewed.length > 0
          ? reviewed.reduce((sum, d) => sum + d.actual_outcome!.match_score, 0) /
            reviewed.length
          : 50

      if (avgSuccess < 60) return null

      return {
        id: uuidv4(),
        type: 'risk_aversion',
        description: `You mark ${Math.round(frequency * 100)}% of decisions as low confidence, but outcomes average ${Math.round(avgSuccess)}%`,
        frequency,
        impact: 'neutral',
        confidence: 0.7,
        examples: reviewed
          .filter((d) => d.actual_outcome!.match_score > 70)
          .slice(0, 3)
          .map((d) => d.what),
        detected_at: new Date().toISOString(),
      }
    },
  },
]

export function detectPatterns(decisions: Decision[]): DecisionPattern[] {
  const patterns: DecisionPattern[] = []

  for (const detector of patternDetectors) {
    const pattern = detector.detect(decisions)
    if (pattern) {
      patterns.push(pattern)
    }
  }

  return patterns.sort((a, b) => b.confidence - a.confidence)
}

export function detectCategoryPatterns(
  decisions: Decision[],
  category: DecisionCategory
): DecisionPattern[] {
  const categoryDecisions = decisions.filter((d) => d.category === category)
  return detectPatterns(categoryDecisions).map((p) => ({ ...p, category }))
}

export function generateLessons(
  decisions: Decision[],
  patterns: DecisionPattern[]
): Lesson[] {
  const lessons: Lesson[] = []

  const overconfidencePattern = patterns.find((p) => p.type === 'overconfidence')
  if (overconfidencePattern && overconfidencePattern.confidence > 0.6) {
    lessons.push({
      id: uuidv4(),
      title: 'Build in Reality Buffers',
      insight:
        'Your predictions consistently overestimate success. This is common and can be addressed.',
      source_decisions: overconfidencePattern.examples.slice(0, 3),
      actionable_advice:
        'Before finalizing predictions, apply a "reality buffer": reduce confidence by 20% and add 30% to timelines.',
      created_at: new Date().toISOString(),
    })
  }

  const timelinePattern = patterns.find((p) => p.type === 'timeline_optimism')
  if (timelinePattern && timelinePattern.confidence > 0.6) {
    lessons.push({
      id: uuidv4(),
      title: 'Double Your Technical Estimates',
      insight:
        'Technical projects consistently take longer than predicted. This is the "planning fallacy" in action.',
      source_decisions: timelinePattern.examples.slice(0, 3),
      category: 'technical',
      actionable_advice:
        'Multiply technical timeline estimates by 2x. For complex projects with dependencies, use 3x.',
      created_at: new Date().toISOString(),
    })
  }

  const underconfidencePattern = patterns.find((p) => p.type === 'underconfidence')
  if (underconfidencePattern && underconfidencePattern.confidence > 0.6) {
    lessons.push({
      id: uuidv4(),
      title: 'Trust Your Instincts More',
      insight:
        "You're systematically underestimating your success rate. Your judgment is better than you think.",
      source_decisions: underconfidencePattern.examples.slice(0, 3),
      actionable_advice:
        'When you feel "low confidence," bump it up to medium. Your track record supports higher confidence.',
      created_at: new Date().toISOString(),
    })
  }

  const reviewed = decisions.filter((d) => d.actual_outcome)
  if (reviewed.length >= 10) {
    const perfectlyCalibrated = reviewed.filter((d) => {
      const score = calculateCalibrationScore(d)
      return score !== null && Math.abs(score) < 0.1
    })

    if (perfectlyCalibrated.length >= 3) {
      const commonCategory = findMostCommonCategory(perfectlyCalibrated)
      if (commonCategory) {
        lessons.push({
          id: uuidv4(),
          title: `Your ${commonCategory} Intuition is Strong`,
          insight: `${commonCategory} decisions show excellent calibration. You have good judgment here.`,
          source_decisions: perfectlyCalibrated.slice(0, 3).map((d) => d.what),
          category: commonCategory,
          actionable_advice: `Trust your gut on ${commonCategory} decisions. Your track record is solid.`,
          created_at: new Date().toISOString(),
        })
      }
    }
  }

  return lessons
}

function findMostCommonCategory(
  decisions: Decision[]
): DecisionCategory | null {
  const counts: Record<string, number> = {}

  decisions.forEach((d) => {
    counts[d.category] = (counts[d.category] || 0) + 1
  })

  let maxCategory: DecisionCategory | null = null
  let maxCount = 0

  Object.entries(counts).forEach(([category, count]) => {
    if (count > maxCount) {
      maxCount = count
      maxCategory = category as DecisionCategory
    }
  })

  return maxCount >= 2 ? maxCategory : null
}

export function getPatternTypeLabel(type: PatternType): string {
  const labels: Record<PatternType, string> = {
    overconfidence: 'Overconfidence',
    underconfidence: 'Underconfidence',
    timeline_optimism: 'Timeline Optimism',
    timeline_pessimism: 'Timeline Pessimism',
    success_bias: 'Success Bias',
    risk_aversion: 'Risk Aversion',
    anchoring: 'Anchoring',
    recency_bias: 'Recency Bias',
    confirmation_bias: 'Confirmation Bias',
    sunk_cost: 'Sunk Cost Fallacy',
    other: 'Other Pattern',
  }

  return labels[type]
}

export function getPatternIcon(type: PatternType): string {
  const icons: Record<PatternType, string> = {
    overconfidence: '📈',
    underconfidence: '📉',
    timeline_optimism: '⏰',
    timeline_pessimism: '🐢',
    success_bias: '🎯',
    risk_aversion: '🛡️',
    anchoring: '⚓',
    recency_bias: '🔄',
    confirmation_bias: '🔍',
    sunk_cost: '💸',
    other: '📊',
  }

  return icons[type]
}
