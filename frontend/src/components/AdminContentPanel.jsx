import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api.js'
import SlideCard, { SLIDE_WIDGETS } from '../futureready/SlideCard.jsx'

// Shared ad hoc style constants, duplicated from AdminDashboard.jsx -- this
// app has no shared style module, every admin file keeps its own small copy.
const inputStyle = {
  width: '100%', padding: '8px 11px', borderRadius: 8,
  border: '1px solid #e2e8f0', fontSize: '0.87rem', outline: 'none', boxSizing: 'border-box',
}
const labelStyle = { display: 'block', fontWeight: 600, fontSize: '0.8rem', color: '#374151', marginBottom: 4 }
const editBtnStyle = {
  background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 6,
  padding: '4px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', color: '#0d9488', flexShrink: 0,
}
const deleteBtnStyle = {
  background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6,
  padding: '4px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', color: '#dc2626', flexShrink: 0,
}
const primaryBtnStyle = {
  padding: '9px 22px', borderRadius: 8, border: 'none', background: '#0d9488', color: '#fff',
  fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem',
}
const outlineBtnStyle = {
  padding: '9px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff',
  color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem',
}
const smallIconBtnStyle = {
  background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, width: 28, height: 28,
  fontSize: '0.85rem', cursor: 'pointer', color: '#475569',
}

const WIDGET_OPTIONS = ['', ...Object.keys(SLIDE_WIDGETS)]

function StatusBadge({ status }) {
  const published = status === 'published'
  return (
    <span style={{
      fontSize: '0.72rem', fontWeight: 700, borderRadius: 999, padding: '2px 10px',
      background: published ? '#f0fdf4' : '#fef9c3', color: published ? '#166534' : '#854d0e',
    }}>
      {published ? 'Published' : 'Draft'}
    </span>
  )
}

// ── Modal shell (same overlay/header/footer chrome as AdminDashboard's EditModal) ──

function ModalShell({ title, subtitle, onClose, children, footer }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.22)', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ padding: '16px 22px 12px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>{title}</div>
            {subtitle && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ padding: '18px 22px' }}>
          {children}
          {footer}
        </div>
      </div>
    </div>
  )
}

// ── Topic create/edit modal ─────────────────────────────────────────────────

function TopicFormModal({ topic, section, onSave, onClose }) {
  const isEdit = !!topic
  const [id, setId] = useState(topic?.id || '')
  const [title, setTitle] = useState(topic?.title || '')
  const [emoji, setEmoji] = useState(topic?.emoji || '📘')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (isEdit) {
        await api.adminUpdateContentTopic(topic.id, { title, emoji })
      } else {
        if (!id.trim()) { setError('Give this topic an id (a short slug, e.g. "coding-for-kids").'); setSaving(false); return }
        await api.adminCreateContentTopic({ id: id.trim(), section, title, emoji })
      }
      onSave()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <ModalShell title={isEdit ? 'Edit Topic' : 'New Topic'} subtitle={section === 'quest' ? 'Quest category' : section === 'reading-log' ? 'Reading Log genre' : 'Future-Ready topic'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: '0.83rem' }}>{error}</div>}
        {!isEdit && (
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Id (slug)</label>
            <input value={id} onChange={e => setId(e.target.value.trim())} style={inputStyle} placeholder="e.g. coding-for-kids" required />
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Emoji</label>
            <input value={emoji} onChange={e => setEmoji(e.target.value)} style={{ ...inputStyle, width: 64, textAlign: 'center', fontSize: '1.2rem' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} required />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button type="button" onClick={onClose} style={outlineBtnStyle}>Cancel</button>
          <button type="submit" disabled={saving} style={{ ...primaryBtnStyle, opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </ModalShell>
  )
}

// ── Module create modal ─────────────────────────────────────────────────────

function ModuleFormModal({ section, topic, onSave, onClose }) {
  const [ageBands, setAgeBands] = useState([])
  const [id, setId] = useState('')
  const [bandIndex, setBandIndex] = useState(0)
  const [title, setTitle] = useState('')
  const [points, setPoints] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.adminContentAgeBands(section).then(bands => {
      setAgeBands(bands)
      if (bands[0]) setPoints(bands[0].defaultPoints ?? 8)
    }).catch(() => {})
  }, [section])

  function handleBandChange(i) {
    setBandIndex(i)
    const band = ageBands[i]
    if (band) setPoints(band.defaultPoints ?? points)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const band = ageBands[bandIndex]
    if (!band) return
    if (!id.trim()) { setError('Give this module an id (e.g. "coding-4-6-p1").'); return }
    setSaving(true)
    setError('')
    try {
      const created = await api.adminCreateContentModule({
        id: id.trim(), section, topic: topic.id, ageMin: band.ageMin, ageMax: band.ageMax,
        title: title.trim() || `Ages ${band.ageMin}–${band.ageMax}`, points: Number(points),
      })
      onSave(created)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <ModalShell title="New Module" subtitle={topic.title} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: '0.83rem' }}>{error}</div>}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Id (slug)</label>
          <input value={id} onChange={e => setId(e.target.value.trim())} style={inputStyle} placeholder="e.g. coding-4-6-p1" required />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Age band</label>
          <select value={bandIndex} onChange={e => handleBandChange(Number(e.target.value))} style={inputStyle}>
            {ageBands.map((b, i) => <option key={i} value={i}>Ages {b.ageMin}–{b.ageMax}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Title <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional -- defaults to "Ages X–Y", add "· Part 2" etc. for a multi-part topic)</span></label>
          <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} placeholder={ageBands[bandIndex] ? `Ages ${ageBands[bandIndex].ageMin}–${ageBands[bandIndex].ageMax}` : ''} />
        </div>
        <div style={{ marginBottom: 6 }}>
          <label style={labelStyle}>Points</label>
          <input type="number" min="1" value={points} onChange={e => setPoints(e.target.value)} style={inputStyle} required />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button type="button" onClick={onClose} style={outlineBtnStyle}>Cancel</button>
          <button type="submit" disabled={saving || !ageBands.length} style={{ ...primaryBtnStyle, opacity: saving ? 0.7 : 1 }}>{saving ? 'Creating…' : 'Create & Edit'}</button>
        </div>
      </form>
    </ModalShell>
  )
}

