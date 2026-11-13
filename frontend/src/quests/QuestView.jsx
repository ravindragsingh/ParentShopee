import { useState, useEffect } from 'react'
import { api } from '../api.js'

// Each activity inside a quest module (e.g. "Cognitive Development, Ages
// 4-6" bundles several hands-on ideas) is independently loggable and earns
// its own points -- a kid doesn't have to work through the whole category
// in one sitting to earn anything. `status`/`points`/`onSubmit` carry that
// one activity's own state; nothing here is shared across activities.
function ActivityCard({ activity, index, points, status, justSubmitted, onSubmit, previewMode }) {
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isApproved = status?.kind === 'approved'
  const isPending = justSubmitted || status?.kind === 'pending'
  const isRejected = !justSubmitted && status?.kind === 'rejected'

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await onSubmit(note)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="pop-in"
      style={{
        background: '#fff', border: '1px solid #f1f5f9', borderRadius: 16,
        padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        animationDelay: `${index * 0.08}s`, animationFillMode: 'backwards',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.5rem' }}>{activity.emoji}</span>
          <span style={{ fontWeight: 800, fontSize: '1.02rem', color: '#1e293b' }}>{activity.title}</span>
        </div>
        {isApproved && (
          <span style={{ fontSize: '0.74rem', fontWeight: 700, borderRadius: 999, padding: '3px 10px', background: '#dcfce7', color: '#166534', flexShrink: 0 }}>
            ✅ Done
          </span>
        )}
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
      {activity.example && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 12,
          background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '8px 12px',
        }}>
          <span style={{ fontSize: '0.95rem', flexShrink: 0 }}>💡</span>
          <span style={{ fontSize: '0.82rem', color: '#78350f', lineHeight: 1.5 }}>
            <strong>Example:</strong> {activity.example}
          </span>
        </div>
      )}

      {!previewMode && (
        <div style={{ marginTop: 14 }}>
          {isApproved ? (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '8px 12px', textAlign: 'center', color: '#166534', fontWeight: 700, fontSize: '0.85rem' }}>
              You earned {status.points ?? points} pts for this!
            </div>
          ) : isPending ? (
            <div className="pop-in" style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '8px 12px', textAlign: 'center', color: '#92400e', fontWeight: 700, fontSize: '0.85rem' }}>
              ⏳ Sent to your guardian — you'll get your {points} pts once they take a look.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {isRejected && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 10px', marginBottom: 8, color: '#991b1b', fontSize: '0.8rem' }}>
                  Your guardian asked you to try this one again before it counts.
                </div>
              )}
              {error && <div className="error-msg" style={{ marginBottom: 8, fontSize: '0.8rem' }}>{error}</div>}
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="What did you do or notice?"
                rows={2}
                style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }}
              />
              <button
                type="submit"
                disabled={submitting || note.trim().length < 3}
                className="btn btn-sm btn-primary"
                style={{ marginTop: 8 }}
              >
                {submitting ? 'Sending…' : `Log this · earn ${points} pts`}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

export default function QuestView({ module, onExit, onLogSubmitted, previewMode }) {
  const [content, setContent] = useState(null)
  const [error, setError] = useState('')
  const [justSubmittedIndices, setJustSubmittedIndices] = useState([])

  useEffect(() => {
    let cancelled = false
    api.getQuestContent(module.id)
      .then(data => { if (!cancelled) setContent(data) })
      .catch(err => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [module.id])

  async function handleActivitySubmit(activityIndex, note) {
    await api.submitQuestLog(module.id, note, activityIndex)
    setJustSubmittedIndices(list => [...list, activityIndex])
    onLogSubmitted && onLogSubmitted()
  }

  function statusFor(activityIndex) {
    if ((module.completedActivityIndices || []).includes(activityIndex)) return { kind: 'approved' }
    const log = (module.pendingActivityLogs || [])[activityIndex]
    if (log?.status === 'pending') return { kind: 'pending' }
    if (log?.status === 'rejected') return { kind: 'rejected' }
    return null
  }

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
          {(content.activities || []).map((activity, i) => (
            <ActivityCard
              key={i}
              activity={activity}
              index={i}
              points={(module.activityPoints || [])[i] ?? module.points}
              status={statusFor(i)}
              justSubmitted={justSubmittedIndices.includes(i)}
              onSubmit={note => handleActivitySubmit(i, note)}
              previewMode={previewMode}
            />
          ))}
        </div>
      )}
    </div>
  )
}
