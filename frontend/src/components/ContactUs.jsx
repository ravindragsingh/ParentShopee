import { useState, useRef } from 'react'
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

  const isParent = user.role === 'parent'
  const accent   = isParent ? '#7c3aed' : '#059669'
  const accentGrad = isParent
    ? 'linear-gradient(135deg,#7c3aed,#a855f7)'
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
        <button
          className="btn btn-primary"
          style={{ background: accentGrad, border: 'none', marginTop: 8 }}
          onClick={() => { setSuccess(false); setSubject(''); setMessage(''); setCategory('Bug Report'); setScreenshot(null) }}
        >
          Submit Another
        </button>
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
                  background: category === c.value ? (isParent ? '#f5f3ff' : '#f0fdf4') : '#f8fafc',
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
