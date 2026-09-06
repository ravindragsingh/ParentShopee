import { useState, useCallback, useEffect } from 'react'
import { useCountdown } from './useCountdown.js'
import { useReportScoreOnGameOver } from './useReportScoreOnGameOver.js'
import { playCorrectSound, playWrongSound } from './gameSounds.js'
import GameHeader from './GameHeader.jsx'
import LevelResultCard from './LevelResultCard.jsx'

const ICONS = ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐸', '🦁']
const MIN_PAIRS = 3
const MAX_PAIRS = ICONS.length

function pairsForLevel(level) {
  return Math.min(MAX_PAIRS, MIN_PAIRS + level - 1)
}

function levelSecondsForPairs(pairs) {
  return 12 + pairs * 4
}

function newExpiry(seconds) {
  return new Date(Date.now() + seconds * 1000).toISOString()
}

function shuffledDeck(pairs) {
  const icons = ICONS.slice(0, pairs)
  const deck = icons.flatMap((icon, i) => [
    { key: `${i}-a`, icon }, { key: `${i}-b`, icon },
  ])
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck.map((card, i) => ({ ...card, id: i }))
}

// Each level is its own board: clear every pair before that level's own
// clock runs out to pass and see a bigger board; running out of time drops
// back to level 1's smaller board. Reported score is the highest level
// ever cleared, consistent with every other leveled game here.
export default function MemoryMatchGame({ session, onExit, onGameOver }) {
  const [level, setLevel] = useState(1)
  const [bestLevel, setBestLevel] = useState(0)
  const [deck, setDeck] = useState(() => shuffledDeck(pairsForLevel(1)))
  const [flipped, setFlipped] = useState([])
  const [matched, setMatched] = useState(new Set())
  const [moves, setMoves] = useState(0)
  const [locked, setLocked] = useState(false)
  const [roundResult, setRoundResult] = useState(null) // 'pass' | 'fail' | null
  const [levelExpiresAt, setLevelExpiresAt] = useState(() => newExpiry(levelSecondsForPairs(pairsForLevel(1))))
  const { remainingMs, timeUp } = useCountdown(session.expiresAt)
  const { remainingMs: levelRemainingMs, timeUp: levelTimeUp } = useCountdown(levelExpiresAt)
  useReportScoreOnGameOver(timeUp, bestLevel, onGameOver)

  const cleared = matched.size === deck.length

  useEffect(() => {
    if (cleared && !roundResult) setRoundResult('pass')
  }, [cleared, roundResult])

  // `roundResult` guards re-entry but is deliberately not read as a stale
  // guard inside a listed `feedback`-like value -- unlike MultipleChoiceGame
  // there's no separate feedback state here, so no dependency-cancels-its-
  // own-timeout trap to avoid.
  useEffect(() => {
    if (timeUp || roundResult || cleared || !levelTimeUp) return
    playWrongSound()
    setRoundResult('fail')
  }, [levelTimeUp, timeUp, roundResult, cleared])

  const handleFlip = useCallback((card) => {
    if (timeUp || roundResult || locked || flipped.includes(card.id) || matched.has(card.id)) return
    const next = [...flipped, card.id]
    setFlipped(next)
    if (next.length === 2) {
      setMoves(m => m + 1)
      const [a, b] = next
      const cardA = deck.find(c => c.id === a)
      const cardB = deck.find(c => c.id === b)
      if (cardA.icon === cardB.icon) {
        playCorrectSound()
        setMatched(prev => new Set(prev).add(a).add(b))
        setFlipped([])
      } else {
        playWrongSound()
        setLocked(true)
        setTimeout(() => { setFlipped([]); setLocked(false) }, 700)
      }
    }
  }, [deck, flipped, locked, matched, timeUp, roundResult])

  function startLevel(targetLevel) {
    const pairs = pairsForLevel(targetLevel)
    setLevel(targetLevel)
    setDeck(shuffledDeck(pairs))
    setFlipped([])
    setMatched(new Set())
    setMoves(0)
    setLocked(false)
    setLevelExpiresAt(newExpiry(levelSecondsForPairs(pairs)))
    setRoundResult(null)
  }

  function handleContinue() {
    setBestLevel(b => Math.max(b, level))
    startLevel(level + 1)
  }

  function handleRetry() {
    startLevel(1)
  }

  const levelUrgent = levelRemainingMs < 8000

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <GameHeader onExit={onExit} gameName={session.gameName} status={`Level ${level} · Best: ${bestLevel}`} remainingMs={remainingMs} timeUp={timeUp} />

      {timeUp ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 10 }}>⏰</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>Time's up!</div>
          <div style={{ fontSize: '0.88rem', color: '#64748b', marginTop: 6 }}>You reached level {bestLevel}.</div>
          <button className="btn btn-outline" style={{ marginTop: 18 }} onClick={onExit}>Back to Games</button>
        </div>
      ) : roundResult === 'pass' ? (
        <LevelResultCard
          result="pass" level={level} nextLevel={level + 1}
          subtext={`Cleared in ${moves} moves.`}
          onContinue={handleContinue}
        />
      ) : roundResult === 'fail' ? (
        <LevelResultCard
          result="fail" level={level}
          subtext={`Matched ${matched.size / 2} of ${deck.length / 2} pairs before time ran out.`}
          onRetry={handleRetry}
        />
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Moves: {moves}</span>
            <span style={{
              fontSize: '0.85rem', fontWeight: 700, borderRadius: 999, padding: '4px 12px',
              background: levelUrgent ? '#fed7aa' : '#f1f5f9', color: levelUrgent ? '#c2410c' : '#64748b',
            }}>
              ⏳ {Math.max(0, Math.ceil(levelRemainingMs / 1000))}s left this board
            </span>
          </div>
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
        </div>
      )}
    </div>
  )
}
