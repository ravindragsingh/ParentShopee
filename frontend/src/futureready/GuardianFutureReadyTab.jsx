import { useState, useEffect, useCallback } from 'react'
import { api } from '../api.js'
import LessonModule from './LessonModule.jsx'

function groupByTopic(modules) {
  const byTopic = new Map()
  for (const m of modules) {
    if (!byTopic.has(m.topic)) byTopic.set(m.topic, { topic: m.topic, title: m.topicTitle, emoji: m.topicEmoji, modules: [] })
    byTopic.get(m.topic).modules.push(m)
  }
  return [...byTopic.values()]
}

export default function GuardianFutureReadyTab() {
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)
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

  if (previewModule) {
    return (
      <div>
        <LessonModule module={previewModule} onExit={() => setPreviewModule(null)} previewMode />
      </div>
    )
  }

  if (loading) return <div className="loading-text">Loading Future-Ready…</div>

  const topics = groupByTopic(modules)

  return (
    <div>
      <h3 style={{ color: '#334155', margin: '0 0 6px' }}>🚀 Future-Ready</h3>
      <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#0f766e', fontSize: '0.85rem' }}>
        Short, interactive lessons that build real-world skills like investing. Turn on the age-appropriate ones for your kids — nothing shows up for them until you enable it here. Preview any lesson yourself first.
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}

      {topics.length === 0 ? (
        <div className="empty-text">No lessons available yet.</div>
      ) : (
        topics.map(topic => (
          <div key={topic.topic} style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: '1.4rem' }}>{topic.emoji}</span>
              <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.05rem' }}>{topic.title}</span>
            </div>
            <div className="shop-grid">
              {topic.modules.map(m => (
                <div key={m.id} className="shop-item-card">
                  <div className="shop-emoji">📘</div>
                  <div className="shop-name">{m.title}</div>
                  <div className="shop-cost">Earns {m.points} pts on completion</div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#334155', fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>
                    <input
                      type="checkbox"
                      checked={!!m.enabled}
                      disabled={savingId === m.id}
                      onChange={() => handleToggle(m)}
                      style={{ accentColor: m.enabled ? '#059669' : '#dc2626', width: 16, height: 16 }}
                    />
                    {m.enabled ? 'Visible to kids' : 'Hidden from kids'}
                  </label>
                  <button className="btn btn-sm btn-outline" style={{ marginTop: 6 }} onClick={() => setPreviewModule(m)}>
                    ▶️ Preview
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
