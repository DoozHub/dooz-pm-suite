import { useCalibration } from '../../hooks/useCalibration'
import { Lightbulb, BookOpen, Sparkles, ArrowRight } from 'lucide-react'

export function LessonsLearned() {
  const { lessons, hasEnoughData, patterns } = useCalibration()

  if (!hasEnoughData) {
    return (
      <div className="lessons-learned">
        <div className="empty-lessons">
          <Lightbulb size={64} />
          <h2>Lessons Coming Soon</h2>
          <p>
            As you record and review more decisions, we'll generate personalized
            lessons based on your patterns and outcomes.
          </p>
          <div className="coming-soon-list">
            <div className="coming-soon-item">
              <Sparkles size={20} />
              <span>Personalized recommendations</span>
            </div>
            <div className="coming-soon-item">
              <BookOpen size={20} />
              <span>Decision playbooks</span>
            </div>
            <div className="coming-soon-item">
              <ArrowRight size={20} />
              <span>Actionable insights</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (lessons.length === 0) {
    return (
      <div className="lessons-learned">
        <div className="empty-lessons">
          <Lightbulb size={64} />
          <h2>No Lessons Generated Yet</h2>
          <p>
            Continue reviewing decisions and we'll identify patterns that lead to
            actionable lessons.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="lessons-learned">
      <div className="lessons-header">
        <h2>Lessons Learned</h2>
        <p>
          AI-generated insights based on your decision patterns and outcomes
        </p>
      </div>

      <div className="lessons-grid">
        {lessons.map((lesson) => (
          <div key={lesson.id} className="lesson-card">
            <div className="lesson-icon">
              <Lightbulb size={24} />
            </div>

            <div className="lesson-content">
              <h3>{lesson.title}</h3>

              {lesson.category && (
                <span className="category-badge" data-category={lesson.category}>
                  {lesson.category}
                </span>
              )}

              <div className="lesson-insight">
                <h4>Insight</h4>
                <p>{lesson.insight}</p>
              </div>

              <div className="lesson-action">
                <h4>What to Do</h4>
                <p>{lesson.actionable_advice}</p>
              </div>

              {lesson.source_decisions.length > 0 && (
                <div className="lesson-sources">
                  <h4>Based on</h4>
                  <ul>
                    {lesson.source_decisions.slice(0, 3).map((decision, i) => (
                      <li key={i}>{decision}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="lessons-footer">
        <div className="footer-card">
          <BookOpen size={32} />
          <div>
            <h3>Building Your Decision Playbook</h3>
            <p>
              Every lesson here is derived from your actual decisions and outcomes.
              Over time, this becomes your personalized guide to better decision-making.
            </p>
          </div>
        </div>
      </div>

      {patterns.length > 0 && (
        <div className="pattern-summary">
          <h3>Patterns Informing These Lessons</h3>
          <div className="pattern-tags">
            {patterns.map((pattern) => (
              <span
                key={pattern.id}
                className="pattern-tag"
                data-impact={pattern.impact}
              >
                {pattern.type.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
