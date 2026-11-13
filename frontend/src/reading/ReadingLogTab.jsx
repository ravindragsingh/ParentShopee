import { useState, useEffect, useCallback } from 'react'
import { api } from '../api.js'
import BookSearch from './BookSearch.jsx'
import BookView from './BookView.jsx'
import Bookshelf from './Bookshelf.jsx'
import ProgressBar from './ProgressBar.jsx'
import ReadingBuddy from './ReadingBuddy.jsx'
import StatsStrip from './StatsStrip.jsx'

const STATUS_META = {
  assigned:         { label: '📌 New',        color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  in_progress:      { label: '📖 Reading',    color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' },
  pending_approval: { label: '⏳ Sent',       color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  approved:         { label: '✅ Done',       color: '#166534', bg: '#f0fdf4', border: '#bbf7d0' },
}
const STATUS_ORDER = { in_progress: 0, assigned: 1, pending_approval: 2, approved: 3 }

export default function ReadingLogTab({ onBalanceChange, onDetailChange }) {
  const [logs, setLogs] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openLog, setOpenLog] = useState(null)
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState('')

  const loadLogs = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [logsData, statsData] = await Promise.all([api.getReadingLog(), api.getReadingLogStats()])
      setLogs(Array.isArray(logsData) ? logsData : [])
      setStats(statsData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Also catches up the kid's balance badge elsewhere in the app, in case a
  // guardian approved an earlier log while this tab wasn't open.
  useEffect(() => { loadLogs(); onBalanceChange && onBalanceChange() }, [loadLogs])

  // BookView renders its own "← Back" header -- tell LearnGrowTab to hide
  // its own back button while a single book is open, so there's never two
  // stacked back buttons on screen at once.
  useEffect(() => { onDetailChange && onDetailChange(!!openLog) }, [openLog, onDetailChange])

  async function handleStart(book) {
    setStarting(true)
    setStartError('')
    try {
      const log = await api.startReadingLog({
        volumeId: book.volumeId, title: book.title, author: book.author,
        thumbnailUrl: book.thumbnailUrl, description: book.description, totalPages: book.totalPages || null,
        genre: book.genre || null, gradeLevel: book.gradeLevel || null, format: book.format || null,
      })
      await loadLogs()
      setOpenLog(log)
    } catch (err) {
      setStartError(err.message)
    } finally {
      setStarting(false)
    }
  }

  if (openLog) {
    return (
      <BookView
        log={openLog}
        onExit={() => { setOpenLog(null); loadLogs() }}
        onChanged={updated => setOpenLog(updated)}
      />
    )
  }

  if (loading) return <div className="loading-text">Loading Reading Log…</div>

  const sorted = [...logs].sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9))
  // The books that actually need the kid to do something right now (log
  // today's reading, or start one their guardian assigned) -- surfaced as a
  // shortcut at the very top so they don't have to scroll past the buddy,
  // stats, and bookshelf (which can grow long once several books are
  // finished) just to reach the one thing they came here to do.
  const readyToLog = logs.filter(l => l.status === 'in_progress' || l.status === 'assigned')

  return (
    <div>
      <h3 style={{ color: '#334155', margin: '0 0 6px' }}>📖 Reading Log</h3>
      <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 10, padding: '10px 14px', marginBottom: 18, color: '#0f766e', fontSize: '0.85rem' }}>
        Pick a book, log what you read each day, then tell your guardian about it to earn points.
      </div>

      {readyToLog.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            ⚡ Ready to log
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {readyToLog.map(log => (
              <button
                key={log.id}
                onClick={() => setOpenLog(log)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                  background: '#f0fdfa', border: '1.5px solid #99f6e4', borderRadius: 12, padding: '10px 14px', cursor: 'pointer',
                }}
              >
                {log.thumbnailUrl ? (
                  <img src={log.thumbnailUrl} alt="" style={{ width: 32, height: 44, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 32, height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', background: '#fff', borderRadius: 4 }}>📖</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.title}</div>
                  <div style={{ fontSize: '0.74rem', color: '#0f766e', fontWeight: 600 }}>
                    {log.status === 'in_progress' ? 'Log today\'s reading →' : 'Start reading →'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <ReadingBuddy buddy={stats?.buddy} />
      <StatsStrip stats={stats} />

      {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}

      <Bookshelf logs={logs} onOpen={setOpenLog} />

      <div className="form-card" style={{ marginBottom: 18 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Not on your list? Find a book
        </div>
        {startError && <div className="error-msg" style={{ marginBottom: 10 }}>{startError}</div>}
        <BookSearch ctaLabel={starting ? 'Starting…' : 'Start reading'} onPick={starting ? () => {} : handleStart} />
      </div>

      {sorted.length === 0 ? (
        <div className="empty-text">Nothing here yet — search above or wait for your guardian to assign one.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sorted.map(log => {
            const meta = STATUS_META[log.status] || STATUS_META.assigned
            return (
              <div
                key={log.id}
                onClick={() => setOpenLog(log)}
                role="button" tabIndex={0}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setOpenLog(log)}
                style={{
                  background: '#fff', border: `1px solid ${meta.border}`, borderRadius: 10, padding: '10px 14px', cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {log.thumbnailUrl ? (
                    <img src={log.thumbnailUrl} alt="" style={{ width: 32, height: 44, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 32, height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', background: '#f8fafc', borderRadius: 4 }}>📖</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>{log.title}</div>
                    {log.author && <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>by {log.author}</div>}
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, borderRadius: 999, padding: '3px 10px', background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`, flexShrink: 0 }}>
                    {meta.label}
                  </span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: meta.color, flexShrink: 0 }}>⭐ {log.points}</span>
                </div>
                {log.totalPages && (
                  <div style={{ marginTop: 10 }}>
                    <ProgressBar pagesRead={log.pagesRead || 0} totalPages={log.totalPages} compact />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
