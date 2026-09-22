import { useState, useEffect, useCallback } from 'react'
import { api } from '../api.js'
import LessonModule from './LessonModule.jsx'
import { topicMeta } from './topicMeta.js'

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

// module.title is "Ages X–Y · Part N" when a band has more than one part,
// or just "Ages X–Y" for a single-part band -- pull out just "Part N" since
// age bands are a guardian-only concept a kid never sees.
function partLabel(title) {
  const idx = title.indexOf('·')
  return idx === -1 ? null : title.slice(idx + 1).trim()
}

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
        subtitle={partLabel(playingModule.title) ? `${playingModule.topicTitle} · ${partLabel(playingModule.title)}` : playingModule.topicTitle}
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
      <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 10, padding: '10px 14px', marginBottom: 18, color: '#0f766e', fontSize: '0.85rem' }}>
        Short, fun lessons that build real-world skills. Read through each one, take the quiz, and earn points for what you learn.
      </div>

      {justEarned !== null && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', marginBottom: 18, color: '#166534', fontSize: '0.9rem', fontWeight: 700 }}>
          🎉 Nice work! You earned {justEarned} points.
        </div>
      )}

      {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}

      {topics.length === 0 ? (
        <div className="empty-text">Nothing here yet — ask your guardian to turn on a lesson for you.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {topics.map(topic => {
            const meta = topicMeta(topic.topic)
            const topicIsNew = topic.modules.some(m => m.isNew)
            // A single-part topic behaves exactly like before: the whole
            // card is one big "Start" button straight into the lesson.
            if (topic.modules.length === 1) {
              const m = topic.modules[0]
              return (
                <TopicCard key={topic.topic} meta={meta} emoji={topic.emoji} title={topic.title} isNew={topicIsNew}>
                  <button
                    onClick={() => setPlayingModule(m)}
                    style={{
                      marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      paddingTop: 6, background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
                    }}
                  >
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 700, borderRadius: 999, padding: '4px 10px',
                      background: m.completed ? '#dcfce7' : '#fff', color: m.completed ? '#166534' : meta.color,
                      border: `1px solid ${m.completed ? '#bbf7d0' : meta.border}`,
                    }}>
                      {m.completed ? '✅ Completed' : `⭐ Earn ${m.points} pts`}
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: meta.color }}>
                      {m.completed ? 'Review →' : 'Start →'}
                    </span>
                  </button>
                </TopicCard>
              )
            }
            // Multi-part topic: the card itself isn't clickable -- each part
            // is its own pill with its own progress and its own points, so a
            // kid can see at a glance how far through the topic they are and
            // jump into any part, in any order.
            const doneCount = topic.modules.filter(m => m.completed).length
            return (
              <TopicCard key={topic.topic} meta={meta} emoji={topic.emoji} title={topic.title} isNew={topicIsNew}
                badge={`${doneCount}/${topic.modules.length} done`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
                  {topic.modules.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setPlayingModule(m)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                        padding: '8px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                        background: m.completed ? '#f0fdf4' : '#fff',
                        border: `1px solid ${m.completed ? '#bbf7d0' : meta.border}`,
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: m.completed ? '#166534' : '#1e293b' }}>
                        {m.completed ? '✅ ' : ''}{partLabel(m.title) || m.title}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: m.completed ? '#166534' : meta.color }}>
                        {m.completed ? 'Review' : `⭐ ${m.points} pts`}
                      </span>
                    </button>
                  ))}
                </div>
              </TopicCard>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TopicCard({ meta, emoji, title, isNew, badge, children }) {
  return (
    <div
      style={{
        border: `1px solid ${meta.border}`, background: meta.bg, borderRadius: 18, padding: '20px 18px',
        display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16, background: '#fff', border: `1px solid ${meta.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.7rem', flexShrink: 0,
        }}>
          {emoji}
        </div>
        {badge && (
          <span style={{
            fontSize: '0.72rem', fontWeight: 700, borderRadius: 999, padding: '4px 10px',
            background: '#fff', color: meta.color, border: `1px solid ${meta.border}`, whiteSpace: 'nowrap',
          }}>
            {badge}
          </span>
        )}
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontWeight: 800, fontSize: '1.02rem', color: '#1e293b' }}>{title}</span>
          {isNew && <NewBadge />}
        </div>
        <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>{meta.description}</div>
      </div>
      {children}
    </div>
  )
}
