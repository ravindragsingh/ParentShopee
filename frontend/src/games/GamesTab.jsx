import { useState, useEffect, useCallback } from 'react'
import { api } from '../api.js'
import MemoryMatchGame from './MemoryMatchGame.jsx'
import QuickMathGame from './QuickMathGame.jsx'
import AlphabetHuntGame from './AlphabetHuntGame.jsx'
import NumberMatchGame from './NumberMatchGame.jsx'
import SightWordsGame from './SightWordsGame.jsx'
import WordScrambleGame from './WordScrambleGame.jsx'
import { ageLabel } from './ageLabel.js'

// Add a new game's slug -> component here to make it playable once it has a
// matching row in the backend's games catalog (backend/main.py seeds it).
const GAME_COMPONENTS = {
  'memory-match': MemoryMatchGame,
  'quick-math': QuickMathGame,
  'alphabet-hunt': AlphabetHuntGame,
  'number-match': NumberMatchGame,
  'sight-words': SightWordsGame,
  'word-scramble': WordScrambleGame,
}

function GameCard({ game, session, balance, onBuy, onStart, busy }) {
  const canAfford = balance >= game.cost

  let footer
  if (!session || ['rejected', 'expired'].includes(session.status)) {
    footer = (
      <button
        className={`btn btn-sm ${canAfford ? 'btn-green' : 'btn-gray'}`}
        onClick={() => onBuy(game.id)}
        disabled={busy || !canAfford}
        title={canAfford ? 'Buy this game pass' : 'Not enough points'}
      >
        {busy ? 'Buying...' : canAfford ? `Buy · ${game.cost} pts` : 'Not enough pts'}
      </button>
    )
  } else if (session.status === 'pending') {
    footer = <button className="btn btn-sm btn-outline" disabled>⏳ Awaiting approval</button>
  } else if (session.status === 'approved') {
    footer = (
      <button className="btn btn-sm btn-green" onClick={() => onStart(session.id)} disabled={busy}>
        {busy ? 'Starting...' : '▶️ Play Now'}
      </button>
    )
  } else if (session.status === 'active') {
    footer = (
      <button className="btn btn-sm btn-green" onClick={() => onStart(session.id, /* alreadyActive */ true)}>
        ▶️ Resume
      </button>
    )
  }

  return (
    <div className="shop-item-card">
      <div className="shop-emoji">{game.imageEmoji}</div>
      <div className="shop-name">{game.name}</div>
      {game.description && <div className="shop-desc">{game.description}</div>}
      <div className="shop-cost">{game.cost} pts · {game.durationMinutes} min pass</div>
      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{ageLabel(game.minAge, game.maxAge)}</div>
      {footer}
    </div>
  )
}

export default function GamesTab({ userId, onBalanceChange }) {
  const [games, setGames] = useState([])
  const [sessions, setSessions] = useState([])
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyGameId, setBusyGameId] = useState(null)
  const [playingSession, setPlayingSession] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [gamesData, sessionsData, walletData] = await Promise.all([
        api.getGames(),
        api.getGameSessions(),
        api.getWallet(userId),
      ])
      setGames(Array.isArray(gamesData) ? gamesData : [])
      setSessions(Array.isArray(sessionsData) ? sessionsData : [])
      setBalance(walletData?.balance ?? 0)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { loadData() }, [loadData])

  function latestSessionFor(gameId) {
    return sessions
      .filter(s => s.gameId === gameId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
  }

  async function handleBuy(gameId) {
    setBusyGameId(gameId)
    setError('')
    try {
      await api.buyGame(gameId)
      await loadData()
      onBalanceChange && onBalanceChange()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyGameId(null)
    }
  }

  async function handleStart(sessionId, alreadyActive) {
    setBusyGameId(sessionId)
    setError('')
    try {
      const session = alreadyActive
        ? sessions.find(s => s.id === sessionId)
        : await api.startGameSession(sessionId)
      setPlayingSession(session)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyGameId(null)
    }
  }

  function handleExit() {
    setPlayingSession(null)
    loadData()
  }

  if (playingSession) {
    const GameComponent = GAME_COMPONENTS[playingSession.gameId]
    if (!GameComponent) {
      return <div className="error-msg">This game isn't available yet.</div>
    }
    return <GameComponent session={playingSession} onExit={handleExit} />
  }

  if (loading) return <div className="loading-text">Loading games...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ color: '#334155', margin: 0 }}>Game Passes</h3>
        <span className="balance-chip">Balance: {balance} pts</span>
      </div>

      <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 10, padding: '10px 14px', marginBottom: 14, color: '#0f766e', fontSize: '0.85rem' }}>
        🎮 Buy a game pass with your points, then tap Play whenever you're ready — the timer only starts once you begin.
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}

      {games.length === 0 ? (
        <div className="empty-text">No games available yet. Check back soon!</div>
      ) : (
        <div className="shop-grid">
          {games.map(game => (
            <GameCard
              key={game.id}
              game={game}
              session={latestSessionFor(game.id)}
              balance={balance}
              onBuy={handleBuy}
              onStart={handleStart}
              busy={busyGameId === game.id || busyGameId === latestSessionFor(game.id)?.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
