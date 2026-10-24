import { useState, useEffect, useCallback } from 'react'
import { api } from '../api.js'
import Toggle from '../futureready/Toggle.jsx'
import ActivitySetView from './ActivitySetView.jsx'
import { categoryMeta } from './categoryMeta.js'

function NewBadge() {
  return (
    <span style={{
      fontSize: '0.68rem', fontWeight: 800, borderRadius: 999, padding: '2px 8px',
      background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', flexShrink: 0,
      textTransform: 'uppercase', letterSpacing: '0.03em',
    }}>
      New
    </span>
  )
}

// Same pattern as Future-Ready's KidPicker/CompletionStatus/PointsEditor
// (see GuardianFutureReadyTab.jsx) -- duplicated rather than shared since
// those aren't exported from that file and the two features' data, while
// similarly shaped, are conceptually separate catalogs.
function KidPicker({ kids, selectedIds, disabled, onChange }) {
  const isAll = selectedIds === null

  function toggle(kidId) {
    const current = isAll ? kids.map(k => k.id) : selectedIds
    const next = current.includes(kidId) ? current.filter(id => id !== kidId) : [...current, kidId]
    if (next.length === 0) return
    onChange(next.length === kids.length ? null : next)
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, width: '100%', marginTop: 2 }}>
      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>For:</span>
      {kids.map(k => {
        const checked = isAll || selectedIds.includes(k.id)
        return (
          <button
            key={k.id}
            type="button"
            disabled={disabled}
            onClick={() => toggle(k.id)}
            style={{
              fontSize: '0.74rem', fontWeight: 600, borderRadius: 999, padding: '3px 10px',
              border: `1px solid ${checked ? '#0d9488' : '#e2e8f0'}`,
              background: checked ? '#f0fdfa' : '#fff',
              color: checked ? '#0f766e' : '#94a3b8',
              cursor: disabled ? 'default' : 'pointer',
            }}
          >
            {k.avatar} {k.name}
          </button>
        )
      })}
    </div>
  )
}

function CompletionStatus({ completions, disabled, onRedo }) {
  if (!completions || completions.length === 0) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, width: '100%', marginTop: 2 }}>
      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Tried:</span>
      {completions.map(c => (
        <span
          key={c.kidId}
          style={{
            display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.74rem', fontWeight: 600,
            borderRadius: 999, padding: '3px 6px 3px 10px', background: '#f0fdf4',
            border: '1px solid #bbf7d0', color: '#166534',
          }}
        >
          ✅ {c.kidName}
          <button
            type="button"
            title={`Let ${c.kidName} try this again`}
            disabled={disabled}
            onClick={() => onRedo(c)}
            style={{
              background: 'none', border: 'none', cursor: disabled ? 'default' : 'pointer',
              fontSize: '0.85rem', color: '#166534', padding: '2px 4px', lineHeight: 1,
            }}
          >
            ↺
          </button>
        </span>
      ))}
    </div>
  )
}

// A kid's note waiting for review -- approving pays out points immediately
// (see approve_activity_log), rejecting just lets them try again and
// resubmit, same spirit as rejecting a chore back to "open".
function PendingLogReview({ logs, disabled, onApprove, onReject }) {
  if (!logs || logs.length === 0) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 4 }}>
      {logs.map(log => (
        <div key={log.id} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#92400e' }}>⏳ {log.kidName} says:</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onApprove(log)}
                className="btn btn-sm"
                style={{ background: '#16a34a', color: '#fff', border: 'none' }}
              >
                ✅ Approve
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onReject(log)}
                className="btn btn-sm btn-outline"
              >
                Try again
              </button>
            </div>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#78350f', marginTop: 6, fontStyle: 'italic' }}>"{log.note}"</div>
        </div>
      ))}
    </div>
  )
}

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
      <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>pts on completion</span>
    </div>
  )
}

function groupByCategory(modules) {
  const byCategory = new Map()
  for (const m of modules) {
    if (!byCategory.has(m.category)) byCategory.set(m.category, { category: m.category, title: m.categoryTitle, emoji: m.categoryEmoji, modules: [] })
    byCategory.get(m.category).modules.push(m)
  }
  return [...byCategory.values()]
}

