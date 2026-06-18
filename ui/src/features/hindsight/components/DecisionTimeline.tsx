import { useState } from 'react'
import { useDecisions } from '../../hooks/useDecisions'
import { DecisionCard } from './DecisionCard'
import { OutcomeModal } from './OutcomeModal'
import type { Decision, DecisionCategory, DecisionStatus } from '../../types'
import { Filter, Search, Calendar, X } from 'lucide-react'

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

const statuses: DecisionStatus[] = ['pending', 'reviewed', 'expired', 'cancelled']

export function DecisionTimeline() {
  const { filteredDecisions, filters, setFilters, clearFilters, stats } = useDecisions()
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [reviewingDecision, setReviewingDecision] = useState<Decision | null>(null)

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setFilters({ search: query || undefined })
  }

  const toggleCategory = (category: DecisionCategory) => {
    const current = filters.categories || []
    const updated = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category]
    setFilters({ categories: updated.length ? updated : undefined })
  }

  const toggleStatus = (status: DecisionStatus) => {
    const current = filters.status || []
    const updated = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status]
    setFilters({ status: updated.length ? updated : undefined })
  }

  const hasActiveFilters =
    filters.categories?.length ||
    filters.status?.length ||
    filters.search ||
    filters.date_from ||
    filters.date_to

  const groupedDecisions = groupByMonth(filteredDecisions)

  return (
    <div className="decision-timeline">
      <div className="timeline-header">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search decisions..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <button
          className={`btn ${showFilters ? 'btn-primary' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} />
          Filters
          {hasActiveFilters && <span className="badge">!</span>}
        </button>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Categories</label>
            <div className="filter-chips">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`chip ${filters.categories?.includes(cat) ? 'active' : ''}`}
                  onClick={() => toggleCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <div className="filter-chips">
              {statuses.map((status) => (
                <button
                  key={status}
                  className={`chip ${filters.status?.includes(status) ? 'active' : ''}`}
                  onClick={() => toggleStatus(status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>Date Range</label>
            <div className="date-range">
              <input
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => setFilters({ date_from: e.target.value || undefined })}
              />
              <span>to</span>
              <input
                type="date"
                value={filters.date_to || ''}
                onChange={(e) => setFilters({ date_to: e.target.value || undefined })}
              />
            </div>
          </div>

          {hasActiveFilters && (
            <button className="btn btn-sm" onClick={clearFilters}>
              <X size={14} /> Clear All Filters
            </button>
          )}
        </div>
      )}

      <div className="timeline-stats">
        <span>
          {filteredDecisions.length} decision{filteredDecisions.length !== 1 ? 's' : ''}
        </span>
        <span className="separator">•</span>
        <span>{stats.pending_review} pending review</span>
        <span className="separator">•</span>
        <span>{stats.reviewed} reviewed</span>
      </div>

      {filteredDecisions.length === 0 ? (
        <div className="empty-state">
          <Calendar size={48} />
          <h3>No decisions found</h3>
          <p>
            {hasActiveFilters
              ? 'Try adjusting your filters'
              : 'Start by recording your first decision'}
          </p>
        </div>
      ) : (
        <div className="timeline-content">
          {Object.entries(groupedDecisions).map(([month, decisions]) => (
            <div key={month} className="timeline-month">
              <h3 className="month-header">{month}</h3>
              <div className="month-decisions">
                {decisions.map((decision) => (
                  <DecisionCard
                    key={decision.id}
                    decision={decision}
                    onReview={() => setReviewingDecision(decision)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {reviewingDecision && (
        <OutcomeModal
          decision={reviewingDecision}
          onClose={() => setReviewingDecision(null)}
        />
      )}
    </div>
  )
}

function groupByMonth(decisions: Decision[]): Record<string, Decision[]> {
  const groups: Record<string, Decision[]> = {}

  decisions.forEach((decision) => {
    const date = new Date(decision.created_at)
    const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    if (!groups[monthKey]) {
      groups[monthKey] = []
    }
    groups[monthKey].push(decision)
  })

  return groups
}
