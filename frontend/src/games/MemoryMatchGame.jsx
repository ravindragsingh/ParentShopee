import { useState, useCallback } from 'react'
import { useCountdown } from './useCountdown.js'
import { useReportScoreOnGameOver } from './useReportScoreOnGameOver.js'
import GameHeader from './GameHeader.jsx'

const ICONS = ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐸', '🦁']

function shuffledDeck() {
  const deck = ICONS.flatMap((icon, i) => [
    { key: `${i}-a`, icon }, { key: `${i}-b`, icon },
  ])
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck.map((card, i) => ({ ...card, id: i }))
}

// Self-contained card-flip game. Purely client-side -- the backend only tracks
// the game pass purchase and its timer, not moves or score, matching v1's scope.
export default function MemoryMatchGame({ session, onExit, onGameOver }) {
  const [deck] = useState(shuffledDeck)
  const [flipped, setFlipped] = useState([])
  const [matched, setMatched] = useState(new Set())
  const [moves, setMoves] = useState(0)
  const [locked, setLocked] = useState(false)
  const { remainingMs, timeUp } = useCountdown(session.expiresAt)

  const won = matched.size === deck.length
  useReportScoreOnGameOver(won || timeUp, matched.size / 2, onGameOver)

  const handleFlip = useCallback((card) => {
    if (timeUp || won || locked || flipped.includes(card.id) || matched.has(card.id)) return
    const next = [...flipped, card.id]
    setFlipped(next)
    if (next.length === 2) {
      setMoves(m => m + 1)
      const [a, b] = next
      const cardA = deck.find(c => c.id === a)
      const cardB = deck.find(c => c.id === b)
      if (cardA.icon === cardB.icon) {
        setMatched(prev => new Set(prev).add(a).add(b))
        setFlipped([])
      } else {
        setLocked(true)
        setTimeout(() => { setFlipped([]); setLocked(false) }, 700)
      }
    }
  }, [deck, flipped, locked, matched, timeUp, won])

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <GameHeader onExit={onExit} status={`Moves: ${moves}`} remainingMs={remainingMs} timeUp={timeUp} />

      {won ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 10 }}>🎉</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>You found every pair!</div>
          <div style={{ fontSize: '0.88rem', color: '#64748b', marginTop: 6 }}>Finished in {moves} moves.</div>
          <button className="btn btn-green" style={{ marginTop: 18 }} onClick={onExit}>Back to Games</button>
        </div>
      ) : timeUp ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 10 }}>⏰</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>Time's up!</div>
          <div style={{ fontSize: '0.88rem', color: '#64748b', marginTop: 6 }}>You matched {matched.size / 2} of {deck.length / 2} pairs.</div>
          <button className="btn btn-outline" style={{ marginTop: 18 }} onClick={onExit}>Back to Games</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {deck.map(card => {
            const isFlipped = flipped.includes(card.id) || matched.has(card.id)
            const isMatched = matched.has(card.id)
            return (
              <button
                key={card.id}
                onClick={() => handleFlip(card)}
                disabled={isFlipped}
                style={{
                  aspectRatio: '1', fontSize: '1.9rem', borderRadius: 12, cursor: isFlipped ? 'default' : 'pointer',
                  border: isMatched ? '2px solid #6ee7b7' : '1px solid #e2e8f0',
                  background: isMatched ? '#ecfdf5' : isFlipped ? '#fff' : 'linear-gradient(135deg, #0d9488, #0891b2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s ease', boxShadow: isFlipped ? 'none' : '0 2px 6px rgba(0,0,0,0.08)',
                }}
              >
                {isFlipped ? card.icon : ''}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
