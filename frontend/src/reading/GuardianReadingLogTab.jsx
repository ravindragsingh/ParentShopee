import { useState, useEffect, useCallback } from 'react'
import { api } from '../api.js'
import BookSearch from './BookSearch.jsx'
import ProgressBar from './ProgressBar.jsx'
import StatsStrip from './StatsStrip.jsx'

const STATUS_META = {
  assigned:         { label: '📌 Assigned',   color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  in_progress:      { label: '📖 Reading',    color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' },
  pending_approval: { label: '⏳ Needs review', color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  approved:         { label: '✅ Done',       color: '#166534', bg: '#f0fdf4', border: '#bbf7d0' },
}
// Review-worthy logs float to the top regardless of when they were created.
const STATUS_ORDER = { pending_approval: 0, in_progress: 1, assigned: 2, approved: 3 }

// Groups the four raw statuses into the buckets a guardian actually thinks
// in when looking for a book: "not finished yet" (assigned + reading), plus
// the two end states.
const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: '📌📖 Not done & reading', statuses: ['assigned', 'in_progress'] },
  { key: 'pending_approval', label: '⏳ Needs review', statuses: ['pending_approval'] },
  { key: 'approved', label: '✅ Done', statuses: ['approved'] },
]

function PointsEditor({ points, disabled, onSave }) {
  const [value, setValue] = useState(String(points))
  useEffect(() => { setValue(String(points)) }, [points])

  function commit() {
    const num = Number(value)
    if (!Number.isFinite(num) || num <= 0 || num === points) {
      setValue(String(points))
      return
    }
    onSave(num)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <input
        type="number"
        min="1"
        value={value}
        disabled={disabled}
        onChange={e => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
        style={{ width: 54, padding: '4px 6px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: '0.82rem', textAlign: 'right' }}
      />
      <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>pts</span>
    </div>
  )
}

function AssignPanel({ book, kids, onCancel, onAssigned }) {
  const [kidId, setKidId] = useState(kids[0]?.id || '')
  const [points, setPoints] = useState(10)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleAssign() {
    if (!kidId) { setError('Pick a kid to assign this to.'); return }
    setSaving(true)
    setError('')
    try {
      await api.assignReadingLog({
        kidId, volumeId: book.volumeId, title: book.title, author: book.author,
        thumbnailUrl: book.thumbnailUrl, description: book.description, totalPages: book.totalPages || null,
        genre: book.genre || null, gradeLevel: book.gradeLevel || null, format: book.format || null,
        points: Number(points),
      })
      onAssigned()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 10, padding: '12px 14px', marginTop: 10 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
        {book.thumbnailUrl && <img src={book.thumbnailUrl} alt="" style={{ width: 32, height: 44, objectFit: 'cover', borderRadius: 4 }} />}
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#1e293b' }}>{book.title}</div>
          {book.totalPages && <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>📄 ~{book.totalPages} pages</div>}
        </div>
      </div>
      {error && <div className="error-msg" style={{ marginBottom: 10 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={kidId} onChange={e => setKidId(e.target.value)} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
          {kids.map(k => <option key={k.id} value={k.id}>{k.avatar} {k.name}</option>)}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="number" min="1" value={points} onChange={e => setPoints(e.target.value)} style={{ width: 56, padding: '6px 8px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem' }} />
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>pts on completion</span>
        </div>
        <button type="button" className="btn btn-sm btn-primary" disabled={saving} onClick={handleAssign}>
          {saving ? 'Assigning…' : '✓ Assign'}
        </button>
        <button type="button" className="btn btn-sm btn-outline" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

// Shown for ANY book status, not just pending_approval -- a guardian should
// be able to see what their kid has been logging day to day without waiting
// for the final summary. Approve/Reject only appear once it's actually
// awaiting a decision.
function EntriesPanel({ log, disabled, onApprove, onReject }) {
  const [entries, setEntries] = useState(null)
  useEffect(() => {
    api.getReadingLogEntries(log.id).then(setEntries).catch(() => setEntries([]))
  }, [log.id])

  const pending = log.status === 'pending_approval'

  return (
    <div style={{ marginTop: 10, background: pending ? '#fffbeb' : '#f8fafc', border: `1px solid ${pending ? '#fde68a' : '#e2e8f0'}`, borderRadius: 10, padding: '12px 14px' }}>
      {log.totalPages && (
        <div style={{ marginBottom: 12 }}>
          <ProgressBar pagesRead={log.pagesRead || 0} totalPages={log.totalPages} compact />
        </div>
      )}
      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: pending ? '#92400e' : '#475569', marginBottom: 6 }}>
        📅 Daily log ({entries?.length ?? '…'})
      </div>
      {entries === null ? (
        <div className="loading-text">Loading…</div>
      ) : entries.length === 0 ? (
        <div style={{ fontSize: '0.82rem', color: '#78716c' }}>No daily entries yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
          {entries.map(e => (
            <div key={e.id} style={{ fontSize: '0.82rem', color: pending ? '#78350f' : '#475569' }}>
              <strong>{new Date(e.createdAt).toLocaleDateString()}:</strong> {e.note}
              {e.pages ? <span style={{ color: '#94a3b8' }}> · 📄 +{e.pages} pages</span> : null}
            </div>
          ))}
        </div>
      )}
      {log.summary && (
        <>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: pending ? '#92400e' : '#475569', margin: '10px 0 4px' }}>📝 Summary</div>
          <div style={{ fontSize: '0.84rem', color: pending ? '#78350f' : '#475569', fontStyle: 'italic', marginBottom: 10 }}>"{log.summary}"</div>
        </>
      )}
      {pending && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn-sm" disabled={disabled} onClick={onApprove} style={{ background: '#16a34a', color: '#fff', border: 'none' }}>
            ✅ Approve
          </button>
          <button type="button" className="btn btn-sm btn-outline" disabled={disabled} onClick={onReject}>
            Send back
          </button>
        </div>
      )}
    </div>
  )
}

function LogRow({ log, disabled, onPointsChange, onApprove, onReject, onRemove }) {
  const [open, setOpen] = useState(log.status === 'pending_approval')
  const meta = STATUS_META[log.status] || STATUS_META.assigned
  const canExpand = log.status === 'pending_approval' || (log.entryCount || 0) > 0

  return (
    <div style={{ background: '#fff', border: `1px solid ${meta.border}`, borderRadius: 10, padding: '10px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {log.thumbnailUrl ? (
          <img src={log.thumbnailUrl} alt="" style={{ width: 32, height: 44, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
        ) : (
          <div style={{ width: 32, height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', background: '#f8fafc', borderRadius: 4 }}>📖</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>{log.title}</div>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
            {log.author ? `by ${log.author}` : ''} {log.assignedBy === 'kid' ? '· self-started' : ''}
            {(log.entryCount || 0) > 0 && ` · ${log.entryCount} day${log.entryCount === 1 ? '' : 's'} logged`}
          </div>
        </div>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, borderRadius: 999, padding: '3px 10px', background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, flexShrink: 0 }}>
          {meta.label}
        </span>
        {log.status !== 'approved' ? (
          <PointsEditor points={log.points} disabled={disabled} onSave={onPointsChange} />
        ) : (
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#166534', flexShrink: 0 }}>⭐ {log.points} pts</span>
        )}
        {(log.status === 'assigned' || log.status === 'in_progress') && (
          <button type="button" title="Remove" onClick={onRemove} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem' }}>🗑️</button>
        )}
        {canExpand && (
          <button type="button" onClick={() => setOpen(v => !v)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem' }}>
            {open ? '▲' : '▼'}
          </button>
        )}
      </div>
      {!open && log.totalPages && (
        <div style={{ marginTop: 10 }}>
          <ProgressBar pagesRead={log.pagesRead || 0} totalPages={log.totalPages} compact />
        </div>
      )}
      {canExpand && open && (
        <EntriesPanel log={log} disabled={disabled} onApprove={onApprove} onReject={onReject} />
      )}
    </div>
  )
}

function KidGroup({ kid, logs, busyId, onPointsChange, onApprove, onReject, onRemove }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: '1.3rem' }}>{kid.avatar}</span>
        <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.95rem' }}>{kid.name}</span>
      </div>
      <StatsStrip kidId={kid.id} compact />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {logs.map(log => (
          <LogRow
            key={log.id}
            log={log}
            disabled={busyId === log.id}
            onPointsChange={pts => onPointsChange(log, pts)}
            onApprove={() => onApprove(log)}
            onReject={() => onReject(log)}
            onRemove={() => onRemove(log)}
          />
        ))}
      </div>
    </div>
  )
}

export default function GuardianReadingLogTab() {
  const [logs, setLogs] = useState([])
  const [kids, setKids] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [pickedBook, setPickedBook] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [logsData, kidsData] = await Promise.all([api.getReadingLog(), api.getKids()])
      setLogs(Array.isArray(logsData) ? logsData : [])
      setKids(Array.isArray(kidsData) ? kidsData : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handlePointsChange(log, points) {
    setBusyId(log.id)
    try {
      await api.setReadingLogPoints(log.id, points)
      setLogs(ls => ls.map(l => l.id === log.id ? { ...l, points } : l))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleApprove(log) {
    setBusyId(log.id)
    try {
      await api.approveReadingLog(log.id)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleReject(log) {
    setBusyId(log.id)
    try {
      await api.rejectReadingLog(log.id)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleRemove(log) {
    if (!window.confirm(`Remove "${log.title}"?`)) return
    setBusyId(log.id)
    try {
      await api.removeReadingLog(log.id)
      setLogs(ls => ls.filter(l => l.id !== log.id))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <div className="loading-text">Loading Reading Log…</div>

  const activeFilter = STATUS_FILTERS.find(f => f.key === statusFilter)
  const trimmedSearch = search.trim().toLowerCase()
  const filteredLogs = logs.filter(l => {
    if (activeFilter?.statuses && !activeFilter.statuses.includes(l.status)) return false
    if (trimmedSearch && !(`${l.title} ${l.author || ''}`.toLowerCase().includes(trimmedSearch))) return false
    return true
  })

  const byKid = kids.map(kid => ({
    kid,
    logs: filteredLogs
      .filter(l => l.kidId === kid.id)
      .sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)),
  }))
  const isFiltering = statusFilter !== 'all' || trimmedSearch.length > 0

  return (
    <div>
      <h3 style={{ color: '#334155', margin: '0 0 6px' }}>📖 Reading Log</h3>
      <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 10, padding: '10px 14px', marginBottom: 18, color: '#0f766e', fontSize: '0.85rem' }}>
        Search for any book and assign it to a kid, or let them find their own. See what they've logged day by
        day, then approve their finished summary to pay out points.
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}

      {kids.length === 0 ? (
        <div className="empty-text">Add a kid first before assigning books.</div>
      ) : (
        <div className="form-card" style={{ marginBottom: 18 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Find & assign a book
          </div>
          <BookSearch
            ctaLabel="Assign"
            onPick={book => setPickedBook(p => p?.volumeId === book.volumeId ? null : book)}
            expandedId={pickedBook?.volumeId}
            renderExpanded={book => (
              <AssignPanel
                book={book}
                kids={kids}
                onCancel={() => setPickedBook(null)}
                onAssigned={() => { setPickedBook(null); load() }}
              />
            )}
          />
        </div>
      )}

      {logs.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 14 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search assigned books by title or author…"
            style={{ flex: '1 1 220px', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.84rem', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {STATUS_FILTERS.map(f => (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatusFilter(f.key)}
                className="btn btn-sm"
                style={{
                  borderRadius: 999,
                  border: `1px solid ${statusFilter === f.key ? '#0d9488' : '#e2e8f0'}`,
                  background: statusFilter === f.key ? '#0d9488' : '#fff',
                  color: statusFilter === f.key ? '#fff' : '#64748b',
                  fontWeight: 600,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {byKid.every(g => g.logs.length === 0) ? (
        <div className="empty-text">
          {logs.length === 0
            ? 'No books assigned or started yet.'
            : isFiltering
              ? 'No books match your search/filter.'
              : 'No books assigned or started yet.'}
        </div>
      ) : (
        byKid.map(({ kid, logs: kidLogs }) => kidLogs.length > 0 && (
          <KidGroup
            key={kid.id}
            kid={kid}
            logs={kidLogs}
            busyId={busyId}
            onPointsChange={handlePointsChange}
            onApprove={handleApprove}
            onReject={handleReject}
            onRemove={handleRemove}
          />
        ))
      )}
    </div>
  )
}
