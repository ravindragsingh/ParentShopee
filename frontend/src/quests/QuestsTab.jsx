import { useState, useEffect, useCallback } from 'react'
import { api } from '../api.js'
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

function groupByCategory(modules) {
  const byCategory = new Map()
  for (const m of modules) {
    if (!byCategory.has(m.category)) byCategory.set(m.category, { category: m.category, title: m.categoryTitle, emoji: m.categoryEmoji, modules: [] })
    byCategory.get(m.category).modules.push(m)
  }
  return [...byCategory.values()]
}

function CategoryCard({ meta, emoji, title, isNew, index, children }) {
  return (
    <div
      className="pop-in"
      style={{
        border: `1px solid ${meta.border}`, background: meta.bg, borderRadius: 18, padding: '20px 18px',
        display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        animationDelay: `${index * 0.08}s`, animationFillMode: 'backwards',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16, background: '#fff', border: `1px solid ${meta.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.7rem', flexShrink: 0,
        }}>
          {emoji}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 800, fontSize: '1.02rem', color: '#1e293b' }}>{title}</span>
          {isNew && <NewBadge />}
        </div>
      </div>
      <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>{meta.description}</div>
      {children}
    </div>
  )
}

export default function QuestsTab({ onBalanceChange }) {
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openModule, setOpenModule] = useState(null)
  const [justSent, setJustSent] = useState(false)

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

  // Also catches up the kid's balance badge elsewhere in the app, in case a
  // guardian approved an earlier log while this tab wasn't open.
  useEffect(() => { loadModules(); onBalanceChange && onBalanceChange() }, [loadModules])

  function handleLogSubmitted() {
    // Points land only once a guardian approves the log (see QuestView), so
    // there's nothing for onBalanceChange to refresh yet -- just a
    // confirmation that it's on its way to them.
    setJustSent(true)
    setTimeout(() => setJustSent(false), 4000)
    loadModules()
  }

  if (openModule) {
    return <QuestView module={openModule} onExit={() => setOpenModule(null)} onLogSubmitted={handleLogSubmitted} />
  }

  if (loading) return <div className="loading-text">Loading Quests…</div>

  const categories = groupByCategory(modules)

  return (
    <div>
      <h3 style={{ color: '#334155', margin: '0 0 6px' }}>🧸 Quests</h3>
      <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 10, padding: '10px 14px', marginBottom: 18, color: '#0f766e', fontSize: '0.85rem' }}>
        Fun things to try together. Pick one, give it a go, and tell your guardian about it to earn points.
      </div>

      {justSent && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', marginBottom: 18, color: '#92400e', fontSize: '0.9rem', fontWeight: 700 }}>
          ⏳ Sent to your guardian — your points will show up once they take a look.
        </div>
      )}

      {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}

      {categories.length === 0 ? (
        <div className="empty-text">Nothing here yet — ask your guardian to turn on a quest for you.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {categories.map((category, catIndex) => {
            const meta = categoryMeta(category.category)
            const categoryIsNew = category.modules.some(m => m.isNew)
            const doneCount = category.modules.filter(m => m.completed).length
            return (
              <CategoryCard key={category.category} meta={meta} emoji={category.emoji} title={category.title} isNew={categoryIsNew} index={catIndex}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: meta.color }}>{doneCount}/{category.modules.length} tried</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
                  {category.modules.map(m => {
                    const isPending = m.pendingLog?.status === 'pending'
                    const isRejected = m.pendingLog?.status === 'rejected'
                    return (
                      <button
                        key={m.id}
                        onClick={() => setOpenModule(m)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                          padding: '8px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                          background: m.completed ? '#f0fdf4' : isPending ? '#fffbeb' : '#fff',
                          border: `1px solid ${m.completed ? '#bbf7d0' : isPending ? '#fde68a' : meta.border}`,
                        }}
                      >
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: m.completed ? '#166534' : isPending ? '#92400e' : '#1e293b' }}>
                          {m.completed ? '✅ ' : isPending ? '⏳ ' : isRejected ? '🔄 ' : ''}{m.title}
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: m.completed ? '#166534' : isPending ? '#92400e' : meta.color }}>
                          {m.completed ? 'Done' : isPending ? 'Pending' : isRejected ? 'Try again' : `⭐ ${m.points} pts`}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </CategoryCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
