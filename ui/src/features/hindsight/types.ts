export type DecisionCategory =
  | 'technical'
  | 'product'
  | 'hiring'
  | 'strategy'
  | 'marketing'
  | 'operations'
  | 'financial'
  | 'other'

export type ReviewTimeframe = 30 | 60 | 90

export type DecisionStatus = 'pending' | 'reviewed' | 'expired' | 'cancelled'

export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'very_high'

export interface PredictedOutcome {
  description: string
  confidence: ConfidenceLevel
  confidence_percent: number
  timeframe_days: number
  success_criteria: string[]
}

export interface ActualOutcome {
  description: string
  match_score: number
  recorded_at: string
  success_criteria_met: Record<string, boolean>
  notes?: string
}

export interface Decision {
  id: string
  what: string
  why: string
  context?: string
  alternatives: Alternative[]
  predicted_outcome: PredictedOutcome
  actual_outcome?: ActualOutcome
  category: DecisionCategory
  tags: string[]
  status: DecisionStatus
  created_at: string
  updated_at: string
  review_dates: ReviewDate[]
  stakeholders?: string[]
  importance: 'low' | 'medium' | 'high' | 'critical'
}

export interface Alternative {
  description: string
  reason_rejected: string
}

export interface ReviewDate {
  days: ReviewTimeframe
  date: string
  completed: boolean
  completed_at?: string
}

export type CalibrationScore = number

export interface CalibrationMetrics {
  overall_score: CalibrationScore
  decisions_reviewed: number
  decisions_pending: number
  by_category: Record<DecisionCategory, CategoryCalibration>
  by_confidence: Record<ConfidenceLevel, ConfidenceCalibration>
  trend: CalibrationTrend
  period_start: string
  period_end: string
}

export interface CategoryCalibration {
  score: CalibrationScore
  count: number
  label: string
}

export interface ConfidenceCalibration {
  predicted_confidence: number
  actual_success_rate: number
  count: number
  calibration_gap: number
}

export interface CalibrationTrend {
  direction: 'improving' | 'stable' | 'declining'
  change: number
  data_points: CalibrationDataPoint[]
}

export interface CalibrationDataPoint {
  date: string
  score: CalibrationScore
  decisions_count: number
}

export interface CalibrationReport {
  metrics: CalibrationMetrics
  patterns: DecisionPattern[]
  recommendations: Recommendation[]
  generated_at: string
}

export interface DecisionPattern {
  id: string
  type: PatternType
  description: string
  category?: DecisionCategory
  frequency: number
  impact: 'positive' | 'negative' | 'neutral'
  confidence: number
  examples: string[]
  detected_at: string
}

export type PatternType =
  | 'overconfidence'
  | 'underconfidence'
  | 'timeline_optimism'
  | 'timeline_pessimism'
  | 'success_bias'
  | 'risk_aversion'
  | 'anchoring'
  | 'recency_bias'
  | 'confirmation_bias'
  | 'sunk_cost'
  | 'other'

export interface Recommendation {
  id: string
  title: string
  description: string
  action: string
  based_on_pattern?: string
  priority: 'low' | 'medium' | 'high'
}

export interface Lesson {
  id: string
  title: string
  insight: string
  source_decisions: string[]
  category?: DecisionCategory
  actionable_advice: string
  created_at: string
}

export interface DecisionFilters {
  categories?: DecisionCategory[]
  status?: DecisionStatus[]
  importance?: Decision['importance'][]
  date_from?: string
  date_to?: string
  search?: string
  tags?: string[]
}

export interface DecisionStats {
  total: number
  pending_review: number
  reviewed: number
  by_category: Record<DecisionCategory, number>
  by_status: Record<DecisionStatus, number>
  this_month: number
  this_week: number
}
