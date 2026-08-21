import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api.js'

const CATEGORIES = [
  { value: 'Bug Report',       icon: '🐛' },
  { value: 'Feature Request',  icon: '💡' },
  { value: 'Account Issue',    icon: '🔐' },
  { value: 'General Inquiry',  icon: '💬' },
]

const MAX_SCREENSHOT_MB = 2
const MAX_MSG_CHARS = 1000

export default function ContactUs() {
  const [tab, setTab] = useState('new')   // 'new' | 'mine'

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setTab('new')}
          style={{
            padding: '7px 16px', borderRadius: 8, border: `1px solid ${tab === 'new' ? '#0d9488' : '#e2e8f0'}`,
            background: tab === 'new' ? '#f0fdfa' : '#fff', color: tab === 'new' ? '#0d9488' : '#64748b',
            fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
          }}
        >
          📩 New Ticket
        </button>
        <button
          onClick={() => setTab('mine')}
          style={{
            padding: '7px 16px', borderRadius: 8, border: `1px solid ${tab === 'mine' ? '#0d9488' : '#e2e8f0'}`,
            background: tab === 'mine' ? '#f0fdfa' : '#fff', color: tab === 'mine' ? '#0d9488' : '#64748b',
            fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
          }}
        >
          🗂️ My Tickets
        </button>
      </div>
      {tab === 'new' ? <NewTicketForm onSubmitted={() => setTab('mine')} /> : <MyTicketsView />}
    </div>
  )
}

function NewTicketForm({ onSubmitted }) {
  const { user } = useAuth()
  const [category, setCategory]     = useState('Bug Report')
  const [subject, setSubject]       = useState('')
  const [message, setMessage]       = useState('')
  const [screenshot, setScreenshot] = useState(null) // { dataUrl, name, sizeKb }
  const [submitting, setSubmitting] = useState(false)
  const [readingFile, setReadingFile] = useState(false)
  const [success, setSuccess]       = useState(false)
  const [error, setError]           = useState('')
  const fileRef = useRef(null)

  const isGuardian = user.role === 'guardian'
  const accent   = isGuardian ? '#0d9488' : '#059669'
  const accentGrad = isGuardian
    ? 'linear-gradient(135deg,#0f766e,#0d9488)'
    : 'linear-gradient(135deg,#059669,#0d9488)'

  function handleFileChange(e) {
    setError('')
    const file = e.target.files?.[0]
    if (!file) { setScreenshot(null); return }
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, etc.)')
      e.target.value = ''
      return
    }
    if (file.size > MAX_SCREENSHOT_MB * 1024 * 1024) {
      setError(`Screenshot must be under ${MAX_SCREENSHOT_MB} MB.`)
      e.target.value = ''
      return
    }
    const reader = new FileReader()
    setReadingFile(true)
    reader.onload = () => {
      setScreenshot({
        dataUrl: reader.result,
        name: file.name,
        sizeKb: Math.round(file.size / 1024),
      })
      setReadingFile(false)
    }
    reader.readAsDataURL(file)
  }

  function removeScreenshot() {
    setScreenshot(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!subject.trim()) { setError('Please enter a subject.'); return }
    if (message.trim().length < 20) { setError('Please describe your issue in at least 20 characters.'); return }
    if (fileRef.current?.value && !screenshot) { setError('Screenshot is still loading, please wait a moment.'); return }

    setSubmitting(true)
    try {
      await api.submitContact({
        category,
        subject:        subject.trim(),
        message:        message.trim(),
        screenshot_b64: screenshot?.dataUrl || null,
      })
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: 16, textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem' }}>✅</div>
        <div style={{ fontWeight: 700, fontSize: '1.2rem', color: '#1e293b' }}>Ticket Submitted!</div>
        <div style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: 320 }}>
          Your message has been sent to the support team. We'll get back to you as soon as possible.
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button
            className="btn btn-primary"
            style={{ background: accentGrad, border: 'none' }}
            onClick={() => { setSuccess(false); setSubject(''); setMessage(''); setCategory('Bug Report'); setScreenshot(null) }}
          >
            Submit Another
          </button>
          <button
            className="btn"
            style={{ background: '#f1f5f9', color: '#475569', border: 'none' }}
            onClick={onSubmitted}
          >
            View My Tickets
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="form-card" style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: '1.15rem', color: '#1e293b' }}>📩 Contact Support</div>
        <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 3 }}>
          Raise a ticket and we'll get back to you at <strong>{user.email}</strong>
        </div>
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 14 }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* From (read-only) */}
        <div className="form-row" style={{ marginBottom: 14 }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Name</label>
            <input value={user.name} readOnly style={{ background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }} />
          </div>
          <div className="form-group" style={{ flex: 2 }}>
            <label>Your Email</label>
            <input value={user.email || '(no email on file)'} readOnly style={{ background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }} />
          </div>
        </div>

        {/* Category */}
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label>Category</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
            {CATEGORIES.map(c => (
              <div
                key={c.value}
                role="radio"
                aria-checked={category === c.value}
                tabIndex={0}
                onClick={() => setCategory(c.value)}
                onKeyDown={e => (e.key === ' ' || e.key === 'Enter') && setCategory(c.value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  cursor: 'pointer', userSelect: 'none',
                  padding: '7px 14px', borderRadius: 999,
                  background: category === c.value ? (isGuardian ? '#f0fdfa' : '#f0fdf4') : '#f8fafc',
                  border: `2px solid ${category === c.value ? accent : '#e2e8f0'}`,
                  fontSize: '0.85rem', fontWeight: category === c.value ? 700 : 400,
                  color: category === c.value ? accent : '#475569',
                  transition: 'all 0.15s',
                }}
              >
                {c.icon} {c.value}
              </div>
            ))}
          </div>
        </div>

        {/* Subject */}
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label>Subject *</label>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Brief description of your issue…"
            maxLength={120}
          />
        </div>

        {/* Message */}
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label>Message *</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Describe the issue in detail — what happened, what you expected, steps to reproduce…"
            rows={5}
            maxLength={MAX_MSG_CHARS}
            style={{ resize: 'vertical', minHeight: 120 }}
          />
          <div style={{ textAlign: 'right', fontSize: '0.72rem', color: message.length > MAX_MSG_CHARS * 0.9 ? '#f59e0b' : '#94a3b8', marginTop: 3 }}>
            {message.length}/{MAX_MSG_CHARS}
          </div>
        </div>

        {/* Screenshot upload */}
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label>Screenshot <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional — max {MAX_SCREENSHOT_MB} MB)</span></label>

          {!screenshot ? (
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: '2px dashed #cbd5e1', borderRadius: 10, padding: '18px 16px',
                textAlign: 'center', cursor: 'pointer', marginTop: 4,
                background: '#fafafa', transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#cbd5e1'}
            >
              <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>📎</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Click to attach a screenshot</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 3 }}>PNG, JPG, GIF — max {MAX_SCREENSHOT_MB} MB</div>
            </div>
          ) : (
            <div style={{ marginTop: 6, border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
              <img
                src={screenshot.dataUrl}
                alt="Screenshot preview"
                style={{ width: '100%', maxHeight: 240, objectFit: 'contain', background: '#f8fafc' }}
              />
              <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  📎 {screenshot.name} ({screenshot.sizeKb} KB)
                </span>
                <button
                  type="button"
                  onClick={removeScreenshot}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.82rem', fontWeight: 600 }}
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn"
          style={{ background: submitting ? '#e2e8f0' : accentGrad, color: submitting ? '#94a3b8' : 'white', border: 'none', width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: 600, borderRadius: 10, cursor: submitting ? 'not-allowed' : 'pointer' }}
        >
          {submitting ? 'Sending…' : '📩 Submit Ticket'}
        </button>
      </form>
    </div>
  )
}

// ── My Tickets — thread view of past tickets + support replies ─────────────────

function MyTicketsView() {
  const [tickets, setTickets] = useState(null)
  const [error,   setError]   = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setError('')
    try {
      setTickets(await api.getMyTickets())
    } catch (err) {
      setError(err.message)
    }
  }

  if (error) return <div className="error-msg">{error}</div>
  if (tickets === null) return <div style={{ textAlign: 'center', color: '#94a3b8', padding: 48, fontSize: '0.9rem' }}>Loading…</div>
  if (tickets.length === 0) {
    return <div style={{ textAlign: 'center', color: '#94a3b8', padding: 48, fontSize: '0.9rem' }}>You haven't submitted any tickets yet.</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {tickets.map(t => <TicketThreadCard key={t.id} ticket={t} onReplied={load} />)}
    </div>
  )
}

