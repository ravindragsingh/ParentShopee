import { useState, useEffect, useCallback } from 'react'
import { api } from '../api.js'
import LessonModule from './LessonModule.jsx'
import Toggle from './Toggle.jsx'
import { topicMeta } from './topicMeta.js'

function groupByTopic(modules) {
  const byTopic = new Map()
  for (const m of modules) {
    if (!byTopic.has(m.topic)) byTopic.set(m.topic, { topic: m.topic, title: m.topicTitle, emoji: m.topicEmoji, modules: [] })
    byTopic.get(m.topic).modules.push(m)
  }
  return [...byTopic.values()]
}

// Editable point value for one age band -- commits on blur or Enter, and
// only if it actually changed to something valid. Kids' tiles read this
// same value, so tuning it here is the one place a guardian controls how
// many points a lesson is worth.
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

export default function GuardianFutureReadyTab() {
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)
  const [openTopic, setOpenTopic] = useState(null)
  const [previewModule, setPreviewModule] = useState(null)

  const loadModules = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getFutureReadyModules()
      setModules(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadModules() }, [loadModules])

  async function handleToggle(module) {
    setSavingId(module.id)
    setError('')
    try {
      await api.setLearningVisibility(module.id, !module.enabled)
      setModules(ms => ms.map(m => m.id === module.id ? { ...m, enabled: !m.enabled } : m))
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
      await api.setLearningPoints(module.id, points)
      setModules(ms => ms.map(m => m.id === module.id ? { ...m, points } : m))
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingId(null)
    }
  }

  if (previewModule) {
    return (
      <LessonModule
        module={previewModule}
        subtitle={`${previewModule.topicTitle} · ${previewModule.title}`}
        onExit={() => setPreviewModule(null)}
        previewMode
      />
    )
  }

  if (loading) return <div className="loading-text">Loading Future-Ready…</div>

  const topics = groupByTopic(modules)

  return (
    <div>
      <h3 style={{ color: '#334155', margin: '0 0 6px' }}>🚀 Future-Ready</h3>
      <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 10, padding: '10px 14px', marginBottom: 18, color: '#0f766e', fontSize: '0.85rem' }}>
        Short, interactive lessons that build real-world skills. Turn on the age bands you want available and set how many points each one earns — every kid automatically sees the band that matches their own age, with no age picking on their end. Preview any lesson yourself first.
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}

      {topics.length === 0 ? (
        <div className="empty-text">No lessons available yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {topics.map(topic => {
            const meta = topicMeta(topic.topic)
            const enabledCount = topic.modules.filter(m => m.enabled).length
            const isOpen = openTopic === topic.topic
            return (
              <div key={topic.topic} style={{ border: `1px solid ${meta.border}`, borderRadius: 16, overflow: 'hidden', background: '#fff' }}>
                <button
                  onClick={() => setOpenTopic(t => t === topic.topic ? null : topic.topic)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                    background: meta.bg, border: 'none', padding: '14px 18px', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, background: '#fff', border: `1px solid ${meta.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0,
                  }}>
                    {topic.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem' }}>{topic.title}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{meta.description}</div>
                  </div>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 700, borderRadius: 999, padding: '4px 10px', flexShrink: 0,
                    background: '#fff', color: meta.color, border: `1px solid ${meta.border}`,
                  }}>
                    {enabledCount}/{topic.modules.length} on
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: '1.1rem', flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                  <div style={{ padding: '4px 18px 16px' }}>
                    {topic.modules.map(m => (
                      <div
                        key={m.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                          borderTop: '1px solid #f1f5f9', flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ minWidth: 90 }}>
                          <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>{m.title}</div>
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
