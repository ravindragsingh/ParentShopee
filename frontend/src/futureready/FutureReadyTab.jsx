import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api.js'
import LessonModule from './LessonModule.jsx'
import { topicMeta } from './topicMeta.js'

// Age bands are a guardian-only concept -- the backend already resolves
// each topic down to the one module that matches this kid's own age, so
// this just renders one tile per topic. No "Ages X-Y" anywhere in here.
export default function FutureReadyTab({ onBalanceChange }) {
  const { user } = useAuth()
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
        subtitle={playingModule.topicTitle}
        onExit={() => setPlayingModule(null)}
        onCompleted={handleCompleted}
      />
    )
  }

  if (loading) return <div className="loading-text">Loading Future-Ready…</div>

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

      {modules.length === 0 ? (
        <div className="empty-text">
          {user?.age == null
            ? "Future-Ready lessons are matched to your age, but your birthday isn't saved yet — ask your guardian to add it from the Kids tab."
            : 'Nothing here yet — ask your guardian to turn on a lesson for you.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {modules.map(m => {
            const meta = topicMeta(m.topic)
            return (
              <button
                key={m.id}
                onClick={() => setPlayingModule(m)}
                style={{
                  textAlign: 'left', cursor: 'pointer', border: `1px solid ${meta.border}`,
                  background: meta.bg, borderRadius: 18, padding: '20px 18px',
                  display: 'flex', flexDirection: 'column', gap: 12,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)', transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 22px rgba(0,0,0,0.1)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)' }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 16, background: '#fff', border: `1px solid ${meta.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.7rem',
                }}>
                  {m.topicEmoji}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.02rem', color: '#1e293b', marginBottom: 4 }}>{m.topicTitle}</div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>{meta.description}</div>
                </div>
                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 }}>
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
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
