import { useMemo } from 'react'
import { useDecisionsStore } from '../stores/decisions'
import {
  calculateCalibrationMetrics,
  generateCalibrationReport,
  calculateCalibrationScore,
  getCalibrationLabel,
  getCalibrationColor,
} from '../api/calibration'
import { detectPatterns, generateLessons } from '../api/patterns'
import type { Decision, CalibrationReport, DecisionPattern, Lesson } from '../types'

export function useCalibration() {
  const decisions = useDecisionsStore((state) => state.decisions)

  const metrics = useMemo(() => {
    return calculateCalibrationMetrics(decisions)
  }, [decisions])

  const report = useMemo(() => {
    return generateCalibrationReport(decisions)
  }, [decisions])

  const patterns = useMemo(() => {
    return detectPatterns(decisions)
  }, [decisions])

  const lessons = useMemo(() => {
    return generateLessons(decisions, patterns)
  }, [decisions, patterns])

  const calibrationScoreForDecision = (decision: Decision) => {
    return calculateCalibrationScore(decision)
  }

  const reviewedDecisions = useMemo(() => {
    return decisions.filter((d) => d.actual_outcome)
  }, [decisions])

  const calibrationHistory = useMemo(() => {
    return reviewedDecisions
      .map((d) => ({
        decision: d,
        score: calculateCalibrationScore(d),
        date: d.actual_outcome!.recorded_at,
      }))
      .filter((item) => item.score !== null)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [reviewedDecisions])

  const bestCalibrated = useMemo(() => {
    return reviewedDecisions
      .map((d) => ({
        decision: d,
        score: calculateCalibrationScore(d),
      }))
      .filter((item) => item.score !== null)
      .sort((a, b) => Math.abs(a.score!) - Math.abs(b.score!))
      .slice(0, 5)
  }, [reviewedDecisions])

  const worstCalibrated = useMemo(() => {
    return reviewedDecisions
      .map((d) => ({
        decision: d,
        score: calculateCalibrationScore(d),
      }))
      .filter((item) => item.score !== null)
      .sort((a, b) => Math.abs(b.score!) - Math.abs(a.score!))
      .slice(0, 5)
  }, [reviewedDecisions])

  const isCalibrationGood = metrics.overall_score >= -0.1 && metrics.overall_score <= 0.1

  const hasEnoughData = reviewedDecisions.length >= 5

  return {
    metrics,
    report,
    patterns,
    lessons,
    reviewedDecisions,
    calibrationHistory,
    bestCalibrated,
    worstCalibrated,
    isCalibrationGood,
    hasEnoughData,
    calibrationScoreForDecision,
    getCalibrationLabel,
    getCalibrationColor,
  }
}

export function useDecisionCalibration(decision: Decision) {
  const score = useMemo(() => {
    return calculateCalibrationScore(decision)
  }, [decision])

  const label = useMemo(() => {
    return score !== null ? getCalibrationLabel(score) : null
  }, [score])

  const color = useMemo(() => {
    return score !== null ? getCalibrationColor(score) : null
  }, [score])

  return {
    score,
    label,
    color,
    hasOutcome: !!decision.actual_outcome,
  }
}
