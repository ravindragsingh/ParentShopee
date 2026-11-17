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
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: compact ? 10 : 14 }}>
        <StatPill emoji={stats.level.emoji} value={`Lv.${stats.level.number}`} label={stats.level.name} highlight title={levelTitle} />
        <StatPill emoji="🔥" value={stats.currentStreak} label="day streak" highlight={stats.currentStreak > 0} />
        <StatPill emoji="📄" value={stats.totalPagesRead} label="pages read" />
        <StatPill emoji="📚" value={stats.totalBooksCompleted} label={stats.totalBooksCompleted === 1 ? 'book finished' : 'books finished'} />
        {stats.longestStreak > stats.currentStreak && (
          <StatPill emoji="⭐" value={stats.longestStreak} label="best streak" />
        )}
      </div>

      {/* Shown for both the kid's own view and a guardian looking at a kid's
          progress (see GuardianReadingLogTab) -- `compact` only trims the pill
          row's spacing above, it doesn't hide this detail from guardians. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
        <StreakCalendar last7Days={stats.last7Days} booksCompleted={stats.totalBooksCompleted} />
        <GenreBreakdown genreCounts={stats.genreCounts} />
      </div>

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

function formatGenreLabel(genre) {
  return genre.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
}

// "A world of genres" -- every genre the backend classifies books into (see
// reading_level.ALL_GENRES), not just ones this kid has already read, so it
// reads as an invitation to try something new rather than just a history.
function GenreBreakdown({ genreCounts }) {
  if (!genreCounts?.length) return null
  const exploredCount = genreCounts.filter(g => g.count > 0).length
  const maxCount = Math.max(1, ...genreCounts.map(g => g.count))

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#1e293b', marginBottom: 2 }}>📚 A world of genres</div>
      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: 8 }}>
        {exploredCount} genre{exploredCount === 1 ? '' : 's'} explored{exploredCount < genreCounts.length ? ' · try a new one!' : ''}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {genreCounts.map(g => (
          <div key={g.genre}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: g.count > 0 ? '#1e293b' : '#94a3b8', marginBottom: 2 }}>
              <span>{formatGenreLabel(g.genre)}</span>
              <span>{g.count} {g.count === 1 ? 'book' : 'books'}</span>
            </div>
            <div style={{ height: 6, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(g.count / maxCount) * 100}%`, background: g.count > 0 ? '#84a35a' : 'transparent', borderRadius: 999 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// "Keep your rhythm" -- the same 7-day window the streak pill above is
// computed from, rendered as a checklist instead of just a running number.
function StreakCalendar({ last7Days, booksCompleted }) {
  if (!last7Days?.length) return null
  const daysRead = last7Days.filter(d => d.read).length

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#1e293b', marginBottom: 2 }}>🔥 Keep your rhythm</div>
      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: 8 }}>
        {daysRead} of the last 7 days · based on reading dates
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {last7Days.map(d => (
          <div key={d.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1 }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.78rem', fontWeight: 700,
              background: d.read ? '#f0fdf4' : '#f8fafc', color: d.read ? '#166534' : '#cbd5e1',
              border: `1px solid ${d.read ? '#bbf7d0' : '#e2e8f0'}`,
            }}>
              {d.read ? '✓' : ''}
            </div>
            <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>{d.label}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: '0.74rem', color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px' }}>
        Books completed: <strong>{booksCompleted}</strong>
      </div>
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
