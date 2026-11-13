import { useState, useEffect } from 'react'
import { api } from '../api.js'
import ProgressBar from './ProgressBar.jsx'

const MAX_SUMMARY_CHARS = 1000

// A little celebratory nudge after EVERY daily log, not just the final
// approval -- the habit of showing up and logging a day's reading should
// feel good on its own, not only at the finish line.
const FUN_MESSAGES = [
  'Every page makes you smarter! 🧠✨',
  'Your reading buddy is cheering you on! 📣',
  'Books are like magic you can hold! 🪄',
  "You're on a reading roll! 🎉",
  'One more step on your reading adventure! 🗺️',
  'Future you says thanks for reading today! 💌',
]
const FUN_MESSAGES_WITH_PAGES = pages => [
  `${pages} page${pages === 1 ? '' : 's'}?! That's awesome! 🙌`,
  `Reading ${pages} page${pages === 1 ? '' : 's'} takes real focus — nice work! 🔍`,
  `${pages} page${pages === 1 ? '' : 's'} closer to finishing your book! 📘`,
]
function pickFunMessage(pages) {
  const pool = pages ? FUN_MESSAGES_WITH_PAGES(pages) : FUN_MESSAGES
  return pool[Math.floor(Math.random() * pool.length)]
}

function BookCard({ log }) {
  return (
    <div
      className="pop-in"
      style={{
        background: '#fff', border: '1px solid #f1f5f9', borderRadius: 16,
        padding: '20px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10,
      }}
    >
      {log.thumbnailUrl ? (
        <img src={log.thumbnailUrl} alt="" style={{ width: 90, height: 126, objectFit: 'cover', borderRadius: 8 }} />
      ) : (
        <div style={{ fontSize: '3rem' }}>📖</div>
      )}
      {log.author && (
        <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>by {log.author}</div>
      )}
      {log.description && (
        <div style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.5 }}>{log.description}</div>
      )}
      {log.totalPages && (
        <div style={{ width: '100%', marginTop: 4 }}>
          <ProgressBar pagesRead={log.pagesRead || 0} totalPages={log.totalPages} />
        </div>
      )}
    </div>
  )
}

