import { useState, useEffect } from 'react'
import { api } from '../api.js'

// Shows the small set of hands-on ideas inside one activity module -- used
// both for a kid's own view (with a note-and-submit log, reviewed by a
// guardian before points pay out) and a guardian's preview (read-only, via
// `previewMode`). No slides/quiz to paginate through like Future-Ready's
// LessonModule, so this is just a single scrollable list.
function ActivityCard({ activity }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #f1f5f9', borderRadius: 16,
      padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: '1.5rem' }}>{activity.emoji}</span>
        <span style={{ fontWeight: 800, fontSize: '1.02rem', color: '#1e293b' }}>{activity.title}</span>
      </div>
      <div style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.5, marginBottom: 10 }}>{activity.description}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        {activity.duration && (
          <span style={{ fontSize: '0.74rem', fontWeight: 700, borderRadius: 999, padding: '3px 10px', background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}>
            ⏱️ {activity.duration}
          </span>
        )}
        {(activity.materials || []).map((m, i) => (
          <span key={i} style={{ fontSize: '0.74rem', fontWeight: 600, borderRadius: 999, padding: '3px 10px', background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}>
            🧰 {m}
          </span>
        ))}
      </div>
      {(activity.steps || []).length > 0 && (
        <ol style={{ margin: 0, paddingLeft: 20, fontSize: '0.85rem', color: '#334155', lineHeight: 1.6 }}>
          {activity.steps.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      )}
    </div>
  )
}

export default function ActivitySetView({ module, onExit, onLogSubmitted, previewMode }) {
  const [content, setContent] = useState(null)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [justSubmitted, setJustSubmitted] = useState(false)

  useEffect(() => {
    let cancelled = false
    api.getActivityContent(module.id)
      .then(data => { if (!cancelled) setContent(data) })
      .catch(err => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [module.id])

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await api.submitActivityLog(module.id, note)
      setJustSubmitted(true)
      onLogSubmitted && onLogSubmitted()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const pendingLog = module.pendingLog
  const isPending = (justSubmitted || pendingLog?.status === 'pending')
  const isRejected = !justSubmitted && pendingLog?.status === 'rejected'

  return (
    <div>
      <button onClick={onExit} style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', marginBottom: 14, padding: 0 }}>
        ← Back
      </button>
      <h3 style={{ color: '#334155', margin: '0 0 4px' }}>{module.categoryTitle}</h3>
      <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 16 }}>{module.title}</div>

      {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}

      {!content ? (
        <div className="loading-text">Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {(content.activities || []).map((activity, i) => <ActivityCard key={i} activity={activity} />)}
        </div>
      )}

      {!previewMode && content && (
        <div style={{ marginTop: 20 }}>
          {module.completed ? (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '14px 16px', textAlign: 'center', color: '#166534', fontWeight: 700, fontSize: '0.9rem' }}>
              ✅ Done — your guardian approved this and you earned {module.points} pts!
            </div>
          ) : isPending ? (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '14px 16px', textAlign: 'center', color: '#92400e', fontWeight: 700, fontSize: '0.9rem' }}>
              ⏳ Sent to your guardian — you'll get your {module.points} pts once they take a look.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {isRejected && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', marginBottom: 12, color: '#991b1b', fontSize: '0.85rem' }}>
                  Your guardian asked you to try this again before it counts — give it another go, then log it below.
                </div>
              )}
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                What did you do or notice?
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Tell your guardian a bit about it..."
                rows={3}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.88rem', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }}
              />
              <button
                type="submit"
                disabled={submitting || note.trim().length < 3}
                className="login-btn"
                style={{ marginTop: 10 }}
              >
                {submitting ? 'Sending…' : `Send to my guardian · earn ${module.points} pts`}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
