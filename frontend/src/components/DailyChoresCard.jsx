import { useState, useEffect, useCallback } from 'react'
import { api } from '../api.js'

const MAX_ITEMS = 10

// ─── Shared section tile ──────────────────────────────────────────────────────
// Collapsed: a square tile (icon, title, status badges), consistent with the
// home-screen nav tiles. Expanded: spreads to the full grid row width and
// shows its content below the header -- an accordion that lives in a grid.
export function SectionTile({ icon, iconColor = '#0d9488', title, badges = [], expanded, onToggle, headerExtra, children }) {
  return (
    <div
      style={{
        gridColumn: expanded ? '1 / -1' : undefined,
        background: '#fff', border: '1px solid #99f6e4', borderRadius: 18,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden',
      }}
    >
      <div
        role="button" tabIndex={0}
        onClick={onToggle}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onToggle()}
        style={{
          display: 'flex', cursor: 'pointer', userSelect: 'none',
          flexDirection: expanded ? 'row' : 'column',
          alignItems: 'center',
          textAlign: expanded ? 'left' : 'center',
          gap: expanded ? 14 : 0,
          padding: expanded ? '16px 20px' : '22px 14px',
        }}
      >
        <span style={{
          width: expanded ? 44 : 56, height: expanded ? 44 : 56, borderRadius: '50%',
          background: iconColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: expanded ? '1.3rem' : '1.6rem', marginBottom: expanded ? 0 : 10,
          boxShadow: `0 4px 10px ${iconColor}55`, flexShrink: 0, transition: 'all 0.15s',
        }}>
          {icon}
        </span>
        <span style={{ flex: expanded ? 1 : undefined, minWidth: 0 }}>
          <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.95rem' }}>{title}</div>
          {badges.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: expanded ? 'flex-start' : 'center', marginTop: 6 }}>
              {badges}
            </div>
          )}
        </span>
        {headerExtra && <span onClick={e => e.stopPropagation()}>{headerExtra}</span>}
        <span style={{ color: '#94a3b8', fontSize: '0.85rem', flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && <div style={{ padding: '0 20px 20px' }}>{children}</div>}
    </div>
  )
}

function Badge({ text, bg, color }) {
  return (
    <span style={{ fontSize: '0.75rem', fontWeight: 700, color, background: bg, borderRadius: 999, padding: '2px 9px' }}>
      {text}
    </span>
  )
}

