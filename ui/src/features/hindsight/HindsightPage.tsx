import { useState } from 'react'
import { DecisionForm } from './components/DecisionForm'
import { DecisionTimeline } from './components/DecisionTimeline'
import { CalibrationDashboard } from './components/CalibrationDashboard'
import { PatternsList } from './components/PatternsList'
import { ReviewPrompt } from './components/ReviewPrompt'
import { LessonsLearned } from './components/LessonsLearned'
import { useDecisions } from './hooks/useDecisions'
import { Target, TrendingUp, Brain, Lightbulb, Plus } from 'lucide-react'

type Tab = 'dashboard' | 'decisions' | 'patterns' | 'lessons'

export function HindsightPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [showNewDecision, setShowNewDecision] = useState(false)
  const { pendingReviews } = useDecisions()

  return (
    <div className="hindsight-page">
      <header className="hindsight-header">
        <div className="hindsight-header-content">
          <div className="hindsight-logo">
            <Target className="logo-icon" />
            <div>
              <h1>Hindsight</h1>
              <span className="tagline">Decision Intelligence</span>
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowNewDecision(true)}
          >
            <Plus size={18} />
            New Decision
          </button>
        </div>
      </header>

      <nav className="hindsight-nav">
        <button
          className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <TrendingUp size={18} />
          Dashboard
        </button>
        <button
          className={`nav-tab ${activeTab === 'decisions' ? 'active' : ''}`}
          onClick={() => setActiveTab('decisions')}
        >
          <Target size={18} />
          Decisions
          {pendingReviews.length > 0 && (
            <span className="badge">{pendingReviews.length}</span>
          )}
        </button>
        <button
          className={`nav-tab ${activeTab === 'patterns' ? 'active' : ''}`}
          onClick={() => setActiveTab('patterns')}
        >
          <Brain size={18} />
          Patterns
        </button>
        <button
          className={`nav-tab ${activeTab === 'lessons' ? 'active' : ''}`}
          onClick={() => setActiveTab('lessons')}
        >
          <Lightbulb size={18} />
          Lessons
        </button>
      </nav>

      <main className="hindsight-main">
        {pendingReviews.length > 0 && activeTab === 'dashboard' && (
          <ReviewPrompt decisions={pendingReviews} />
        )}

        {activeTab === 'dashboard' && <CalibrationDashboard />}
        {activeTab === 'decisions' && <DecisionTimeline />}
        {activeTab === 'patterns' && <PatternsList />}
        {activeTab === 'lessons' && <LessonsLearned />}
      </main>

      {showNewDecision && (
        <div className="modal-overlay" onClick={() => setShowNewDecision(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <DecisionForm onClose={() => setShowNewDecision(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
