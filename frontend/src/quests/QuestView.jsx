import { useState, useEffect } from 'react'
import { api } from '../api.js'

// Generic fallbacks so every activity gets the guided-challenge flow below
// even if its content predates these fields (see premium_quests_seed.py's
// newer entries for `choices`/`reflectionQuestion`/`reflectionTags`/`skills`
// -- older/free content simply has none of these, and that's fine).
const DEFAULT_REFLECTION_QUESTION = 'How did it go?'
const DEFAULT_REFLECTION_TAGS = ['I did it!', 'I tried my best', 'We needed more practice']

// One activity, collapsed to a single tappable row until the kid starts it --
// only one activity is ever expanded at a time (see QuestView below), so a
// 10-14 activity module reads as a short list of challenges to pick from,
// not one long wall of instructions.
function ActivityCard({
  activity, index, points, status, justSubmitted, onSubmit, previewMode, expanded, onExpand, onCollapse,
  guardianMode, kids, completions, pendingLogs, awarding, onAward, onApproveLog, onRejectLog, onRedo,
}) {
  const [selectedChoice, setSelectedChoice] = useState(null)
  const [selectedTags, setSelectedTags] = useState([])
  const [note, setNote] = useState('')
  const [showExample, setShowExample] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isApproved = status?.kind === 'approved'
  const isPending = justSubmitted || status?.kind === 'pending'
  const isRejected = !justSubmitted && status?.kind === 'rejected'
  const choices = activity.choices || []
  const reflectionTags = activity.reflectionTags?.length ? activity.reflectionTags : DEFAULT_REFLECTION_TAGS
  const canSubmit = (choices.length === 0 || selectedChoice) && (selectedTags.length > 0 || note.trim().length > 0)

  const doneKidIds = new Set((completions || []).map(c => c.kidId))
  const pendingKidIds = new Set((pendingLogs || []).map(p => p.kidId))
  const totalKids = kids?.length || 0
  const doneCount = doneKidIds.size
  const pendingCount = pendingKidIds.size

  function toggleTag(tag) {
    setSelectedTags(tags => tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag])
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    try {
      await onSubmit({ selectedChoice, reflectionTags: selectedTags, note: note.trim() })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const statusBadge = isApproved ? '✅' : isPending ? '⏳' : isRejected ? '🔄' : null

  if (!expanded) {
    if (guardianMode) {
      const allDone = totalKids > 0 && doneCount === totalKids
      const rowBadge = allDone ? '✅' : pendingCount > 0 ? '⏳' : doneCount > 0 ? '🔸' : null
      const rowLabel = allDone ? 'All done' : pendingCount > 0 ? `${pendingCount} to review` : doneCount > 0 ? `${doneCount}/${totalKids} done` : 'Manage →'
      const rowBg = allDone ? '#f0fdf4' : pendingCount > 0 ? '#fffbeb' : '#fff'
      const rowBorder = allDone ? '#bbf7d0' : pendingCount > 0 ? '#fde68a' : '#f1f5f9'
      const rowColor = allDone ? '#166534' : pendingCount > 0 ? '#92400e' : '#0d9488'
      return (
        <button
          onClick={onExpand}
          className="pop-in"
          style={{
            display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
            background: rowBg, border: `1px solid ${rowBorder}`, borderRadius: 14, padding: '12px 14px', cursor: 'pointer',
            animationDelay: `${index * 0.05}s`, animationFillMode: 'backwards',
          }}
        >
          <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{activity.emoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#1e293b', fontSize: '0.92rem' }}>
              {rowBadge && <span>{rowBadge}</span>}
              {activity.title}
            </div>
            <div style={{ fontSize: '0.76rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activity.description}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>
              {activity.duration && <>⏱ {activity.duration} · </>}⭐ {points} pts
            </div>
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: rowColor, flexShrink: 0 }}>{rowLabel}</span>
        </button>
      )
    }
    return (
      <button
        onClick={onExpand}
        className="pop-in"
        style={{
          display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
          background: isApproved ? '#f0fdf4' : isPending ? '#fffbeb' : '#fff',
          border: `1px solid ${isApproved ? '#bbf7d0' : isPending ? '#fde68a' : '#f1f5f9'}`,
          borderRadius: 14, padding: '12px 14px', cursor: 'pointer',
          animationDelay: `${index * 0.05}s`, animationFillMode: 'backwards',
        }}
      >
        <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{activity.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#1e293b', fontSize: '0.92rem' }}>
            {statusBadge && <span>{statusBadge}</span>}
            {activity.title}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activity.description}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>
            {activity.duration && <>⏱ {activity.duration} · </>}⭐ {points} pts
          </div>
        </div>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isApproved ? '#166534' : isPending ? '#92400e' : '#0d9488', flexShrink: 0 }}>
          {isApproved ? 'Done' : isPending ? 'Pending' : 'Start →'}
        </span>
      </button>
    )
  }

  return (
    <div
      className="pop-in"
      style={{ background: '#fff', border: '1px solid #99f6e4', borderRadius: 16, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
    >
      <button onClick={onCollapse} style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', padding: 0, marginBottom: 10 }}>
        ← Back to list
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: '1.5rem' }}>{activity.emoji}</span>
        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1e293b' }}>{activity.title}</span>
      </div>
      <div style={{ fontSize: '0.88rem', color: '#475569', marginBottom: 8 }}>{activity.description}</div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
          {activity.duration && <>⏱ {activity.duration} · </>}⭐ {points} points
        </div>
        {(activity.materials || []).length > 0 && (
          <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: 2 }}>
            🧰 You'll need: {activity.materials.join(', ')}
          </div>
        )}
      </div>

      {choices.length > 0 && (guardianMode || (!isApproved && !isPending)) && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: 8 }}>
            {guardianMode ? 'Mission choices:' : 'Choose your mission:'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {choices.map(c => guardianMode ? (
              <span
                key={c.label}
                style={{
                  fontSize: '0.85rem', fontWeight: 600, borderRadius: 999, padding: '8px 14px',
                  border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569',
                }}
              >
                {c.emoji} {c.label}
              </span>
            ) : (
              <button
                key={c.label}
                type="button"
                onClick={() => setSelectedChoice(c.label)}
                style={{
                  fontSize: '0.85rem', fontWeight: 600, borderRadius: 999, padding: '8px 14px',
                  border: `1.5px solid ${selectedChoice === c.label ? '#0d9488' : '#e2e8f0'}`,
                  background: selectedChoice === c.label ? '#f0fdfa' : '#fff',
                  color: selectedChoice === c.label ? '#0f766e' : '#475569', cursor: 'pointer',
                }}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {(activity.steps || []).length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>Your steps:</div>
          <ol style={{ margin: 0, paddingLeft: 20, fontSize: '0.85rem', color: '#334155', lineHeight: 1.6 }}>
            {activity.steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </div>
      )}

      {activity.example && (
        <div style={{ marginBottom: 14 }}>
          <button
            type="button"
            onClick={() => setShowExample(v => !v)}
            style={{ background: 'none', border: 'none', color: '#b45309', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', padding: 0 }}
          >
            💡 Need an idea? {showExample ? '▲' : '▼'}
          </button>
          {showExample && (
            <div style={{ marginTop: 8, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '8px 12px', fontSize: '0.82rem', color: '#78350f', lineHeight: 1.5 }}>
              {activity.example}
            </div>
          )}
        </div>
      )}

      {guardianMode ? (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed #e2e8f0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(kids || []).map(kid => {
              const completion = (completions || []).find(c => c.kidId === kid.id)
              const pending = (pendingLogs || []).find(p => p.kidId === kid.id)
              if (completion) {
                return (
                  <div key={kid.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '8px 12px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#166534' }}>
                      ✅ {kid.avatar} {kid.name} — earned {completion.pointsAwarded ?? points} pts
                    </span>
                    <button
                      type="button"
                      title={`Let ${kid.name} try this again`}
                      disabled={awarding}
                      onClick={() => onRedo(kid.id, completion)}
                      style={{ background: 'none', border: 'none', cursor: awarding ? 'default' : 'pointer', fontSize: '0.95rem', color: '#166534', padding: '2px 4px' }}
                    >
                      ↺
                    </button>
                  </div>
                )
              }
              if (pending) {
                return (
                  <div key={kid.id} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#92400e', marginBottom: 4 }}>⏳ {kid.avatar} {kid.name} says:</div>
                    <div style={{ fontSize: '0.85rem', color: '#78350f', fontStyle: 'italic', whiteSpace: 'pre-line', marginBottom: 8 }}>{pending.note}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" disabled={awarding} onClick={() => onApproveLog(pending)} className="btn btn-sm" style={{ background: '#16a34a', color: '#fff', border: 'none' }}>
                        ✅ Approve
                      </button>
                      <button type="button" disabled={awarding} onClick={() => onRejectLog(pending)} className="btn btn-sm btn-outline">
                        Try again
                      </button>
                    </div>
                  </div>
                )
              }
              return (
                <div key={kid.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#475569' }}>{kid.avatar} {kid.name} hasn't tried this yet</span>
                  <button
                    type="button"
                    disabled={awarding}
                    onClick={() => onAward(kid.id)}
                    className="btn btn-sm"
                    style={{ background: '#0d9488', color: '#fff', border: 'none' }}
                  >
                    🎁 Give {points} pts
                  </button>
                </div>
              )
            })}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: 10 }}>
            💡 Or let {totalKids === 1 ? 'them' : 'a kid'} log it themselves from their own Quests tab — it'll show up here to approve.
          </div>
        </div>
      ) : !previewMode && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed #e2e8f0' }}>
          {isApproved ? (
            <div className="result-celebration" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
              <div className="mega-confetti" aria-hidden="true">
                {['🎉', '✨', '⭐', '🎊', '🎈', '🌟', '💫', '🏆'].map((p, i) => (
                  <span key={i} className={`confetti-piece mc-${i}`}>{p}</span>
                ))}
              </div>
              <div style={{ color: '#166534', fontWeight: 700, fontSize: '0.9rem' }}>
                ✅ Approved! You earned {status.points ?? points} pts.
              </div>
              {activity.skills?.length > 0 && (
                <div style={{ fontSize: '0.78rem', color: '#15803d', marginTop: 6 }}>
                  Skills practiced: {activity.skills.join(' · ')}
                </div>
              )}
            </div>
          ) : isPending ? (
            <div className="pop-in" style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 14px', textAlign: 'center', color: '#92400e', fontWeight: 700, fontSize: '0.88rem' }}>
              ⏳ Sent to your parent — waiting for approval.
            </div>
          ) : (
            <div>
              {isRejected && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '8px 12px', marginBottom: 10, color: '#991b1b', fontSize: '0.82rem' }}>
                  Your parent asked you to try this one again before it counts.
                </div>
              )}
              {error && <div className="error-msg" style={{ marginBottom: 10, fontSize: '0.82rem' }}>{error}</div>}

              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                {activity.reflectionQuestion || DEFAULT_REFLECTION_QUESTION}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                {reflectionTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    style={{
                      fontSize: '0.8rem', fontWeight: 600, borderRadius: 999, padding: '6px 12px',
                      border: `1.5px solid ${selectedTags.includes(tag) ? '#0d9488' : '#e2e8f0'}`,
                      background: selectedTags.includes(tag) ? '#f0fdfa' : '#fff',
                      color: selectedTags.includes(tag) ? '#0f766e' : '#475569', cursor: 'pointer',
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Tell us one thing you did (optional)"
                rows={2}
                style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical', marginBottom: 10 }}
              />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !canSubmit}
                className="btn btn-primary"
                style={{ width: '100%', opacity: canSubmit ? 1 : 0.6 }}
              >
                {submitting ? 'Sending…' : `Send to parent · +${points} pts after approval`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function QuestView({
  module, onExit, onLogSubmitted, previewMode,
  guardianMode, kids, onAward, onApproveLog, onRejectLog, onRedo,
}) {
  const [content, setContent] = useState(null)
  const [error, setError] = useState('')
  const [justSubmittedIndices, setJustSubmittedIndices] = useState([])
  const [expandedIndex, setExpandedIndex] = useState(null)
  const [awardingIndex, setAwardingIndex] = useState(null)

  useEffect(() => {
    let cancelled = false
    api.getQuestContent(module.id)
      .then(data => { if (!cancelled) setContent(data) })
      .catch(err => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [module.id])

  async function handleActivitySubmit(activityIndex, { selectedChoice, reflectionTags, note }) {
    const parts = []
    if (selectedChoice) parts.push(`Mission: ${selectedChoice}`)
    if (reflectionTags?.length) parts.push(`Tags: ${reflectionTags.join(', ')}`)
    if (note) parts.push(note)
    await api.submitQuestLog(module.id, parts.join('\n') || 'Done!', activityIndex)
    setJustSubmittedIndices(list => [...list, activityIndex])
    setExpandedIndex(null)
    onLogSubmitted && onLogSubmitted()
  }

  async function withAwarding(activityIndex, action) {
    setAwardingIndex(activityIndex)
    setError('')
    try {
      await action()
    } catch (err) {
      setError(err.message)
    } finally {
      setAwardingIndex(null)
    }
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
        <>
          {!guardianMode && (() => {
            const total = (content.activities || []).length
            const done = (module.completedActivityIndices || []).length
            if (total === 0) return null
            const allDone = done === total
            return (
              <div style={{ marginBottom: 16 }}>
                {allDone ? (
                  <div className="pop-in" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, color: '#166534', fontSize: '0.95rem' }}>🏆 Mission Complete!</div>
                    <div style={{ fontSize: '0.78rem', color: '#15803d', marginTop: 2 }}>You finished every challenge in {module.categoryTitle} · {module.title}</div>
                  </div>
                ) : (
                  <>
                    <div style={{ height: 8, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(done / total) * 100}%`, background: '#0d9488', borderRadius: 999, transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 4 }}>{done}/{total} challenges done</div>
                  </>
                )}
              </div>
            )
          })()}
          {guardianMode && (
            <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 10, padding: '8px 14px', marginBottom: 16, color: '#0f766e', fontSize: '0.8rem' }}>
              Tap a challenge to give points directly, approve what a kid sent in, or let them know to try it.
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(content.activities || []).map((activity, i) => (
            <ActivityCard
              key={i}
              activity={activity}
              index={i}
              points={(module.activityPoints || [])[i] ?? module.points}
              status={statusFor(i)}
              justSubmitted={justSubmittedIndices.includes(i)}
              onSubmit={response => handleActivitySubmit(i, response)}
              previewMode={previewMode}
              expanded={expandedIndex === i}
              onExpand={() => setExpandedIndex(i)}
              onCollapse={() => setExpandedIndex(null)}
              guardianMode={guardianMode}
              kids={kids}
              completions={(module.activityCompletions || [])[i] || []}
              pendingLogs={(module.activityPendingLogs || [])[i] || []}
              awarding={awardingIndex === i}
              onAward={kidId => withAwarding(i, () => onAward(i, kidId))}
              onApproveLog={log => withAwarding(i, () => onApproveLog(log))}
              onRejectLog={log => withAwarding(i, () => onRejectLog(log))}
              onRedo={(kidId, completion) => withAwarding(i, () => onRedo(i, kidId, completion))}
            />
          ))}
          </div>
        </>
      )}
    </div>
  )
}