function DailyLog({ log, onLogged }) {
  const [entries, setEntries] = useState(null)
  const [note, setNote] = useState('')
  const [pages, setPages] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [funMessage, setFunMessage] = useState('')

  useEffect(() => {
    api.getReadingLogEntries(log.id).then(setEntries).catch(() => setEntries([]))
  }, [log.id])

  async function handleAdd(e) {
    e.preventDefault()
    if (note.trim().length < 3) return
    setSubmitting(true)
    setError('')
    try {
      const pagesNum = pages ? Number(pages) : null
      const entry = await api.addReadingLogEntry(log.id, note.trim(), pagesNum)
      setEntries(es => [...(es || []), entry])
      setNote('')
      setPages('')
      onLogged(pagesNum || 0)
      setFunMessage(pickFunMessage(pagesNum))
      setTimeout(() => setFunMessage(''), 4000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: 8 }}>📅 Daily Reading Log</div>
      {funMessage && (
        <div className="pop-in" style={{ background: '#fdf4ff', border: '1px solid #f0abfc', borderRadius: 10, padding: '10px 14px', marginBottom: 12, color: '#a21caf', fontWeight: 700, fontSize: '0.85rem', textAlign: 'center' }}>
          🎊 {funMessage}
        </div>
      )}
      {entries === null ? (
        <div className="loading-text">Loading…</div>
      ) : entries.length === 0 ? (
        <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: 10 }}>No entries yet — log what you read today below.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
          {entries.map(en => (
            <div key={en.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8' }}>
                {new Date(en.createdAt).toLocaleDateString()}
                {en.pages ? <span> · 📄 {en.pages} pages</span> : null}
              </div>
              <div style={{ fontSize: '0.84rem', color: '#334155' }}>{en.note}</div>
            </div>
          ))}
        </div>
      )}
      {error && <div className="error-msg" style={{ marginBottom: 10 }}>{error}</div>}
      <form onSubmit={handleAdd}>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="What did you read today?"
          rows={2}
          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.86rem', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <input
            type="number" min="0" value={pages} onChange={e => setPages(e.target.value)}
            placeholder="0"
            style={{ width: 70, padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '0.86rem', boxSizing: 'border-box' }}
          />
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>pages read today (optional)</span>
        </div>
        <button type="submit" disabled={submitting || note.trim().length < 3} className="btn btn-sm btn-primary" style={{ marginTop: 10 }}>
          {submitting ? 'Saving…' : '+ Log today'}
        </button>
      </form>
      <button
        type="button"
        onClick={() => document.getElementById('reading-log-complete-section')?.scrollIntoView({ behavior: 'smooth' })}
        style={{ display: (entries && entries.length > 0) ? 'inline-block' : 'none', marginTop: 10, background: 'none', border: 'none', color: '#0d9488', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', padding: 0 }}
      >
        Finished the book? Mark it complete ↓
      </button>
    </div>
  )
}

function CompleteForm({ log, onComplete }) {
  const [summary, setSummary] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const updated = await api.completeReadingLog(log.id, summary.trim())
      onComplete(updated)
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div id="reading-log-complete-section" style={{ marginTop: 24, borderTop: '1px dashed #e2e8f0', paddingTop: 18 }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>📝 Mark as complete</div>
      <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 10 }}>Summarize the book for your guardian, then send it in for approval.</div>
      {error && <div className="error-msg" style={{ marginBottom: 10 }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <textarea
          value={summary}
          onChange={e => setSummary(e.target.value.slice(0, MAX_SUMMARY_CHARS))}
          placeholder="What was the book about? What happened?"
          rows={5}
          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.86rem', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }}
        />
        <div style={{ textAlign: 'right', fontSize: '0.72rem', color: summary.length > MAX_SUMMARY_CHARS * 0.9 ? '#f59e0b' : '#94a3b8', marginTop: 3 }}>
          {summary.length}/{MAX_SUMMARY_CHARS}
        </div>
        <button
          type="submit"
          disabled={submitting || summary.trim().length < 10}
          className="login-btn"
          style={{ marginTop: 6 }}
        >
          {submitting ? 'Sending…' : `Send to my guardian · earn ${log.points} pts`}
        </button>
      </form>
    </div>
  )
}

export default function BookView({ log: initialLog, onExit, onChanged }) {
  const [log, setLog] = useState(initialLog)

  function handleLogged(pagesAdded) {
    const next = { ...log, status: 'in_progress', pagesRead: (log.pagesRead || 0) + pagesAdded }
    setLog(next)
    onChanged(next)
  }

  function handleChanged(updated) {
    setLog(updated)
    onChanged(updated)
  }

  return (
    <div>
      <button onClick={onExit} style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', marginBottom: 14, padding: 0 }}>
        ← Back
      </button>
      <h3 style={{ color: '#334155', margin: '0 0 4px' }}>{log.title}</h3>

      <BookCard log={log} />

      {log.status === 'approved' ? (
        <div className="result-celebration" style={{ marginTop: 20, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '18px 16px', textAlign: 'center' }}>
          <div className="mega-confetti" aria-hidden="true">
            {['🎉', '✨', '⭐', '🎊', '🎈', '🌟', '💫', '🏆'].map((p, i) => (
              <span key={i} className={`confetti-piece mc-${i}`}>{p}</span>
            ))}
          </div>
          <div style={{ color: '#166534', fontWeight: 700, fontSize: '0.9rem' }}>
            ✅ Done — your guardian approved this and you earned {log.points} pts!
          </div>
        </div>
      ) : log.status === 'pending_approval' ? (
        <div className="pop-in" style={{ marginTop: 20, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '14px 16px', textAlign: 'center', color: '#92400e', fontWeight: 700, fontSize: '0.9rem' }}>
          ⏳ Sent to your guardian — you'll get your {log.points} pts once they take a look.
        </div>
      ) : (
        <>
          <DailyLog log={log} onLogged={handleLogged} />
          <CompleteForm log={log} onComplete={handleChanged} />
        </>
      )}
    </div>
  )
}
