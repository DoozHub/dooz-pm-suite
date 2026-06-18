import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Decision,
  DecisionFilters,
  DecisionStats,
  DecisionStatus,
  DecisionCategory,
  ActualOutcome,
} from '../types'

interface DecisionsState {
  decisions: Decision[]
  filters: DecisionFilters
  isLoading: boolean
  error: string | null

  addDecision: (decision: Decision) => void
  updateDecision: (id: string, updates: Partial<Decision>) => void
  deleteDecision: (id: string) => void
  recordOutcome: (id: string, outcome: ActualOutcome) => void
  setFilters: (filters: DecisionFilters) => void
  clearFilters: () => void
  getDecisionById: (id: string) => Decision | undefined
  getFilteredDecisions: () => Decision[]
  getPendingReviews: () => Decision[]
  getStats: () => DecisionStats
  setDecisions: (decisions: Decision[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

const initialFilters: DecisionFilters = {}

export const useDecisionsStore = create<DecisionsState>()(
  persist(
    (set, get) => ({
      decisions: [],
      filters: initialFilters,
      isLoading: false,
      error: null,

      addDecision: (decision) => {
        set((state) => ({
          decisions: [decision, ...state.decisions],
        }))
      },

      updateDecision: (id, updates) => {
        set((state) => ({
          decisions: state.decisions.map((d) =>
            d.id === id ? { ...d, ...updates, updated_at: new Date().toISOString() } : d
          ),
        }))
      },

      deleteDecision: (id) => {
        set((state) => ({
          decisions: state.decisions.filter((d) => d.id !== id),
        }))
      },

      recordOutcome: (id, outcome) => {
        set((state) => ({
          decisions: state.decisions.map((d) =>
            d.id === id
              ? {
                  ...d,
                  actual_outcome: outcome,
                  status: 'reviewed' as DecisionStatus,
                  updated_at: new Date().toISOString(),
                  review_dates: d.review_dates.map((rd) => ({
                    ...rd,
                    completed: true,
                    completed_at: new Date().toISOString(),
                  })),
                }
              : d
          ),
        }))
      },

      setFilters: (filters) => {
        set({ filters: { ...get().filters, ...filters } })
      },

      clearFilters: () => {
        set({ filters: initialFilters })
      },

      getDecisionById: (id) => {
        return get().decisions.find((d) => d.id === id)
      },

      getFilteredDecisions: () => {
        const { decisions, filters } = get()
        let filtered = [...decisions]

        if (filters.categories?.length) {
          filtered = filtered.filter((d) => filters.categories!.includes(d.category))
        }

        if (filters.status?.length) {
          filtered = filtered.filter((d) => filters.status!.includes(d.status))
        }

        if (filters.importance?.length) {
          filtered = filtered.filter((d) => filters.importance!.includes(d.importance))
        }

        if (filters.date_from) {
          filtered = filtered.filter((d) => d.created_at >= filters.date_from!)
        }

        if (filters.date_to) {
          filtered = filtered.filter((d) => d.created_at <= filters.date_to!)
        }

        if (filters.search) {
          const search = filters.search.toLowerCase()
          filtered = filtered.filter(
            (d) =>
              d.what.toLowerCase().includes(search) ||
              d.why.toLowerCase().includes(search) ||
              d.tags.some((t) => t.toLowerCase().includes(search))
          )
        }

        if (filters.tags?.length) {
          filtered = filtered.filter((d) =>
            filters.tags!.some((tag) => d.tags.includes(tag))
          )
        }

        return filtered.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      },

      getPendingReviews: () => {
        const { decisions } = get()
        const now = new Date()

        return decisions.filter((d) => {
          if (d.status !== 'pending') return false

          return d.review_dates.some((rd) => {
            if (rd.completed) return false
            const reviewDate = new Date(rd.date)
            return reviewDate <= now
          })
        })
      },

      getStats: (): DecisionStats => {
        const { decisions } = get()
        const now = new Date()
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

        const byCategory = {} as Record<DecisionCategory, number>
        const byStatus = {} as Record<DecisionStatus, number>

        decisions.forEach((d) => {
          byCategory[d.category] = (byCategory[d.category] || 0) + 1
          byStatus[d.status] = (byStatus[d.status] || 0) + 1
        })

        return {
          total: decisions.length,
          pending_review: decisions.filter((d) => d.status === 'pending').length,
          reviewed: decisions.filter((d) => d.status === 'reviewed').length,
          by_category: byCategory,
          by_status: byStatus,
          this_month: decisions.filter((d) => new Date(d.created_at) >= monthAgo).length,
          this_week: decisions.filter((d) => new Date(d.created_at) >= weekAgo).length,
        }
      },

      setDecisions: (decisions) => {
        set({ decisions })
      },

      setLoading: (isLoading) => {
        set({ isLoading })
      },

      setError: (error) => {
        set({ error })
      },
    }),
    {
      name: 'hindsight-decisions',
    }
  )
)
