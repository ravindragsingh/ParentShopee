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

export function ParentChoreCard({ chore, kids, onRefresh }) {
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
            <div className="inline-edit" style={{ marginBottom: 8 }}>
              <input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                placeholder="Title"
                style={{ width: '200px' }}
              />
              <input
                type="number"
                value={editPoints}
                onChange={e => setEditPoints(e.target.value)}
                placeholder="Points"
                style={{ width: '80px' }}
              />
              <select
                value={editKid}
                onChange={e => setEditKid(e.target.value)}
                style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
              >
                <option value="">Any kid</option>
                {kids.map(k => (
                  <option key={k.id} value={k.id}>{k.avatar} {k.name}</option>
                ))}
              </select>
            </div>
            <div className="inline-edit" style={{ marginBottom: 4 }}>
              <input
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                placeholder="Description"
                style={{ width: '260px' }}
              />
              <label style={{ fontSize: '0.78rem', color: '#64748b', whiteSpace: 'nowrap' }}>Due date:</label>
              <input
                type="date"
                value={editDueDate}
                onChange={e => setEditDueDate(e.target.value)}
                style={{ width: '150px' }}
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

export function KidChoreCard({ chore, onRefresh }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleComplete() {
    setLoading(true); setError('')
    try { await api.completeChore(chore.id); onRefresh() }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
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
