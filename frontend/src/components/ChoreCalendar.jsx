import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { api } from '../api.js'
import { CHORE_EMOJIS, EmojiPicker } from './ChoreCard.jsx'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const STATUS_BG = { open: '#dbeafe', pending: '#fed7aa', complete: '#d1fae5', expired: '#e2e8f0' }
const STATUS_FG = { open: '#1d4ed8', pending: '#c2410c', complete: '#047857', expired: '#64748b' }

function toISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1) }
function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n) }
function addMonths(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, 1) }

// The visible grid pads out to full weeks on both ends so the month always
// renders as complete rows (e.g. Aug 30-31 showing alongside September).
function buildMonthGrid(monthStart) {
  const gridStart = addDays(monthStart, -monthStart.getDay())
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate()
  const lastOfMonth = addDays(monthStart, daysInMonth - 1)
  const gridEnd = addDays(lastOfMonth, 6 - lastOfMonth.getDay())
  const days = []
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d)
  return { days, gridStart, gridEnd }
}

// ─── Day detail modal: full list for the day + inline "assign a chore" form ──

function DayDetailModal({ date, entries, kids, kidsById, onClose, onChanged }) {
  const [title, setTitle] = useState('')
  const [points, setPoints] = useState('5')
  const [emoji, setEmoji] = useState('📋')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [kidIds, setKidIds] = useState([])
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  function toggleKid(id) {
    setKidIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id])
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required.'); return }
    setAdding(true)
    setError('')
    try {
      await api.createChore({
        title: title.trim(), points: Number(points) || 0,
        assignedKidIds: kidIds, dueDate: date, imageEmoji: emoji,
      })
      setTitle(''); setPoints('5'); setKidIds([]); setEmoji('📋')
      onChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setAdding(false)
    }
  }

  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  return createPortal(
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 480, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1e293b' }}>{formattedDate}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ overflowY: 'auto', padding: '14px 20px' }}>
          {entries.length === 0 ? (
            <div className="empty-text">No chores scheduled for this day.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
              {entries.map(e => {
                const kid = e.assignedKidId ? kidsById[e.assignedKidId] : null
                return (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px' }}>
                    <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{e.imageEmoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.88rem' }}>{e.title}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        {kid ? `${kid.avatar || ''} ${kid.name}` : 'Any kid'} · {e.points} pts
                      </div>
                    </div>
                    {e.isVirtual ? (
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#ede9fe', color: '#6d28d9', borderRadius: 999, padding: '2px 9px', flexShrink: 0 }}>🔁 Repeats</span>
                    ) : (
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, background: STATUS_BG[e.status] || '#f1f5f9', color: STATUS_FG[e.status] || '#475569', borderRadius: 999, padding: '2px 9px', textTransform: 'capitalize', flexShrink: 0 }}>
                        {e.status}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: 14 }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#334155', marginBottom: 10 }}>➕ Assign a chore for this day</div>
            <form onSubmit={handleAdd}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <button type="button" onClick={() => setShowEmojiPicker(v => !v)} style={{ width: 44, fontSize: '1.3rem', border: '1px solid #cbd5e1', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>{emoji}</button>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Chore title" style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.9rem' }} />
                <input type="number" min="0" value={points} onChange={e => setPoints(e.target.value)} placeholder="Pts" style={{ width: 70, padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.9rem' }} />
              </div>
              {showEmojiPicker && (
                <div style={{ marginBottom: 8 }}>
                  <EmojiPicker emojis={CHORE_EMOJIS} value={emoji} onChange={val => { setEmoji(val); setShowEmojiPicker(false) }} />
                </div>
              )}
              {kids.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  {kids.map(k => (
                    <button
                      type="button" key={k.id} onClick={() => toggleKid(k.id)}
                      style={{
                        padding: '4px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                        border: `1.5px solid ${kidIds.includes(k.id) ? '#0d9488' : '#e2e8f0'}`,
                        background: kidIds.includes(k.id) ? '#f0fdfa' : '#fff',
                        color: kidIds.includes(k.id) ? '#0d9488' : '#64748b',
                      }}
                    >
                      {k.avatar} {k.name}
                    </button>
                  ))}
                  {kidIds.length === 0 && (
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>(unselected = any kid can claim it)</span>
                  )}
                </div>
              )}
              {error && <div className="error-msg" style={{ marginBottom: 8 }}>{error}</div>}
              <button type="submit" className="btn btn-green btn-sm" disabled={adding}>
                {adding ? 'Adding...' : 'Add Chore'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Month grid ───────────────────────────────────────────────────────────────

export default function ChoreCalendar({ kids }) {
  const [monthStart, setMonthStart] = useState(() => startOfMonth(new Date()))
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterKidId, setFilterKidId] = useState('')
  const [selectedDate, setSelectedDate] = useState(null)

  const { days, gridStart, gridEnd } = useMemo(() => buildMonthGrid(monthStart), [monthStart])

  const loadEntries = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getChoresCalendar(toISODate(gridStart), toISODate(gridEnd))
      setEntries(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [gridStart, gridEnd])

  useEffect(() => { loadEntries() }, [loadEntries])

  const entriesByDate = useMemo(() => {
    const map = {}
    for (const e of entries) {
      if (filterKidId && e.assignedKidId !== filterKidId) continue
      if (!map[e.date]) map[e.date] = []
      map[e.date].push(e)
    }
    return map
  }, [entries, filterKidId])

  const todayStr = toISODate(new Date())
  const kidsById = useMemo(() => Object.fromEntries(kids.map(k => [k.id, k])), [kids])

  return (
    <div>
      {kids.length > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => setFilterKidId('')}
            style={{
              padding: '5px 14px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
              border: `1.5px solid ${!filterKidId ? '#0d9488' : '#e2e8f0'}`,
              background: !filterKidId ? '#f0fdfa' : '#fff',
              color: !filterKidId ? '#0d9488' : '#64748b',
            }}
          >
            All kids
          </button>
          {kids.map(kid => (
            <button
              key={kid.id}
              onClick={() => setFilterKidId(kid.id === filterKidId ? '' : kid.id)}
              style={{
                padding: '5px 14px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                border: `1.5px solid ${filterKidId === kid.id ? '#0d9488' : '#e2e8f0'}`,
                background: filterKidId === kid.id ? '#f0fdfa' : '#fff',
                color: filterKidId === kid.id ? '#0d9488' : '#64748b',
              }}
            >
              {kid.avatar} {kid.name}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <button className="btn btn-outline btn-sm" onClick={() => setMonthStart(m => addMonths(m, -1))}>← Prev</button>
        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e293b' }}>
          {monthStart.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-outline btn-sm" onClick={() => setMonthStart(startOfMonth(new Date()))}>Today</button>
          <button className="btn btn-outline btn-sm" onClick={() => setMonthStart(m => addMonths(m, 1))}>Next →</button>
        </div>
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}

      {loading ? <div className="loading-text">Loading calendar...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {WEEKDAY_LABELS.map(w => (
            <div key={w} style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', padding: '4px 0' }}>{w}</div>
          ))}
          {days.map(d => {
            const dateStr = toISODate(d)
            const inMonth = d.getMonth() === monthStart.getMonth()
            const dayEntries = entriesByDate[dateStr] || []
            const isToday = dateStr === todayStr
            return (
              <div
                key={dateStr}
                role="button" tabIndex={0}
                onClick={() => setSelectedDate(dateStr)}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setSelectedDate(dateStr)}
                style={{
                  minHeight: 78, borderRadius: 10, padding: 6, cursor: 'pointer',
                  background: isToday ? '#fff7ed' : '#fff',
                  border: isToday ? '1.5px solid #ea580c' : '1px solid #f1f5f9',
                  opacity: inMonth ? 1 : 0.4,
                  display: 'flex', flexDirection: 'column', gap: 3, overflow: 'hidden',
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: isToday ? 800 : 600, color: isToday ? '#ea580c' : '#334155' }}>{d.getDate()}</div>
                {dayEntries.slice(0, 3).map(e => (
                  <div key={e.id} style={{
                    fontSize: '0.64rem', borderRadius: 5, padding: '1px 4px', overflow: 'hidden',
                    whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                    background: e.isVirtual ? '#ede9fe' : (STATUS_BG[e.status] || '#f1f5f9'),
                    color: e.isVirtual ? '#6d28d9' : (STATUS_FG[e.status] || '#475569'),
                  }}>
                    {e.imageEmoji} {e.title}
                  </div>
                ))}
                {dayEntries.length > 3 && (
                  <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 700 }}>+{dayEntries.length - 3} more</div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {selectedDate && (
        <DayDetailModal
          date={selectedDate}
          entries={entriesByDate[selectedDate] || []}
          kids={kids}
          kidsById={kidsById}
          onClose={() => setSelectedDate(null)}
          onChanged={loadEntries}
        />
      )}
    </div>
  )
}