export function DailyChoresCard({ kid, isGuardian, onWalletChange }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [savingSettings, setSavingSettings] = useState(false)

  const [newTitle, setNewTitle] = useState('')
  const [newEmoji, setNewEmoji] = useState('✅')
  const [newPoints, setNewPoints] = useState('2')
  const [addError, setAddError] = useState('')
  const [adding, setAdding] = useState(false)
  const [templates, setTemplates] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.getDailyChores(isGuardian ? kid.id : undefined)
      setData(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [kid.id, isGuardian])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (isGuardian && editMode && templates === null) {
      api.getDailyChoreTemplates().then(setTemplates).catch(() => setTemplates([]))
    }
  }, [isGuardian, editMode, templates])

  function applyTemplate(title, emoji) {
    setNewTitle(title)
    setNewEmoji(emoji)
  }

  function applyResult(item, newBalance) {
    setData(d => ({ ...d, items: d.items.map(i => i.id === item.id ? item : i) }))
    if (newBalance !== undefined) onWalletChange && onWalletChange(newBalance)
  }

  async function handleToggle(item) {
    setBusyId(item.id)
    try {
      const res = await api.toggleDailyChore(item.id)
      applyResult(res.item, res.newBalance)
    } catch (err) {
      alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleApprove(item) {
    setBusyId(item.id)
    try {
      const res = await api.approveDailyChore(item.id)
      applyResult(res.item, res.newBalance)
    } catch (err) {
      alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleReject(item) {
    setBusyId(item.id)
    try {
      const res = await api.rejectDailyChore(item.id)
      applyResult(res.item)
    } catch (err) {
      alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!newTitle.trim()) { setAddError('Title is required.'); return }
    setAdding(true)
    setAddError('')
    try {
      await api.addDailyChore({ kidId: kid.id, title: newTitle.trim(), points: Number(newPoints) || 0, imageEmoji: newEmoji || '✅' })
      setNewTitle(''); setNewEmoji('✅'); setNewPoints('2')
      load()
    } catch (err) {
      setAddError(err.message)
    } finally {
      setAdding(false)
    }
  }

  async function handleEditPoints(item, points) {
    setData(d => ({ ...d, items: d.items.map(i => i.id === item.id ? { ...i, points } : i) }))
    try {
      await api.updateDailyChore(item.id, { points })
    } catch (err) {
      alert(err.message)
      load()
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Remove "${item.title}" from Daily Chores?`)) return
    try {
      await api.deleteDailyChore(item.id)
      load()
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleToggleDeduction() {
    setSavingSettings(true)
    try {
      await api.updateDailyChoreSettings(kid.id, !data.deductionEnabled)
      setData(d => ({ ...d, deductionEnabled: !d.deductionEnabled }))
    } catch (err) {
      alert(err.message)
    } finally {
      setSavingSettings(false)
    }
  }

  async function handleRegenerate() {
    if (!window.confirm(`Replace ${kid.name || 'their'} Daily Chores with a fresh age-based list? This removes all current items.`)) return
    try {
      await api.regenerateDailyChores(kid.id)
      load()
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <div className="form-card"><div className="loading-text">Loading Daily Chores...</div></div>
  if (error) return (
    <div className="form-card">
      <div className="error-msg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <span>📅 Daily Chores failed to load: {error}</span>
        <button type="button" className="btn btn-outline btn-sm" onClick={load}>↻ Retry</button>
      </div>
    </div>
  )
  if (!data) return null

  const doneCount = data.items.filter(i => i.status === 'complete').length
  const pendingCount = data.items.filter(i => i.status === 'pending').length
  const atRiskPoints = data.items.filter(i => i.status === 'open').reduce((sum, i) => sum + i.points, 0)

  const badges = [
    <Badge key="count" text={`${doneCount}/${data.items.length} today`} bg="#ccfbf1" color="#0d9488" />,
    pendingCount > 0 && <Badge key="pending" text={`⏳ ${pendingCount} awaiting approval`} bg="#fed7aa" color="#c2410c" />,
    data.deductionEnabled && atRiskPoints > 0 && (
      <Badge key="risk" text={`⚠️ -${atRiskPoints} pts if not done today`} bg="#fee2e2" color="#b91c1c" />
    ),
  ].filter(Boolean)

  return (
    <SectionTile
      icon="📅"
      iconColor="#0d9488"
      title={`Daily Chores${isGuardian && kid.name ? ` — ${kid.name}` : ''}`}
      badges={badges}
      expanded={expanded}
      onToggle={() => setExpanded(v => !v)}
      headerExtra={isGuardian && (
        <button
          type="button" className="btn btn-outline btn-sm"
          onClick={() => {
            setEditMode(v => {
              const next = !v
              if (next) setExpanded(true)
              return next
            })
          }}
        >
          {editMode ? 'Done Editing' : '✏️ Edit'}
        </button>
      )}
    >
      <div>
          {isGuardian && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#334155', fontWeight: 600, cursor: 'pointer', marginBottom: 14, background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 8, padding: '8px 12px' }}>
              <input type="checkbox" checked={data.deductionEnabled} disabled={savingSettings} onChange={handleToggleDeduction} />
              Deduct points for chores not completed by end of day
            </label>
          )}

          {isGuardian && editMode && (
            <div style={{ marginBottom: 16, borderBottom: '1px dashed #cbd5e1', paddingBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={handleRegenerate}>🔄 Reset to suggested list</button>
              </div>

              {data.items.length < MAX_ITEMS ? (
                <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  {addError && <div className="error-msg" style={{ flexBasis: '100%' }}>{addError}</div>}
                  <div className="form-group" style={{ flex: '100%' }}>
                    <label>Start from a template <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '0.8rem' }}>(optional)</span></label>
                    <select
                      value=""
                      onChange={e => {
                        const [title, emoji] = e.target.value.split('|')
                        if (title) applyTemplate(title, emoji)
                      }}
                    >
                      <option value="">— Pick a sample daily chore to pre-fill the form —</option>
                      {(templates || []).map(band => (
                        <optgroup key={band.label} label={band.label}>
                          {band.items.map(s => (
                            <option key={s.title} value={`${s.title}|${s.imageEmoji}`}>{s.imageEmoji} {s.title}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: '2 1 160px' }}>
                    <label>Chore title</label>
                    <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Brush teeth" />
                  </div>
                  <div className="form-group" style={{ flex: '0 0 64px' }}>
                    <label>Emoji</label>
                    <input value={newEmoji} onChange={e => setNewEmoji(e.target.value)} style={{ textAlign: 'center' }} />
                  </div>
                  <div className="form-group" style={{ flex: '0 0 72px' }}>
                    <label>Points</label>
                    <input type="number" min="0" value={newPoints} onChange={e => setNewPoints(e.target.value)} />
                  </div>
                  <button type="submit" className="btn btn-green btn-sm" disabled={adding}>{adding ? 'Adding...' : '+ Add'}</button>
                </form>
              ) : (
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Maximum of {MAX_ITEMS} daily chores reached.</div>
              )}
            </div>
          )}

          {data.items.length === 0 ? (
            <div className="empty-text">No daily chores yet.{isGuardian && ' Add one below.'}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.items.map(item => {
                const isPending = item.status === 'pending'
                const isComplete = item.status === 'complete'
                const showApprovalButtons = isGuardian && !editMode && isPending
                const checkboxChecked = isComplete || (isPending && !isGuardian)
                const checkboxDisabled = busyId === item.id || (isGuardian && editMode) || (isGuardian && isPending) || (!isGuardian && isComplete)
                return (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: `1px solid ${isPending ? '#fed7aa' : '#e2e8f0'}`, borderRadius: 10, padding: '10px 14px' }}>
                    {showApprovalButtons ? (
                      <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>⏳</span>
                    ) : (
                      <input
                        type="checkbox"
                        checked={checkboxChecked}
                        disabled={checkboxDisabled}
                        onChange={() => handleToggle(item)}
                        style={{ width: 20, height: 20, accentColor: isPending ? '#ea580c' : '#0d9488', cursor: checkboxDisabled ? 'default' : 'pointer', flexShrink: 0 }}
                      />
                    )}
                    <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{item.imageEmoji}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 600, color: isComplete ? '#94a3b8' : '#1e293b', textDecoration: isComplete ? 'line-through' : 'none' }}>
                        {item.title}
                      </span>
                      {isPending && !isGuardian && (
                        <span style={{ display: 'block', fontSize: '0.72rem', color: '#c2410c', fontWeight: 700 }}>⏳ Waiting for approval</span>
                      )}
                    </span>
                    {isGuardian && editMode ? (
                      <>
                        <input
                          type="number" min="0" value={item.points}
                          onChange={e => handleEditPoints(item, Number(e.target.value))}
                          style={{ width: 56, padding: '4px 6px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                        />
                        <button type="button" className="btn btn-red btn-sm" onClick={() => handleDelete(item)}>✕</button>
                      </>
                    ) : showApprovalButtons ? (
                      <>
                        <button type="button" className="btn btn-green btn-sm" disabled={busyId === item.id} onClick={() => handleApprove(item)}>✓ Approve</button>
                        <button type="button" className="btn btn-red btn-sm" disabled={busyId === item.id} onClick={() => handleReject(item)}>✕ Reject</button>
                      </>
                    ) : (
                      <span className="points-badge">{item.points} pts</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
      </div>
    </SectionTile>
  )
}
