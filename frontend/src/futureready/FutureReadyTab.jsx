import { useState, useEffect, useCallback } from 'react'
import { api } from '../api.js'
import LessonModule from './LessonModule.jsx'

// Groups the flat module list the backend returns into topics, so a second
// topic under Future-Ready (beyond Investing for Kids) needs no UI changes --
// it just shows up as another topic card once the backend catalog grows.
function groupByTopic(modules) {
  const byTopic = new Map()
  for (const m of modules) {
    if (!byTopic.has(m.topic)) byTopic.set(m.topic, { topic: m.topic, title: m.topicTitle, emoji: m.topicEmoji, modules: [] })
    byTopic.get(m.topic).modules.push(m)
  }
  return [...byTopic.values()]
}

export default function FutureReadyTab({ onBalanceChange }) {
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openTopic, setOpenTopic] = useState(null)
  const [playingModule, setPlayingModule] = useState(null)
  const [justEarned, setJustEarned] = useState(null)

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

  function handleCompleted(points) {
    setJustEarned(points)
    onBalanceChange && onBalanceChange()
    loadModules()
    setTimeout(() => setJustEarned(null), 4000)
  }

  if (playingModule) {
    return (
      <LessonModule
        module={playingModule}
        onExit={() => setPlayingModule(null)}
        onCompleted={handleCompleted}
      />
    )
  }

  if (loading) return <div className="loading-text">Loading Future-Ready…</div>

  const topics = groupByTopic(modules)

  return (
    <div>
      <h3 style={{ color: '#334155', margin: '0 0 6px' }}>🚀 Future-Ready</h3>
      <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#0f766e', fontSize: '0.85rem' }}>
        Short, fun lessons that build real-world skills. Read through each one, take the quiz, and earn points for what you learn.
      </div>

      {justEarned !== null && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#166534', fontSize: '0.9rem', fontWeight: 700 }}>
          🎉 Nice work! You earned {justEarned} points.
        </div>
      )}

      {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}

      {topics.length === 0 ? (
        <div className="empty-text">Nothing here yet — ask your guardian to turn on a lesson for you.</div>
      ) : (
        topics.map(topic => (
          <div key={topic.topic} style={{ marginBottom: 18 }}>
            <button
              onClick={() => setOpenTopic(t => t === topic.topic ? null : topic.topic)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
                padding: '16px 18px', cursor: 'pointer', textAlign: 'left',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              }}
            >
              <span style={{ fontSize: '1.6rem' }}>{topic.emoji}</span>
              <span style={{ flex: 1, fontWeight: 800, color: '#1e293b', fontSize: '1.02rem' }}>{topic.title}</span>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700 }}>
                {topic.modules.filter(m => m.completed).length}/{topic.modules.length} done
              </span>
              <span style={{ color: '#cbd5e1', fontSize: '1.2rem' }}>{openTopic === topic.topic ? '▲' : '▼'}</span>
            </button>

            {openTopic === topic.topic && (
              <div className="shop-grid" style={{ marginTop: 12 }}>
                {topic.modules.map(m => (
                  <div key={m.id} className="shop-item-card">
                    <div className="shop-emoji">{m.completed ? '✅' : '📘'}</div>
                    <div className="shop-name">{m.title}</div>
                    <div className="shop-cost">{m.completed ? 'Completed' : `Earn ${m.points} pts`}</div>
                    <button className="btn btn-sm btn-green" style={{ marginTop: 6 }} onClick={() => setPlayingModule(m)}>
                      {m.completed ? 'Review' : 'Start ▶️'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