function TicketThreadCard({ ticket: t, onReplied }) {
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function sendReply() {
    if (!replyText.trim()) return
    setSending(true); setError('')
    try {
      await api.replyToTicket(t.id, replyText.trim())
      setReplyText('')
      onReplied()
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="form-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 6 }}>
        <div>
          <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{t.subject}</div>
          <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: 2 }}>{t.category} · {new Date(t.createdAt).toLocaleString()}</div>
        </div>
        <span className={`badge ${t.status === 'open' ? 'open' : 'complete'}`}>{t.status}</span>
      </div>

      <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, margin: '10px 0', whiteSpace: 'pre-wrap' }}>{t.message}</div>

      {t.replies?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid #f1f5f9', paddingTop: 10, marginBottom: 10 }}>
          {t.replies.map(r => (
            <div
              key={r.id}
              style={{
                alignSelf: r.isAdmin ? 'flex-start' : 'flex-end', maxWidth: '85%',
                background: r.isAdmin ? '#f0fdfa' : '#f8fafc',
                border: `1px solid ${r.isAdmin ? '#99f6e4' : '#e2e8f0'}`,
                borderRadius: 10, padding: '8px 12px',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: r.isAdmin ? '#0d9488' : '#475569', marginBottom: 2 }}>
                {r.isAdmin ? 'Support' : 'You'} · {new Date(r.createdAt).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.83rem', color: '#334155', whiteSpace: 'pre-wrap' }}>{r.message}</div>
            </div>
          ))}
        </div>
      )}

      {error && <div className="error-msg" style={{ marginBottom: 8 }}>{error}</div>}

      <textarea
        value={replyText}
        onChange={e => setReplyText(e.target.value)}
        placeholder="Reply to this ticket…"
        rows={2}
        style={{ width: '100%', resize: 'vertical', marginBottom: 8, padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem', fontFamily: 'inherit' }}
      />
      <button
        onClick={sendReply}
        disabled={sending || !replyText.trim()}
        className="btn btn-primary"
        style={{ padding: '6px 16px', fontSize: '0.82rem' }}
      >
        {sending ? 'Sending…' : 'Send Reply'}
      </button>
    </div>
  )
}
