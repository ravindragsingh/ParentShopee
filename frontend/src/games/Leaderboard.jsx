import { useState, useEffect } from 'react'
import { api } from '../api.js'

const RANK_MEDALS = ['🥇', '🥈', '🥉']

// Shown when a kid starts a game -- top scorers within their own family only
// (matches the app's existing privacy model: nothing else is visible across
// families either). Silently hides itself on a fetch error or an empty board
// rather than blocking play over a leaderboard that isn't essential to it.
export default function Leaderboard({ gameId, refreshKey }) {
  const [entries, setEntries] = useState(null)

  useEffect(() => {
    let cancelled = false
    api.getGameLeaderboard(gameId)
      .then(data => { if (!cancelled) setEntries(Array.isArray(data) ? data : []) })
      .catch(() => { if (!cancelled) setEntries([]) })
    return () => { cancelled = true }
  }, [gameId, refreshKey])

  if (!entries || entries.length === 0) return null

  return (
    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '10px 14px', marginBottom: 14 }}>
      <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#92400e', marginBottom: 8 }}>🏆 Top Scores</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {entries.map((e, i) => (
          <div key={e.kidId} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
            <span style={{ width: 20, textAlign: 'center', flexShrink: 0 }}>{RANK_MEDALS[i] || `${i + 1}.`}</span>
            <span style={{ flexShrink: 0 }}>{e.kidAvatar}</span>
            <span style={{ flex: 1, color: '#1e293b', fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.kidName}</span>
            <span style={{ fontWeight: 700, color: '#b45309', flexShrink: 0 }}>{e.score} pts</span>
          </div>
        ))}
      </div>
    </div>
  )
}