// ── Topic list ───────────────────────────────────────────────────────────────

function TopicList({ section, onOpenTopic }) {
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formTopic, setFormTopic] = useState(null) // null = closed, {} = create, {...} = edit
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    api.adminListContentTopics(section).then(setTopics).catch(err => setError(err.message)).finally(() => setLoading(false))
  }, [section])

  useEffect(() => { load() }, [load])

  async function handleDeactivate(topic) {
    if (!window.confirm(`Deactivate "${topic.title}"? This only works if it has no active modules left.`)) return
    try {
      await api.adminDeleteContentTopic(topic.id)
      load()
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleReactivate(topic) {
    try {
      await api.adminUpdateContentTopic(topic.id, { isActive: true })
      load()
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <div className="loading-text">Loading topics...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{topics.length} topic{topics.length === 1 ? '' : 's'}</div>
        <button onClick={() => { setFormTopic(null); setShowForm(true) }} style={primaryBtnStyle}>+ New Topic</button>
      </div>
      {error && <div className="error-msg">{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12 }}>
        {topics.map(t => (
          <div key={t.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', background: t.isActive ? '#fff' : '#f8fafc', opacity: t.isActive ? 1 : 0.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: '1.4rem' }}>{t.emoji}</span>
              <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.92rem' }}>{t.title}</div>
            </div>
            <button
              onClick={() => onOpenTopic(t)}
              style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 8, padding: '8px 12px', marginBottom: 8, cursor: 'pointer', color: '#0d9488', fontWeight: 700, fontSize: '0.82rem' }}
            >
              📋 View Modules <span>→</span>
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setFormTopic(t); setShowForm(true) }} style={editBtnStyle}>✏️ Edit</button>
              {t.isActive
                ? <button onClick={() => handleDeactivate(t)} style={deleteBtnStyle}>Deactivate</button>
                : <button onClick={() => handleReactivate(t)} style={editBtnStyle}>Reactivate</button>}
            </div>
          </div>
        ))}
      </div>
      {showForm && (
        <TopicFormModal
          topic={formTopic} section={section}
          onSave={() => { setShowForm(false); load() }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

// ── Module list (within a topic) ────────────────────────────────────────────

function ModuleList({ section, topic, onBack, onOpenModule }) {
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    api.adminListContentModules(topic.id).then(setModules).catch(err => setError(err.message)).finally(() => setLoading(false))
  }, [topic.id])

  useEffect(() => { load() }, [load])

  async function handleStatusToggle(m) {
    try {
      await api.adminUpdateModuleStatus(m.id, m.status === 'published' ? 'draft' : 'published')
      load()
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleDeactivate(m) {
    if (!window.confirm(`Deactivate "${m.title}"? Kids who already completed it keep their points; it just stops showing up for anyone else.`)) return
    try {
      await api.adminDeleteContentModule(m.id)
      load()
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleReactivate(m) {
    try {
      await api.adminUpdateContentModule(m.id, { isActive: true })
      load()
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <div className="loading-text">Loading modules...</div>

  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', marginBottom: 14, padding: 0 }}>← Back to Topics</button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{topic.emoji} {topic.title}</div>
        <button onClick={() => setShowForm(true)} style={primaryBtnStyle}>+ New Module</button>
      </div>
      {error && <div className="error-msg">{error}</div>}
      {modules.length === 0 ? (
        <div className="empty-text">No modules yet -- add the first one.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '6px 8px' }}>Ages</th>
              <th style={{ padding: '6px 8px' }}>Title</th>
              <th style={{ padding: '6px 8px' }}>Points</th>
              <th style={{ padding: '6px 8px' }}>Status</th>
              <th style={{ padding: '6px 8px' }}></th>
            </tr>
          </thead>
          <tbody>
            {modules.map(m => (
              <tr key={m.id} style={{ borderTop: '1px solid #f1f5f9', opacity: m.isActive ? 1 : 0.5 }}>
                <td style={{ padding: '8px' }}>{m.ageMin}–{m.ageMax}</td>
                <td style={{ padding: '8px', fontWeight: 600, color: '#1e293b' }}>
                  {m.title}{m.isPremium && <span title="Premium" style={{ marginLeft: 6 }}>💎</span>}
                </td>
                <td style={{ padding: '8px' }}>{m.points}</td>
                <td style={{ padding: '8px' }}><StatusBadge status={m.status} /></td>
                <td style={{ padding: '8px', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <button onClick={() => onOpenModule(m)} style={editBtnStyle}>✏️ Edit</button>
                  <button onClick={() => handleStatusToggle(m)} style={editBtnStyle}>{m.status === 'published' ? 'Unpublish' : 'Publish'}</button>
                  {m.isActive
                    ? <button onClick={() => handleDeactivate(m)} style={deleteBtnStyle}>Deactivate</button>
                    : <button onClick={() => handleReactivate(m)} style={editBtnStyle}>Reactivate</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {showForm && (
        <ModuleFormModal
          section={section} topic={topic}
          onSave={created => { setShowForm(false); onOpenModule(created) }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

// ── Slide editor card (Future-Ready) ────────────────────────────────────────

function SlideEditorCard({ slide, index, total, onChange, onRemove, onMove, onPreview, isPreviewing }) {
  const [configText, setConfigText] = useState(() => JSON.stringify(slide.widgetConfig ?? {}, null, 2))
  const [configError, setConfigError] = useState('')

  function set(field, value) { onChange({ ...slide, [field]: value }) }

  function handleWidgetChange(widget) {
    onChange({ ...slide, widget: widget || undefined, widgetConfig: widget ? (slide.widgetConfig ?? {}) : undefined })
    setConfigText(JSON.stringify(widget ? (slide.widgetConfig ?? {}) : {}, null, 2))
  }

  function handleConfigChange(text) {
    setConfigText(text)
    try {
      const parsed = JSON.parse(text)
      setConfigError('')
      onChange({ ...slide, widgetConfig: parsed })
    } catch {
      setConfigError('Not valid JSON yet')
    }
  }

  return (
    <div style={{ border: `1px solid ${isPreviewing ? '#5eead4' : '#e2e8f0'}`, borderRadius: 12, padding: '14px 16px', marginBottom: 10, background: isPreviewing ? '#f0fdfa' : '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#64748b' }}>Slide {index + 1} of {total}</div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button type="button" onClick={onPreview} style={smallIconBtnStyle} title="Preview">👁</button>
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} style={smallIconBtnStyle} title="Move up">↑</button>
          <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} style={smallIconBtnStyle} title="Move down">↓</button>
          <button type="button" onClick={onRemove} style={{ ...smallIconBtnStyle, color: '#dc2626' }} title="Remove">✕</button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <input value={slide.emoji || ''} onChange={e => set('emoji', e.target.value)} style={{ ...inputStyle, width: 56, textAlign: 'center', fontSize: '1.1rem' }} placeholder="🙂" />
        <input value={slide.title || ''} onChange={e => set('title', e.target.value)} style={{ ...inputStyle, flex: 1 }} placeholder="Slide title" />
      </div>
      <textarea value={slide.text || ''} onChange={e => set('text', e.target.value)} style={{ ...inputStyle, minHeight: 70, marginBottom: 10, resize: 'vertical' }} placeholder="Slide text" />
      <div style={{ marginBottom: slide.widget ? 8 : 0 }}>
        <label style={labelStyle}>Widget</label>
        <select value={slide.widget || ''} onChange={e => handleWidgetChange(e.target.value)} style={inputStyle}>
          <option value="">None</option>
          {Object.keys(SLIDE_WIDGETS).map(w => <option key={w} value={w}>{w}</option>)}
        </select>
      </div>
      {slide.widget && (
        <div>
          <label style={labelStyle}>Widget config (JSON)</label>
          <textarea
            value={configText} onChange={e => handleConfigChange(e.target.value)}
            style={{ ...inputStyle, minHeight: 100, fontFamily: 'monospace', fontSize: '0.78rem', resize: 'vertical', borderColor: configError ? '#fca5a5' : '#e2e8f0' }}
          />
          {configError && <div style={{ color: '#dc2626', fontSize: '0.74rem', marginTop: 4 }}>{configError}</div>}
        </div>
      )}
    </div>
  )
}

// ── Quiz question editor card (Future-Ready) ────────────────────────────────

function QuizEditorCard({ q, index, total, onChange, onRemove, onMove }) {
  function set(field, value) { onChange({ ...q, [field]: value }) }
  const choices = q.choices || []

  function setChoice(i, value) {
    const next = [...choices]
    next[i] = value
    set('choices', next)
  }
  function addChoice() { set('choices', [...choices, '']) }
  function removeChoice(i) {
    const next = choices.filter((_, idx) => idx !== i)
    set('choices', next)
    if (q.correctIndex >= next.length) set('correctIndex', 0)
  }

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#64748b' }}>Question {index + 1} of {total}</div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} style={smallIconBtnStyle} title="Move up">↑</button>
          <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} style={smallIconBtnStyle} title="Move down">↓</button>
          <button type="button" onClick={onRemove} style={{ ...smallIconBtnStyle, color: '#dc2626' }} title="Remove">✕</button>
        </div>
      </div>
      <textarea value={q.question || ''} onChange={e => set('question', e.target.value)} style={{ ...inputStyle, minHeight: 50, marginBottom: 10, resize: 'vertical' }} placeholder="Question" />
      <label style={labelStyle}>Choices (pick the correct one)</label>
      {choices.map((c, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <input type="radio" checked={q.correctIndex === i} onChange={() => set('correctIndex', i)} />
          <input value={c} onChange={e => setChoice(i, e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          <button type="button" onClick={() => removeChoice(i)} style={smallIconBtnStyle}>✕</button>
        </div>
      ))}
      <button type="button" onClick={addChoice} style={{ ...editBtnStyle, marginBottom: 10 }}>+ Add choice</button>
      <label style={labelStyle}>Explanation (shown after answering)</label>
      <textarea value={q.explanation || ''} onChange={e => set('explanation', e.target.value)} style={{ ...inputStyle, minHeight: 50, resize: 'vertical' }} />
    </div>
  )
}

// ── Activity editor card (Quests) ───────────────────────────────────────────

function ListField({ label, items, onChange, placeholder }) {
  function setItem(i, value) {
    const next = [...items]
    next[i] = value
    onChange(next)
  }
  function addItem() { onChange([...items, '']) }
  function removeItem(i) { onChange(items.filter((_, idx) => idx !== i)) }

  return (
    <div style={{ marginBottom: 10 }}>
      <label style={labelStyle}>{label}</label>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <input value={it} onChange={e => setItem(i, e.target.value)} style={{ ...inputStyle, flex: 1 }} placeholder={placeholder} />
          <button type="button" onClick={() => removeItem(i)} style={smallIconBtnStyle}>✕</button>
        </div>
      ))}
      <button type="button" onClick={addItem} style={editBtnStyle}>+ Add</button>
    </div>
  )
}

function ActivityEditorCard({ activity, index, total, onChange, onRemove, onMove }) {
  function set(field, value) { onChange({ ...activity, [field]: value }) }

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#64748b' }}>Activity {index + 1} of {total}</div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} style={smallIconBtnStyle} title="Move up">↑</button>
          <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} style={smallIconBtnStyle} title="Move down">↓</button>
          <button type="button" onClick={onRemove} style={{ ...smallIconBtnStyle, color: '#dc2626' }} title="Remove">✕</button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <input value={activity.emoji || ''} onChange={e => set('emoji', e.target.value)} style={{ ...inputStyle, width: 56, textAlign: 'center', fontSize: '1.1rem' }} placeholder="🧩" />
        <input value={activity.title || ''} onChange={e => set('title', e.target.value)} style={{ ...inputStyle, flex: 1 }} placeholder="Activity title" />
      </div>
      <label style={labelStyle}>Description</label>
      <textarea value={activity.description || ''} onChange={e => set('description', e.target.value)} style={{ ...inputStyle, minHeight: 60, marginBottom: 10, resize: 'vertical' }} />
      <label style={labelStyle}>Example</label>
      <textarea value={activity.example || ''} onChange={e => set('example', e.target.value)} style={{ ...inputStyle, minHeight: 50, marginBottom: 10, resize: 'vertical' }} />
      <ListField label="Materials" items={activity.materials || []} onChange={v => set('materials', v)} placeholder="e.g. None needed" />
      <div style={{ marginBottom: 10 }}>
        <label style={labelStyle}>Duration</label>
        <input value={activity.duration || ''} onChange={e => set('duration', e.target.value)} style={inputStyle} placeholder="e.g. 10-15 min" />
      </div>
      <ListField label="Steps" items={activity.steps || []} onChange={v => set('steps', v)} placeholder="Step description" />
    </div>
  )
}

// ── Module editor (full-width in-panel view) ────────────────────────────────

function ModuleEditor({ section, module: initialModule, onBack }) {
  const [module, setModule] = useState(initialModule)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ageBands, setAgeBands] = useState([])

  // Metadata form
  const [title, setTitle] = useState('')
  const [points, setPoints] = useState('')
  const [ageIndex, setAgeIndex] = useState(0)
  const [isPremium, setIsPremium] = useState(false)
  const [savingMeta, setSavingMeta] = useState(false)
  const [metaError, setMetaError] = useState('')

  // Content form
  const [slides, setSlides] = useState([])
  const [quiz, setQuiz] = useState([])
  const [activities, setActivities] = useState([])
  const [bookAuthor, setBookAuthor] = useState('')
  const [bookDescription, setBookDescription] = useState('')
  const [bookCoverEmoji, setBookCoverEmoji] = useState('📖')
  const [previewIndex, setPreviewIndex] = useState(0)
  const [savingContent, setSavingContent] = useState(false)
  const [contentError, setContentError] = useState('')
  const [contentSaved, setContentSaved] = useState(false)

  const [statusBusy, setStatusBusy] = useState(false)

  useEffect(() => {
    api.adminContentAgeBands(section).then(setAgeBands).catch(() => {})
  }, [section])

  useEffect(() => {
    setLoading(true)
    api.adminGetContentModule(initialModule.id).then(full => {
      setModule(full)
      setTitle(full.title)
      setPoints(full.points)
      setIsPremium(full.isPremium)
      setSlides(full.content?.slides || [])
      setQuiz(full.content?.quiz || [])
      setActivities(full.content?.activities || [])
      setBookAuthor(full.content?.author || '')
      setBookDescription(full.content?.description || '')
      setBookCoverEmoji(full.content?.coverEmoji || '📖')
    }).catch(err => setError(err.message)).finally(() => setLoading(false))
  }, [initialModule.id])

  useEffect(() => {
    const i = ageBands.findIndex(b => b.ageMin === module.ageMin && b.ageMax === module.ageMax)
    if (i >= 0) setAgeIndex(i)
  }, [ageBands, module.ageMin, module.ageMax])

  async function handleSaveMeta(e) {
    e.preventDefault()
    setSavingMeta(true)
    setMetaError('')
    try {
      const band = ageBands[ageIndex]
      const updated = await api.adminUpdateContentModule(module.id, {
        title, points: Number(points), ageMin: band?.ageMin ?? module.ageMin, ageMax: band?.ageMax ?? module.ageMax,
        isPremium,
      })
      setModule(m => ({ ...m, ...updated }))
    } catch (err) {
      setMetaError(err.message)
    } finally {
      setSavingMeta(false)
    }
  }

  async function handleSaveContent() {
    setSavingContent(true)
    setContentError('')
    setContentSaved(false)
    try {
      const content = section === 'quest' ? { activities }
        : section === 'reading-log' ? { author: bookAuthor, description: bookDescription, coverEmoji: bookCoverEmoji }
        : { slides, quiz }
      const updated = await api.adminUpdateModuleContent(module.id, content)
      setModule(m => ({ ...m, content: updated.content }))
      setContentSaved(true)
    } catch (err) {
      setContentError(err.message)
    } finally {
      setSavingContent(false)
    }
  }

  async function handleStatusToggle() {
    setStatusBusy(true)
    try {
      const next = module.status === 'published' ? 'draft' : 'published'
      const updated = await api.adminUpdateModuleStatus(module.id, next)
      setModule(m => ({ ...m, status: updated.status }))
    } catch (err) {
      alert(err.message)
    } finally {
      setStatusBusy(false)
    }
  }

  function moveItem(list, setList, i, dir) {
    const j = i + dir
    if (j < 0 || j >= list.length) return
    const next = [...list]
    ;[next[i], next[j]] = [next[j], next[i]]
    setList(next)
    if (setList === setSlides) setPreviewIndex(j)
  }

  if (loading) return <div className="loading-text">Loading module...</div>
  if (error) return <div className="error-msg">{error}</div>

  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', marginBottom: 14, padding: 0 }}>← Back to Modules</button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{module.id}</div>
          <StatusBadge status={module.status} />
        </div>
        <button onClick={handleStatusToggle} disabled={statusBusy} style={{ ...primaryBtnStyle, opacity: statusBusy ? 0.7 : 1 }}>
          {module.status === 'published' ? 'Unpublish' : 'Publish'}
        </button>
      </div>

      {/* Metadata */}
      <form onSubmit={handleSaveMeta} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 18px', marginBottom: 20, background: '#f8fafc' }}>
        {metaError && <div style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: '0.83rem' }}>{metaError}</div>}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: 160 }}>
            <label style={labelStyle}>Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} required />
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <label style={labelStyle}>Age band</label>
            <select value={ageIndex} onChange={e => setAgeIndex(Number(e.target.value))} style={inputStyle}>
              {ageBands.map((b, i) => <option key={i} value={i}>Ages {b.ageMin}–{b.ageMax}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 90 }}>
            <label style={labelStyle}>Points</label>
            <input type="number" min="1" value={points} onChange={e => setPoints(e.target.value)} style={inputStyle} required />
          </div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', color: '#374151', marginBottom: 12, cursor: 'pointer' }}>
          <input type="checkbox" checked={isPremium} onChange={e => setIsPremium(e.target.checked)} /> 💎 Premium content
        </label>
        <button type="submit" disabled={savingMeta} style={{ ...editBtnStyle, opacity: savingMeta ? 0.7 : 1 }}>{savingMeta ? 'Saving…' : 'Save Details'}</button>
      </form>

      {/* Content */}
      {section === 'quest' ? (
        <div>
          <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>Activities</div>
          {activities.map((a, i) => (
            <ActivityEditorCard
              key={i} activity={a} index={i} total={activities.length}
              onChange={next => setActivities(list => list.map((x, idx) => idx === i ? next : x))}
              onRemove={() => setActivities(list => list.filter((_, idx) => idx !== i))}
              onMove={dir => moveItem(activities, setActivities, i, dir)}
            />
          ))}
          <button type="button" onClick={() => setActivities(list => [...list, { emoji: '🧩', title: '', description: '', example: '', materials: [], duration: '', steps: [] }])} style={{ ...editBtnStyle, marginBottom: 20 }}>+ Add activity</button>
        </div>
      ) : section === 'reading-log' ? (
        <div style={{ maxWidth: 420 }}>
          <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>Book details</div>
          <label style={labelStyle}>Cover emoji</label>
          <input value={bookCoverEmoji} onChange={e => setBookCoverEmoji(e.target.value)} style={{ ...inputStyle, marginBottom: 12, maxWidth: 80 }} />
          <label style={labelStyle}>Author</label>
          <input value={bookAuthor} onChange={e => setBookAuthor(e.target.value)} style={{ ...inputStyle, marginBottom: 12 }} />
          <label style={labelStyle}>Description</label>
          <textarea value={bookDescription} onChange={e => setBookDescription(e.target.value)} rows={4} style={{ ...inputStyle, marginBottom: 12, resize: 'vertical' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(260px, 340px)', gap: 20, alignItems: 'start' }}>
          <div>
            <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>Slides</div>
            {slides.map((s, i) => (
              <SlideEditorCard
                key={i} slide={s} index={i} total={slides.length} isPreviewing={previewIndex === i}
                onChange={next => setSlides(list => list.map((x, idx) => idx === i ? next : x))}
                onRemove={() => setSlides(list => list.filter((_, idx) => idx !== i))}
                onMove={dir => moveItem(slides, setSlides, i, dir)}
                onPreview={() => setPreviewIndex(i)}
              />
            ))}
            <button type="button" onClick={() => setSlides(list => [...list, { emoji: '🙂', title: '', text: '' }])} style={{ ...editBtnStyle, marginBottom: 24 }}>+ Add slide</button>

            <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>Quiz</div>
            {quiz.map((q, i) => (
              <QuizEditorCard
                key={i} q={q} index={i} total={quiz.length}
                onChange={next => setQuiz(list => list.map((x, idx) => idx === i ? next : x))}
                onRemove={() => setQuiz(list => list.filter((_, idx) => idx !== i))}
                onMove={dir => moveItem(quiz, setQuiz, i, dir)}
              />
            ))}
            <button type="button" onClick={() => setQuiz(list => [...list, { question: '', choices: ['', ''], correctIndex: 0, explanation: '' }])} style={editBtnStyle}>+ Add question</button>
          </div>

          {/* Live preview */}
          <div style={{ position: 'sticky', top: 16 }}>
            <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 10, fontSize: '0.85rem' }}>Live preview</div>
            <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 16, padding: '28px 20px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', minHeight: 200 }}>
              {slides[previewIndex] ? <SlideCard slide={slides[previewIndex]} onResult={() => {}} /> : <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No slides yet</div>}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        {contentError && <div style={{ color: '#dc2626', fontSize: '0.83rem' }}>{contentError}</div>}
        {contentSaved && !contentError && <div style={{ color: '#166534', fontSize: '0.83rem' }}>Saved ✓</div>}
        <button onClick={handleSaveContent} disabled={savingContent} style={{ ...primaryBtnStyle, opacity: savingContent ? 0.7 : 1 }}>
          {savingContent ? 'Saving…' : 'Save Content'}
        </button>
      </div>
    </div>
  )
}

// ── Top-level panel ──────────────────────────────────────────────────────────

export default function AdminContentPanel() {
  const [searchParams, setSearchParams] = useSearchParams()
  const section = searchParams.get('csection') || 'future-ready'
  const [topic, setTopic] = useState(null)
  const [moduleRow, setModuleRow] = useState(null)

  function openSection(s) {
    setTopic(null); setModuleRow(null)
    const next = new URLSearchParams(searchParams)
    next.set('view', 'content'); next.set('csection', s)
    setSearchParams(next)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 18, background: '#f1f5f9', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[{ id: 'future-ready', label: '🚀 Future-Ready' }, { id: 'quest', label: '🧸 Quests' }, { id: 'reading-log', label: '📖 Reading Log' }].map(s => (
          <button
            key={s.id}
            onClick={() => openSection(s.id)}
            style={{
              padding: '8px 16px', borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
              background: section === s.id ? '#fff' : 'transparent', color: section === s.id ? '#0d9488' : '#64748b',
              boxShadow: section === s.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {moduleRow ? (
        <ModuleEditor section={section} module={moduleRow} onBack={() => setModuleRow(null)} />
      ) : topic ? (
        <ModuleList section={section} topic={topic} onBack={() => setTopic(null)} onOpenModule={setModuleRow} />
      ) : (
        <TopicList section={section} onOpenTopic={setTopic} />
      )}
    </div>
  )
}
