import { useState, useEffect, useCallback, useMemo } from 'react'
import { api } from '../api.js'
import { ageLabel } from './ageLabel.js'
import { GAME_COMPONENTS } from './gameRegistry.js'
import Leaderboard from './Leaderboard.jsx'

const AGE_FILTERS = [
  { id: 'all', label: 'All games', min: null, max: null },
  { id: 'young', label: 'Ages 4–6', min: 4, max: 6 },
  { id: 'older', label: 'Ages 8+', min: 8, max: null },
]

// True if a game's [minAge, maxAge] range overlaps a filter's range at all --
// e.g. Memory Match (4, unbounded) matches both the "4–6" and "8+" filters,
// which is correct: it genuinely suits every age, not just one bucket.
function overlaps(gameMin, gameMax, filterMin, filterMax) {
  const gLo = gameMin ?? -Infinity, gHi = gameMax ?? Infinity
  const fLo = filterMin ?? -Infinity, fHi = filterMax ?? Infinity
  return gLo <= fHi && fLo <= gHi
}

export default function GuardianGamesTab() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)
  const [bulkSaving, setBulkSaving] = useState(false)
  const [ageFilter, setAgeFilter] = useState('all')
  const [playingGame, setPlayingGame] = useState(null)

  const loadGames = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getGames()
      setGames(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadGames() }, [loadGames])

  const activeFilter = AGE_FILTERS.find(f => f.id === ageFilter)
  const visibleGames = useMemo(
    () => games.filter(g => overlaps(g.minAge, g.maxAge, activeFilter.min, activeFilter.max)),
    [games, activeFilter]
  )

  async function handleToggle(game) {
    setSavingId(game.id)
    setError('')
    try {
      await api.setGameVisibility(game.id, !game.enabled)
      setGames(gs => gs.map(g => g.id === game.id ? { ...g, enabled: !g.enabled } : g))
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingId(null)
    }
  }

  async function handleBulkSet(enabled) {
    setBulkSaving(true)
    setError('')
    try {
      for (const game of visibleGames) {
        if (game.enabled !== enabled) await api.setGameVisibility(game.id, enabled)
      }
      const ids = new Set(visibleGames.map(g => g.id))
      setGames(gs => gs.map(g => ids.has(g.id) ? { ...g, enabled } : g))
    } catch (err) {
      setError(err.message)
    } finally {
      setBulkSaving(false)
    }
  }

  function handlePlay(game) {
    // Guardians play for free, no purchase/approval/points involved -- just a
    // straight timed session using the same duration as the kid-facing pass,
    // so every game component's existing session.expiresAt/timeUp logic works
    // unchanged. Scores aren't reported (no session id exists to attach one
    // to) -- this is a preview/for-fun mode, not something that feeds into
    // the kids' leaderboard.
    const expiresAt = new Date(Date.now() + game.durationMinutes * 60000).toISOString()
    setPlayingGame({ ...game, session: { expiresAt } })
  }

  if (playingGame) {
    const GameComponent = GAME_COMPONENTS[playingGame.id]
    if (!GameComponent) {
      return <div className="error-msg">This game isn't available yet.</div>
    }
    return (
      <div>
        <Leaderboard gameId={playingGame.id} />
        <GameComponent session={playingGame.session} onExit={() => setPlayingGame(null)} />
      </div>
    )
  }

  if (loading) return <div className="loading-text">Loading games...</div>

  return (
    <div>
      <h3 style={{ color: '#334155', margin: '0 0 6px' }}>Games</h3>
      <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#0f766e', fontSize: '0.85rem' }}>
        🎮 Turn on the games you want your kids to be able to buy with their points. New games start off — nothing shows up for kids until you enable it here. Click "▶️ Try It" on any game to play it yourself, free — a good way to check it out before deciding whether to enable it.
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {AGE_FILTERS.map(f => (
            <button
              key={f.id}
              className={`btn btn-sm ${ageFilter === f.id ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setAgeFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-sm btn-green" onClick={() => handleBulkSet(true)} disabled={bulkSaving || visibleGames.length === 0}>
            {bulkSaving ? 'Saving...' : 'Enable all'}
          </button>
          <button className="btn btn-sm btn-outline" onClick={() => handleBulkSet(false)} disabled={bulkSaving || visibleGames.length === 0}>
            Disable all
          </button>
        </div>
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}

      {visibleGames.length === 0 ? (
        <div className="empty-text">No games in this age range.</div>
      ) : (
        <div className="shop-grid">
          {visibleGames.map(game => (
            <div key={game.id} className="shop-item-card">
              <div className="shop-emoji">{game.imageEmoji}</div>
              <div className="shop-name">{game.name}</div>
              {game.description && <div className="shop-desc">{game.description}</div>}
              <div className="shop-cost">{game.cost} pts · {game.durationMinutes} min pass</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{ageLabel(game.minAge, game.maxAge)}</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#334155', fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>
                <input
                  type="checkbox"
                  checked={!!game.enabled}
                  disabled={savingId === game.id || bulkSaving}
                  onChange={() => handleToggle(game)}
                />
                {game.enabled ? 'Visible to kids' : 'Hidden from kids'}
              </label>
              <button className="btn btn-sm btn-outline" style={{ marginTop: 6 }} onClick={() => handlePlay(game)}>
                ▶️ Try It
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
