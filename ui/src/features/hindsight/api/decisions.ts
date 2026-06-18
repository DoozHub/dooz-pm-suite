import { v4 as uuidv4 } from 'uuid'
import type {
  Decision,
  DecisionCategory,
  PredictedOutcome,
  Alternative,
  ReviewTimeframe,
  ActualOutcome,
} from '../types'
import { addDays, format } from 'date-fns'

export interface CreateDecisionInput {
  what: string
  why: string
  context?: string
  alternatives: Alternative[]
  predicted_outcome: Omit<PredictedOutcome, 'confidence_percent'>
  category: DecisionCategory
  tags: string[]
  stakeholders?: string[]
  importance: Decision['importance']
  review_timeframes?: ReviewTimeframe[]
}

export interface UpdateDecisionInput {
  what?: string
  why?: string
  context?: string
  alternatives?: Alternative[]
  category?: DecisionCategory
  tags?: string[]
  stakeholders?: string[]
  importance?: Decision['importance']
}

const confidenceToPercent: Record<string, number> = {
  low: 25,
  medium: 50,
  high: 75,
  very_high: 90,
}

function generateReviewDates(
  timeframes: ReviewTimeframe[] = [30, 60, 90]
): Decision['review_dates'] {
  const now = new Date()
  return timeframes.map((days) => ({
    days,
    date: format(addDays(now, days), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
    completed: false,
  }))
}

export function createDecision(input: CreateDecisionInput): Decision {
  const now = new Date().toISOString()

  const decision: Decision = {
    id: uuidv4(),
    what: input.what,
    why: input.why,
    context: input.context,
    alternatives: input.alternatives,
    predicted_outcome: {
      ...input.predicted_outcome,
      confidence_percent: confidenceToPercent[input.predicted_outcome.confidence],
    },
    category: input.category,
    tags: input.tags,
    status: 'pending',
    created_at: now,
    updated_at: now,
    review_dates: generateReviewDates(input.review_timeframes),
    stakeholders: input.stakeholders,
    importance: input.importance,
  }

  return decision
}

export function updateDecision(
  decision: Decision,
  updates: UpdateDecisionInput
): Decision {
  return {
    ...decision,
    ...updates,
    updated_at: new Date().toISOString(),
  }
}

export function recordActualOutcome(
  decision: Decision,
  outcomeInput: {
    description: string
    match_score: number
    success_criteria_met: Record<string, boolean>
    notes?: string
  }
): Decision {
  const outcome: ActualOutcome = {
    ...outcomeInput,
    recorded_at: new Date().toISOString(),
  }

  return {
    ...decision,
    actual_outcome: outcome,
    status: 'reviewed',
    updated_at: new Date().toISOString(),
    review_dates: decision.review_dates.map((rd) => ({
      ...rd,
      completed: true,
      completed_at: new Date().toISOString(),
    })),
  }
}

export function calculateMatchScore(
  predicted: PredictedOutcome,
  successCriteriaMet: Record<string, boolean>
): number {
  const criteria = predicted.success_criteria
  if (criteria.length === 0) return 0

  const metCount = criteria.filter((c) => successCriteriaMet[c] === true).length
  return (metCount / criteria.length) * 100
}

export function getDecisionAge(decision: Decision): number {
  const created = new Date(decision.created_at)
  const now = new Date()
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
}

export function getNextReviewDate(decision: Decision): Date | null {
  const pendingReview = decision.review_dates.find((rd) => !rd.completed)
  return pendingReview ? new Date(pendingReview.date) : null
}

export function isReviewDue(decision: Decision): boolean {
  const nextReview = getNextReviewDate(decision)
  if (!nextReview) return false
  return nextReview <= new Date()
}

export function getReviewProgress(decision: Decision): {
  completed: number
  total: number
  percentage: number
} {
  const completed = decision.review_dates.filter((rd) => rd.completed).length
  const total = decision.review_dates.length
  return {
    completed,
    total,
    percentage: total > 0 ? (completed / total) * 100 : 0,
  }
}

export function exportDecisions(decisions: Decision[]): string {
  return JSON.stringify(decisions, null, 2)
}

export function importDecisions(json: string): Decision[] {
  try {
    const data = JSON.parse(json)
    if (!Array.isArray(data)) {
      throw new Error('Invalid format: expected array of decisions')
    }
    return data as Decision[]
  } catch (error) {
    throw new Error(`Failed to import decisions: ${error}`)
  }
}
