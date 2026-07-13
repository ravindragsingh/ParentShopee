import { useState, useEffect, useCallback } from 'react'
import { api } from '../api.js'

const MAX_ITEMS = 10

export function DailyChoresCard({ kid, isParent, onWalletChange }) {
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

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.getDailyChores(isParent ? kid.id : undefined)
      setData(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [kid.id, isParent])

  useEffect(() => { load() }, [load])

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

  return (
    <div className="form-card" style={{ border: '1.5px solid #99f6e4', background: 'linear-gradient(135deg, #f0fdfa, #ffffff)' }}>
      <div
        role="button" tabIndex={0}
        onClick={() => setExpanded(v => !v)}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setExpanded(v => !v)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
      >
        <span className="form-title" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          📅 Daily Chores{isParent && kid.name && <> — {kid.name}</>}
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0d9488', background: '#ccfbf1', borderRadius: 999, padding: '2px 10px' }}>
            {doneCount}/{data.items.length} today
          </span>
          {pendingCount > 0 && (
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#c2410c', background: '#fed7aa', borderRadius: 999, padding: '2px 10px' }}>
              ⏳ {pendingCount} awaiting approval
            </span>
          )}
        </span>
        <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {isParent && (
            <button
              type="button" className="btn btn-outline btn-sm"
              onClick={e => { e.stopPropagation(); setEditMode(v => !v) }}
            >
              {editMode ? 'Done Editing' : '✏️ Edit'}
            </button>
          )}
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{expanded ? '▲' : '▼'}</span>
        </span>
      </div>

      {expanded && (
        <div style={{ marginTop: 14 }}>
          {data.items.length === 0 ? (
            <div className="empty-text">No daily chores yet.{isParent && ' Add one below.'}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.items.map(item => {
                const isPending = item.status === 'pending'
                const isComplete = item.status === 'complete'
                const showApprovalButtons = isParent && !editMode && isPending
                const checkboxChecked = isComplete || (isPending && !isParent)
                const checkboxDisabled = busyId === item.id || (isParent && editMode) || (isParent && isPending) || (!isParent && isComplete)
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
                      {isPending && !isParent && (
                        <span style={{ display: 'block', fontSize: '0.72rem', color: '#c2410c', fontWeight: 700 }}>⏳ Waiting for approval</span>
                      )}
                    </span>
                    {isParent && editMode ? (
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

          {isParent && editMode && (
            <div style={{ marginTop: 16, borderTop: '1px dashed #cbd5e1', paddingTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#334155', fontWeight: 600, cursor: 'pointer' }}>
                  <input type="checkbox" checked={data.deductionEnabled} disabled={savingSettings} onChange={handleToggleDeduction} />
                  Deduct points for chores not completed by end of day
                </label>
                <button type="button" className="btn btn-outline btn-sm" onClick={handleRegenerate}>🔄 Reset to suggested list</button>
              </div>

              {data.items.length < MAX_ITEMS ? (
                <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  {addError && <div className="error-msg" style={{ flexBasis: '100%' }}>{addError}</div>}
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
        </div>
      )}
    </div>
  )
}
