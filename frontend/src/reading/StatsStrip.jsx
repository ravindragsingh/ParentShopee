import { useState, useEffect } from 'react'
import { api } from '../api.js'

// Duolingo-style stats + badge row -- shared by the kid's own Reading Log
// view and (via kidId) a guardian looking at one kid's progress. Badges are
// computed server-side from real data (streak/pages/books), not a separate
// tracked list, so there's nothing to get out of sync.
//
// Pass `stats` directly when the caller already fetched it (e.g. alongside
// ReadingBuddy, which needs the same payload) to avoid a duplicate request;
// otherwise this fetches its own via `kidId` (undefined = the current kid).
export default function StatsStrip({ kidId, stats: statsProp, compact }) {
  const [fetched, setFetched] = useState(null)
  const usingProp = statsProp !== undefined

  useEffect(() => {
    if (usingProp) return
    let cancelled = false
    api.getReadingLogStats(kidId).then(d => { if (!cancelled) setFetched(d) }).catch(() => { if (!cancelled) setFetched(null) })
    return () => { cancelled = true }
  }, [kidId, usingProp])

  const stats = usingProp ? statsProp : fetched
  if (!stats) return null

  const levelTitle = stats.level.pointsToNext != null
    ? `${stats.level.pointsToNext} quality points to next level (from book difficulty, genre variety, and engagement -- not just page count)`
    : 'Max level reached!'

  return (
    <div className="pop-in" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: compact ? 8 : 12 }}>
        <StatPill emoji={stats.level.emoji} value={`Lv.${stats.level.number}`} label={stats.level.name} highlight title={levelTitle} />
        <StatPill emoji="🔥" value={stats.currentStreak} label="day streak" highlight={stats.currentStreak > 0} />
        <StatPill emoji="📄" value={stats.totalPagesRead} label="pages read" />
        <StatPill emoji="📚" value={stats.totalBooksCompleted} label={stats.totalBooksCompleted === 1 ? 'book finished' : 'books finished'} />
        {stats.longestStreak > stats.currentStreak && (
          <StatPill emoji="⭐" value={stats.longestStreak} label="best streak" />
        )}
      </div>
      {!compact && stats.level.genresRead?.length > 0 && (
        <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginBottom: 10 }}>
          📚 Genres explored: {stats.level.genresRead.join(', ')}
          {stats.level.pointsToNext != null && ` · ${stats.level.pointsToNext} pts to next level`}
        </div>
      )}
      {!compact && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {stats.badges.map(b => (
            <div
              key={b.id}
              title={b.description}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, borderRadius: 999, padding: '4px 10px',
                fontSize: '0.74rem', fontWeight: 700,
                background: b.earned ? '#fffbeb' : '#f8fafc',
                color: b.earned ? '#92400e' : '#cbd5e1',
                border: `1px solid ${b.earned ? '#fde68a' : '#e2e8f0'}`,
                opacity: b.earned ? 1 : 0.7,
              }}
            >
              <span style={{ filter: b.earned ? 'none' : 'grayscale(1)' }}>{b.earned ? b.emoji : '🔒'}</span>
              {b.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatPill({ emoji, value, label, highlight, title }) {
  return (
    <div title={title} style={{
      display: 'flex', alignItems: 'center', gap: 6, borderRadius: 12, padding: '8px 14px',
      background: highlight ? '#fff7ed' : '#f8fafc', border: `1px solid ${highlight ? '#fed7aa' : '#e2e8f0'}`,
    }}>
      <span style={{ fontSize: '1.1rem' }}>{emoji}</span>
      <div>
        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: highlight ? '#c2410c' : '#1e293b', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{label}</div>
      </div>
    </div>
  )
}
