import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api.js'
import Toggle from '../futureready/Toggle.jsx'
import PremiumUpsellModal from '../components/PremiumUpsellModal.jsx'
import QuestView from './QuestView.jsx'
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

export default function GuardianQuestsTab({ onDetailChange } = {}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [modules, setModules] = useState([])
  const [kids, setKids] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)
  const [openCategory, setOpenCategory] = useState(null)
  const [previewModuleId, setPreviewModuleId] = useState(null)
  const [isSubscribed, setIsSubscribed] = useState(true) // optimistic until loaded -- avoids a flash of "locked" UI for premium families
  const [upsellModule, setUpsellModule] = useState(null)
  const previewModule = previewModuleId ? modules.find(m => m.id === previewModuleId) || null : null

  const loadModules = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getQuests()
      setModules(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadModules() }, [loadModules])
  useEffect(() => { api.getKids().then(setKids).catch(() => {}) }, [])
  useEffect(() => { api.getBillingStatus().then(s => setIsSubscribed(!!s.isPremium)).catch(() => {}) }, [])

  function goToPremiumPlans() {
    setUpsellModule(null)
    const next = new URLSearchParams(searchParams)
    next.set('tab', 'premium')
    setSearchParams(next)
  }

  // QuestView renders its own "← Back" header -- tell GuardianLearnGrowTab
  // to hide its own back button while a preview is open, so there's never
  // two stacked back buttons on screen at once.
  useEffect(() => { onDetailChange && onDetailChange(!!previewModule) }, [previewModule, onDetailChange])

  async function handleToggle(module) {
    const enabled = !module.enabled
    if (enabled && module.isPremium && !isSubscribed) {
      setUpsellModule(module)
      return
    }
    setSavingId(module.id)
    setError('')
    try {
      await api.setQuestVisibility(module.id, enabled, module.enabledKidIds ?? null)
      setModules(ms => ms.map(m => m.id === module.id ? { ...m, enabled } : m))
    } catch (err) {
      if (err.code === 'premium_required') setUpsellModule(module)
      else setError(err.message)
    } finally {
      setSavingId(null)
    }
  }

  async function handleKidsChange(module, kidIds) {
    setSavingId(module.id)
    setError('')
    try {
      await api.setQuestVisibility(module.id, true, kidIds)
      setModules(ms => ms.map(m => m.id === module.id ? { ...m, enabledKidIds: kidIds } : m))
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingId(null)
    }
  }

  async function handleRedo(module, activityIndex, kidId, completion) {
    const activityTitle = module.activityTitles?.[activityIndex] || module.title
    if (!window.confirm(`Let ${completion.kidName} try "${activityTitle}" again? They'll be able to earn points for it again.`)) return
    setSavingId(module.id)
    setError('')
    try {
      await api.resetQuestCompletion(module.id, kidId, activityIndex)
      await loadModules()
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setSavingId(null)
    }
  }

  async function handleAward(module, activityIndex, kidId) {
    setSavingId(module.id)
    setError('')
    try {
      await api.awardQuestActivity(module.id, kidId, activityIndex)
      await loadModules()
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setSavingId(null)
    }
  }

  async function handleApproveLog(module, log) {
    setSavingId(module.id)
    setError('')
    try {
      await api.approveQuestLog(log.id)
      await loadModules()
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setSavingId(null)
    }
  }

  async function handleRejectLog(module, log) {
    setSavingId(module.id)
    setError('')
    try {
      await api.rejectQuestLog(log.id)
      await loadModules()
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setSavingId(null)
    }
  }

  async function handlePointsChange(module, points) {
    setSavingId(module.id)
    setError('')
    try {
      await api.setQuestPoints(module.id, points)
      setModules(ms => ms.map(m => m.id === module.id ? { ...m, points } : m))
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingId(null)
    }
  }

  if (loading) return <div className="loading-text">Loading Quests…</div>

  if (previewModule) {
    return (
      <QuestView
        module={previewModule}
        onExit={() => setPreviewModuleId(null)}
        guardianMode
        kids={kids}
        onAward={(activityIndex, kidId) => handleAward(previewModule, activityIndex, kidId)}
        onApproveLog={log => handleApproveLog(previewModule, log)}
        onRejectLog={log => handleRejectLog(previewModule, log)}
        onRedo={(activityIndex, kidId, completion) => handleRedo(previewModule, activityIndex, kidId, completion)}
      />
    )
  }

  const categories = groupByCategory(modules)

  return (
    <div>
      <h3 style={{ color: '#334155', margin: '0 0 6px' }}>🧸 Quests</h3>
      <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 10, padding: '10px 14px', marginBottom: 18, color: '#0f766e', fontSize: '0.85rem' }}>
        Simple, age-appropriate activities you can try with your kids -- no screens required. Turn on the quests you want available, then open one to give points directly or review what a kid sent in.
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}

      {categories.length === 0 ? (
        <div className="empty-text">No quests available yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {categories.map((category, catIndex) => {
            const meta = categoryMeta(category.category)
            const enabledCount = category.modules.filter(m => m.enabled).length
            const categoryIsNew = category.modules.some(m => m.isNew)
            const pendingCount = category.modules.reduce(
              (n, m) => n + (m.activityPendingLogs || []).reduce((s, logs) => s + (logs?.length || 0), 0), 0
            )
            const isOpen = openCategory === category.category
            return (
              <div
                key={category.category}
                className="pop-in"
                style={{ border: `1px solid ${meta.border}`, borderRadius: 16, overflow: 'hidden', background: '#fff', animationDelay: `${catIndex * 0.06}s`, animationFillMode: 'backwards' }}
              >
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
                    {category.modules.map(m => {
                      const modulePendingCount = (m.activityPendingLogs || []).reduce((s, logs) => s + (logs?.length || 0), 0)
                      return (
                      <div
                        key={m.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                          borderTop: '1px solid #f1f5f9', flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, width: '100%' }}>
                          <div style={{ minWidth: 90 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>
                              {m.title}
                              {m.isNew && <NewBadge />}
                              {m.isPremium && <span title="Premium — requires an active subscription">💎</span>}
                            </div>
                            {m.activityCount > 1 && (
                              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{m.activityCount} activities</div>
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 160 }}>
                            <PointsEditor
                              points={m.points}
                              disabled={savingId === m.id}
                              onSave={(pts) => handlePointsChange(m, pts)}
                            />
                            {m.activityCount > 1 && (
                              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>
                                total, split across {m.activityCount} activities unless one has its own points set
                              </div>
                            )}
                          </div>
                          {modulePendingCount > 0 && (
                            <span style={{
                              fontSize: '0.72rem', fontWeight: 700, borderRadius: 999, padding: '3px 9px', flexShrink: 0,
                              background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a',
                            }}>
                              ⏳ {modulePendingCount}
                            </span>
                          )}
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => setPreviewModuleId(m.id)}
                          >
                            🎯 Open
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
                        </div>
                      </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {upsellModule && (
        <PremiumUpsellModal
          topicTitle={upsellModule.categoryTitle}
          moduleTitle={upsellModule.title}
          activityCount={upsellModule.activityCount}
          onViewPlans={goToPremiumPlans}
          onClose={() => setUpsellModule(null)}
        />
      )}
    </div>
  )
}
