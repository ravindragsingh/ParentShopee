import { useState, useEffect, useCallback } from 'react'
import { api } from '../api.js'

export default function GuardianGamesTab() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)

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

  if (loading) return <div className="loading-text">Loading games...</div>

  return (
    <div>
      <h3 style={{ color: '#334155', margin: '0 0 6px' }}>Games</h3>
      <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#0f766e', fontSize: '0.85rem' }}>
        🎮 Turn on the games you want your kids to be able to buy with their points. New games start off — nothing shows up for kids until you enable it here.
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}

      {games.length === 0 ? (
        <div className="empty-text">No games in the catalog yet.</div>
      ) : (
        <div className="shop-grid">
          {games.map(game => (
            <div key={game.id} className="shop-item-card">
              <div className="shop-emoji">{game.imageEmoji}</div>
              <div className="shop-name">{game.name}</div>
              {game.description && <div className="shop-desc">{game.description}</div>}
              <div className="shop-cost">{game.cost} pts · {game.durationMinutes} min pass</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#334155', fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>
                <input
                  type="checkbox"
                  checked={!!game.enabled}
                  disabled={savingId === game.id}
                  onChange={() => handleToggle(game)}
                />
                {game.enabled ? 'Visible to kids' : 'Hidden from kids'}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