export default function GuardianActivityIdeasTab() {
  const [modules, setModules] = useState([])
  const [kids, setKids] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)
  const [openCategory, setOpenCategory] = useState(null)
  const [previewModule, setPreviewModule] = useState(null)

  const loadModules = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getActivityModules()
      setModules(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadModules() }, [loadModules])
  useEffect(() => { api.getKids().then(setKids).catch(() => {}) }, [])

  async function handleToggle(module) {
    setSavingId(module.id)
    setError('')
    try {
      const enabled = !module.enabled
      await api.setActivityVisibility(module.id, enabled, module.enabledKidIds ?? null)
      setModules(ms => ms.map(m => m.id === module.id ? { ...m, enabled } : m))
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingId(null)
    }
  }

  async function handleKidsChange(module, kidIds) {
    setSavingId(module.id)
    setError('')
    try {
      await api.setActivityVisibility(module.id, true, kidIds)
      setModules(ms => ms.map(m => m.id === module.id ? { ...m, enabledKidIds: kidIds } : m))
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingId(null)
    }
  }

  async function handleRedo(module, completion) {
    if (!window.confirm(`Let ${completion.kidName} try "${module.title}" again? They'll be able to earn points for it again.`)) return
    setSavingId(module.id)
    setError('')
    try {
      await api.resetActivityCompletion(module.id, completion.kidId)
      setModules(ms => ms.map(m => m.id === module.id
        ? { ...m, completions: (m.completions ?? []).filter(c => c.kidId !== completion.kidId) }
        : m))
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingId(null)
    }
  }

  async function handleApproveLog(module, log) {
    setSavingId(module.id)
    setError('')
    try {
      await api.approveActivityLog(log.id)
      await loadModules()
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingId(null)
    }
  }

  async function handleRejectLog(module, log) {
    setSavingId(module.id)
    setError('')
    try {
      await api.rejectActivityLog(log.id)
      setModules(ms => ms.map(m => m.id === module.id
        ? { ...m, pendingLogs: (m.pendingLogs ?? []).filter(l => l.id !== log.id) }
        : m))
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingId(null)
    }
  }

  async function handlePointsChange(module, points) {
    setSavingId(module.id)
    setError('')
    try {
      await api.setActivityPoints(module.id, points)
      setModules(ms => ms.map(m => m.id === module.id ? { ...m, points } : m))
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingId(null)
    }
  }

  if (previewModule) {
    return <ActivitySetView module={previewModule} onExit={() => setPreviewModule(null)} previewMode />
  }

  if (loading) return <div className="loading-text">Loading Activity Ideas…</div>

  const categories = groupByCategory(modules)

  return (
    <div>
      <h3 style={{ color: '#334155', margin: '0 0 6px' }}>🧸 Activity Ideas</h3>
      <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 10, padding: '10px 14px', marginBottom: 18, color: '#0f766e', fontSize: '0.85rem' }}>
        Simple, age-appropriate activities you can try with your kids -- no screens required. Turn on the sets you want available and set how many points each one earns. Preview any set yourself first.
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}

      {categories.length === 0 ? (
        <div className="empty-text">No activity sets available yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {categories.map(category => {
            const meta = categoryMeta(category.category)
            const enabledCount = category.modules.filter(m => m.enabled).length
            const categoryIsNew = category.modules.some(m => m.isNew)
            const pendingCount = category.modules.reduce((n, m) => n + (m.pendingLogs?.length || 0), 0)
            const isOpen = openCategory === category.category
            return (
              <div key={category.category} style={{ border: `1px solid ${meta.border}`, borderRadius: 16, overflow: 'hidden', background: '#fff' }}>
                <button
                  onClick={() => setOpenCategory(c => c === category.category ? null : category.category)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                    background: meta.bg, border: 'none', padding: '14px 18px', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, background: '#fff', border: `1px solid ${meta.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0,
                  }}>
                    {category.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem' }}>{category.title}</span>
                      {categoryIsNew && <NewBadge />}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{meta.description}</div>
                  </div>
                  {pendingCount > 0 && (
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 700, borderRadius: 999, padding: '4px 10px', flexShrink: 0,
                      background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a',
                    }}>
                      ⏳ {pendingCount} to review
                    </span>
                  )}
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 700, borderRadius: 999, padding: '4px 10px', flexShrink: 0,
                    background: '#fff', color: meta.color, border: `1px solid ${meta.border}`,
                  }}>
                    {enabledCount}/{category.modules.length} on
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: '1.1rem', flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                  <div style={{ padding: '4px 18px 16px' }}>
                    {category.modules.map(m => (
                      <div
                        key={m.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                          borderTop: '1px solid #f1f5f9', flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ minWidth: 90 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>
                            {m.title}
                            {m.isNew && <NewBadge />}
                          </div>
                        </div>
                        <div style={{ flex: 1, minWidth: 160 }}>
                          <PointsEditor
                            points={m.points}
                            disabled={savingId === m.id}
                            onSave={(pts) => handlePointsChange(m, pts)}
                          />
                        </div>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => setPreviewModule(m)}
                        >
                          ▶️ Preview
                        </button>
                        <Toggle
                          checked={!!m.enabled}
                          disabled={savingId === m.id}
                          onChange={() => handleToggle(m)}
                          color={meta.color}
                        />
                        {m.enabled && kids.length > 1 && (
                          <KidPicker
                            kids={kids}
                            selectedIds={m.enabledKidIds ?? null}
                            disabled={savingId === m.id}
                            onChange={(kidIds) => handleKidsChange(m, kidIds)}
                          />
                        )}
                        <CompletionStatus
                          completions={m.completions}
                          disabled={savingId === m.id}
                          onRedo={(completion) => handleRedo(m, completion)}
                        />
                        <PendingLogReview
                          logs={m.pendingLogs}
                          disabled={savingId === m.id}
                          onApprove={(log) => handleApproveLog(m, log)}
                          onReject={(log) => handleRejectLog(m, log)}
                        />
                      </div>
                    ))}
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
