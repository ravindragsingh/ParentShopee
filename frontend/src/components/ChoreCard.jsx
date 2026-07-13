import { useState } from 'react'
import { api } from '../api.js'

// ── Emoji sets ────────────────────────────────────────────────────────────────

export const CHORE_EMOJIS = [
  // Household
  '📋','🧹','🍽️','🛁','🛏️','🌿','🧺','🚽','🍳','🧼',
  '🗑️','🪣','🧽','🪟','🥄','🚿','🛒','🪴','🏡','🌺',
  // Music & arts
  '🎹','🎸','🎤','🎵','🎶','🎻','🥁','🎺','🎷','🎼',
  '🎨','🖌️','📝','🎭','🎬',
  // Study & learning
  '📚','📖','🔬','🔭','📐','📏','🖊️','📓','🧮','💡',
  // Sport & activity
  '⚽','🏃','🏊','🚴','🧘','🏋️','🤸','🏸','🎾','⛹️',
  // Other
  '💻','🎒','🌊','🚗','🐕','🧸','♻️','✏️','👕','🛍️',
]

export const KID_AVATARS = [
  '🐶','🐱','🦊','🐻','🐼','🦁','🦄','🐸','🐙','🦋',
  '🦕','🐣','🦜','🐯','🐰','🐹','🦝','🐨','🦉','🐲',
  '🐬','🦈','🐧','🦩','🦚','🐺','🦘','🐊','🦒','🦓',
]

// ── Shared emoji picker ───────────────────────────────────────────────────────

export function EmojiPicker({ emojis, value, onChange }) {
  return (
    <div className="emoji-picker">
      {emojis.map(e => (
        <button
          key={e}
          type="button"
          className={`emoji-option${value === e ? ' selected' : ''}`}
          onClick={() => onChange(e)}
        >
          {e}
        </button>
      ))}
    </div>
  )
}

// ── Due date helpers ──────────────────────────────────────────────────────────

