import { useCallback, useMemo } from 'react'
import { useDecisionsStore } from '../stores/decisions'
import {
  createDecision,
  updateDecision as apiUpdateDecision,
  recordActualOutcome,
  isReviewDue,
  getNextReviewDate,
  getDecisionAge,
  type CreateDecisionInput,
  type UpdateDecisionInput,
} from '../api/decisions'
import type { Decision, DecisionFilters, ActualOutcome } from '../types'

export function useDecisions() {
  const store = useDecisionsStore()

  const addDecision = useCallback(
    (input: CreateDecisionInput) => {
      const decision = createDecision(input)
      store.addDecision(decision)
      return decision
    },
    [store]
  )

  const updateDecision = useCallback(
    (id: string, updates: UpdateDecisionInput) => {
      const existing = store.getDecisionById(id)
      if (!existing) return null

      const updated = apiUpdateDecision(existing, updates)
      store.updateDecision(id, updated)
      return updated
    },
    [store]
  )

  const deleteDecision = useCallback(
    (id: string) => {
      store.deleteDecision(id)
    },
    [store]
  )

  const recordOutcome = useCallback(
    (
      id: string,
      outcomeInput: {
        description: string
        match_score: number
        success_criteria_met: Record<string, boolean>
        notes?: string
      }
    ) => {
      const existing = store.getDecisionById(id)
      if (!existing) return null

      const outcome: ActualOutcome = {
        ...outcomeInput,
        recorded_at: new Date().toISOString(),
      }

      store.recordOutcome(id, outcome)

      return { ...existing, actual_outcome: outcome, status: 'reviewed' as const }
    },
    [store]
  )

  const setFilters = useCallback(
    (filters: DecisionFilters) => {
      store.setFilters(filters)
    },
    [store]
  )

  const clearFilters = useCallback(() => {
    store.clearFilters()
  }, [store])

  const filteredDecisions = useMemo(() => {
    return store.getFilteredDecisions()
  }, [store.decisions, store.filters])

  const pendingReviews = useMemo(() => {
    return store.getPendingReviews()
  }, [store.decisions])

  const stats = useMemo(() => {
    return store.getStats()
  }, [store.decisions])

  const getDecisionWithMeta = useCallback(
    (id: string) => {
      const decision = store.getDecisionById(id)
      if (!decision) return null

      return {
        ...decision,
        age: getDecisionAge(decision),
        isReviewDue: isReviewDue(decision),
        nextReviewDate: getNextReviewDate(decision),
      }
    },
    [store]
  )

  const decisionsNeedingReview = useMemo(() => {
    return store.decisions
      .filter((d) => d.status === 'pending' && isReviewDue(d))
      .sort((a, b) => {
        const aNext = getNextReviewDate(a)
        const bNext = getNextReviewDate(b)
        if (!aNext || !bNext) return 0
        return aNext.getTime() - bNext.getTime()
      })
  }, [store.decisions])

  const upcomingReviews = useMemo(() => {
    const now = new Date()
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    return store.decisions
      .filter((d) => {
        if (d.status !== 'pending') return false
        const nextReview = getNextReviewDate(d)
        if (!nextReview) return false
        return nextReview > now && nextReview <= weekFromNow
      })
      .sort((a, b) => {
        const aNext = getNextReviewDate(a)
        const bNext = getNextReviewDate(b)
        if (!aNext || !bNext) return 0
        return aNext.getTime() - bNext.getTime()
      })
  }, [store.decisions])

  return {
    decisions: store.decisions,
    filteredDecisions,
    filters: store.filters,
    isLoading: store.isLoading,
    error: store.error,
    stats,
    pendingReviews,
    decisionsNeedingReview,
    upcomingReviews,
    addDecision,
    updateDecision,
    deleteDecision,
    recordOutcome,
    setFilters,
    clearFilters,
    getDecisionById: store.getDecisionById,
    getDecisionWithMeta,
  }
}