function formatDueDate(dueDate) {
  if (!dueDate) return null
  const d = new Date(dueDate + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function DueDateBadge({ dueDate, status }) {
  if (!dueDate) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate + 'T00:00:00')
  const diff = Math.floor((due - today) / 86400000)

  let cls = 'due-date'
  let label = `Due ${formatDueDate(dueDate)}`
  if (status === 'expired') {
    cls = 'due-date overdue'
    label = `Expired ${formatDueDate(dueDate)}`
  } else if (diff < 0) {
    cls = 'due-date overdue'; label = `Overdue — ${formatDueDate(dueDate)}`
  } else if (diff === 0) {
    cls = 'due-date urgent'; label = 'Due today!'
  } else if (diff === 1) {
    cls = 'due-date urgent'; label = 'Due tomorrow'
  }

  return <span className={cls}>{label}</span>
}

// ── Parent chore card ─────────────────────────────────────────────────────────

export function ParentChoreCard({ chore, kids, onRefresh, variant = 'card', editMode = false }) {
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(chore.title)
  const [editDesc, setEditDesc] = useState(chore.description || '')
  const [editPoints, setEditPoints] = useState(chore.points)
  const [editKid, setEditKid] = useState(chore.assignedKidId || '')
  const [editDueDate, setEditDueDate] = useState(chore.dueDate || '')
  const [editEmoji, setEditEmoji] = useState(chore.imageEmoji || '📋')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')

  const assignedKid = chore.assignedKidId ? kids.find(k => k.id === chore.assignedKidId) : null
  const assignedKidName = assignedKid?.name || 'Any'

  const completedByKid = chore.completedByKidId ? kids.find(k => k.id === chore.completedByKidId) : null
  const completedByName = completedByKid?.name || 'Unknown'

  async function handleSave() {
    if (!editTitle.trim()) return
    setSaving(true); setError('')
    try {
      await api.updateChore(chore.id, {
        title: editTitle.trim(),
        description: editDesc.trim(),
        points: Number(editPoints),
        assignedKidId: editKid || null,
        dueDate: editDueDate || '',
        imageEmoji: editEmoji,
      })
      setEditing(false)
      onRefresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete chore "${chore.title}"?`)) return
    setActionLoading(true)
    try { await api.deleteChore(chore.id); onRefresh() }
    catch (err) { setError(err.message) }
    finally { setActionLoading(false) }
  }

  async function handleApprove() {
    setActionLoading(true); setError('')
    try { await api.approveChore(chore.id); onRefresh() }
    catch (err) { setError(err.message) }
    finally { setActionLoading(false) }
  }

  async function handleReject() {
    setActionLoading(true); setError('')
    try { await api.rejectChore(chore.id); onRefresh() }
    catch (err) { setError(err.message) }
    finally { setActionLoading(false) }
  }

  async function handleSaveInline() {
    const trimmedTitle = editTitle.trim()
    if (!trimmedTitle) { setEditTitle(chore.title); return }
    const pts = Number(editPoints)
    if (trimmedTitle === chore.title && pts === chore.points) return  // nothing changed
    setSaving(true); setError('')
    try {
      await api.updateChore(chore.id, { title: trimmedTitle, points: pts })
      onRefresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleRepeat() {
    setActionLoading(true); setError('')
    try {
      await api.createChore({
        title: chore.title,
        description: chore.description || '',
        points: chore.points,
        imageEmoji: chore.imageEmoji || '📋',
        assignedKidId: chore.assignedKidId || null,
        dueDate: null,
      })
      onRefresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (variant === 'row') {
    const showInlineEdit = editMode && chore.status === 'open'
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: `1px solid ${chore.status === 'pending' ? '#fed7aa' : '#e2e8f0'}`, borderRadius: 10, padding: '10px 14px' }}>
        {chore.status === 'pending' ? (
          <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>⏳</span>
        ) : (
          <input
            type="checkbox"
            checked={chore.status === 'complete'}
            disabled
            title="Kids mark chores complete from their own dashboard"
            style={{ width: 20, height: 20, flexShrink: 0 }}
          />
        )}
        <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{chore.imageEmoji || '📋'}</span>

        <div style={{ flex: 1, minWidth: 0 }}>
          {showInlineEdit ? (
            <input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onBlur={handleSaveInline}
              disabled={saving}
              style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.85rem', width: '100%', maxWidth: 280, boxSizing: 'border-box' }}
            />
          ) : (
            <span style={{ fontWeight: 600, color: '#1e293b' }}>{chore.title}</span>
          )}
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2, alignItems: 'center' }}>
            <DueDateBadge dueDate={chore.dueDate} status={chore.status} />
            {chore.status === 'open' && <>{assignedKid?.avatar && <span>{assignedKid.avatar}</span>}Assigned: {assignedKidName}</>}
            {chore.status === 'pending' && <>{completedByKid?.avatar && <span>{completedByKid.avatar}</span>}Completed by: {completedByName}</>}
            {chore.templateId && <span style={{ fontSize: '0.72rem', background: '#ccfbf1', color: '#0d9488', borderRadius: 6, padding: '1px 7px', fontWeight: 700 }}>🔁 Recurring</span>}
          </div>
          {error && <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: 2 }}>{error}</div>}
        </div>

        {chore.status === 'pending' ? (
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button className="btn btn-green btn-sm" onClick={handleApprove} disabled={actionLoading}>✓ Approve</button>
            <button className="btn btn-red btn-sm" onClick={handleReject} disabled={actionLoading}>✕ Reject</button>
          </div>
        ) : showInlineEdit ? (
          <input
            type="number" min="0" value={editPoints}
            onChange={e => setEditPoints(e.target.value)}
            onBlur={handleSaveInline}
            disabled={saving}
            style={{ width: 60, padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.85rem' }}
          />
        ) : (
          <span className="points-badge">{chore.points} pts</span>
        )}
      </div>
    )
  }

  return (
    <div className={`chore-card ${chore.status}`}>
      {/* Chore emoji icon */}
      {!editing && (
        <div className="chore-emoji">{chore.imageEmoji || '📋'}</div>
      )}

      <div className="chore-info">
        {editing ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <button
                type="button"
                className="chore-emoji-btn"
                title="Change chore image"
                onClick={() => setShowEmojiPicker(v => !v)}
              >
                {editEmoji}
              </button>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {showEmojiPicker ? 'Pick an image' : 'Click to change image'}
              </span>
            </div>
            {showEmojiPicker && (
              <div style={{ marginBottom: 8 }}>
                <EmojiPicker emojis={CHORE_EMOJIS} value={editEmoji} onChange={e => { setEditEmoji(e); setShowEmojiPicker(false) }} />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
              <input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                placeholder="Title"
                style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="number"
                  value={editPoints}
                  onChange={e => setEditPoints(e.target.value)}
                  placeholder="Points"
                  style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.85rem', width: '80px' }}
                />
                <select
                  value={editKid}
                  onChange={e => setEditKid(e.target.value)}
                  style={{ flex: 1, padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.82rem' }}
                >
                  <option value="">Any kid</option>
                  {kids.map(k => (
                    <option key={k.id} value={k.id}>{k.avatar} {k.name}</option>
                  ))}
                </select>
              </div>
              <input
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                placeholder="Description"
                style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' }}
              />
              <input
                type="date"
                value={editDueDate}
                onChange={e => setEditDueDate(e.target.value)}
                style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            {error && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: 4 }}>{error}</div>}
          </>
        ) : (
          <>
            <div className="chore-title">{chore.title}</div>
            {chore.description && <div className="chore-desc">{chore.description}</div>}
            <div className="chore-meta">
              <span className="points-badge">+{chore.points} pts</span>
              <DueDateBadge dueDate={chore.dueDate} status={chore.status} />
              {chore.templateId && (
                <span style={{ fontSize: '0.72rem', background: '#ccfbf1', color: '#0d9488', borderRadius: 6, padding: '1px 7px', fontWeight: 700 }}>🔁 Recurring</span>
              )}
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                {chore.status === 'open' && (
                  <>
                    {assignedKid?.avatar && <span>{assignedKid.avatar}</span>}
                    {`Assigned: ${assignedKidName}`}
                  </>
                )}
                {chore.status === 'pending' && (
                  <>
                    {completedByKid?.avatar && <span>{completedByKid.avatar}</span>}
                    {`Completed by: ${completedByName}`}
                  </>
                )}
                {chore.status === 'complete' && (
                  <>
                    {completedByKid?.avatar && <span>{completedByKid.avatar}</span>}
                    {`Completed by: ${completedByName}`}
                  </>
                )}
                {chore.status === 'expired' && (
                  <>
                    {assignedKid?.avatar && <span>{assignedKid.avatar}</span>}
                    {`Was assigned to: ${assignedKidName}`}
                  </>
                )}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="chore-actions">
        {chore.status === 'open' && (
          editing ? (
            <>
              <button className="btn btn-green btn-sm" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => { setEditing(false); setError(''); setShowEmojiPicker(false) }}>Cancel</button>
            </>
          ) : (
            <>
              <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>Edit</button>
              <button className="btn btn-red btn-sm" onClick={handleDelete} disabled={actionLoading}>Delete</button>
            </>
          )
        )}
        {chore.status === 'pending' && (
          <>
            <button className="btn btn-green btn-sm" onClick={handleApprove} disabled={actionLoading}>Approve</button>
            <button className="btn btn-red btn-sm" onClick={handleReject} disabled={actionLoading}>Reject</button>
          </>
        )}
        {chore.status === 'complete' && (
          <>
            <span className="badge complete">Done ✓</span>
            <button className="btn btn-outline btn-sm" onClick={handleRepeat} disabled={actionLoading}>
              {actionLoading ? '…' : '🔁 Repeat'}
            </button>
          </>
        )}
        {chore.status === 'expired' && (
          <>
            <span className="badge expired">Expired</span>
            <button className="btn btn-outline btn-sm" onClick={handleRepeat} disabled={actionLoading}>
              {actionLoading ? '…' : '🔁 Add Again'}
            </button>
            <button className="btn btn-red btn-sm" onClick={handleDelete} disabled={actionLoading}>Delete</button>
          </>
        )}
        {error && chore.status !== 'open' && (
          <span style={{ color: '#dc2626', fontSize: '0.8rem' }}>{error}</span>
        )}
      </div>
    </div>
  )
}

// ── Kid chore card ────────────────────────────────────────────────────────────

export function KidChoreCard({ chore, onRefresh, variant = 'card' }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleComplete() {
    setLoading(true); setError('')
    try { await api.completeChore(chore.id); onRefresh() }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  if (variant === 'row') {
    const isPending = chore.status === 'pending'
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: `1px solid ${isPending ? '#fed7aa' : '#e2e8f0'}`, borderRadius: 10, padding: '10px 14px' }}>
        {isPending ? (
          <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>⏳</span>
        ) : (
          <input
            type="checkbox"
            checked={false}
            disabled={loading}
            onChange={handleComplete}
            style={{ width: 20, height: 20, accentColor: '#0d9488', cursor: loading ? 'default' : 'pointer', flexShrink: 0 }}
          />
        )}
        <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{chore.imageEmoji || '📋'}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontWeight: 600, color: '#1e293b' }}>{chore.title}</span>
          {isPending && <span style={{ display: 'block', fontSize: '0.72rem', color: '#c2410c', fontWeight: 700 }}>⏳ Waiting for approval</span>}
          {error && <span style={{ display: 'block', color: '#dc2626', fontSize: '0.72rem' }}>{error}</span>}
        </span>
        <DueDateBadge dueDate={chore.dueDate} status={chore.status} />
        <span className="points-badge">{chore.points} pts</span>
      </div>
    )
  }

  return (
    <div className={`chore-card ${chore.status}`}>
      <div className="chore-emoji">{chore.imageEmoji || '📋'}</div>
      <div className="chore-info">
        <div className="chore-title">{chore.title}</div>
        {chore.description && <div className="chore-desc">{chore.description}</div>}
        <div className="chore-meta">
          <span className="points-badge">+{chore.points} pts</span>
          <DueDateBadge dueDate={chore.dueDate} status={chore.status} />
          {chore.status === 'pending'  && <span className="badge pending">Awaiting Approval</span>}
          {chore.status === 'complete' && <span className="badge complete">Approved ✓</span>}
          {chore.status === 'expired'  && <span className="badge expired">Expired</span>}
        </div>
        {error && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: 4 }}>{error}</div>}
      </div>
      <div className="chore-actions">
        {chore.status === 'open' && (
          <button className="btn btn-green btn-sm" onClick={handleComplete} disabled={loading}>
            {loading ? 'Marking…' : 'Mark Complete'}
          </button>
        )}
      </div>
    </div>
  )
}
