import { useState, useEffect, useRef, useCallback } from 'react'
import { useCountdown } from './useCountdown.js'
import { useReportScoreOnGameOver } from './useReportScoreOnGameOver.js'
import GameHeader from './GameHeader.jsx'

const HOLE_COUNT = 9

function randomHole(exclude) {
  let idx
  do { idx = Math.floor(Math.random() * HOLE_COUNT) } while (idx === exclude && HOLE_COUNT > 1)
  return idx
}

export default function WhackAMoleGame({ session, onExit, onGameOver }) {
  const [activeIndex, setActiveIndex] = useState(null)
  const [score, setScore] = useState(0)
  const { remainingMs, timeUp } = useCountdown(session.expiresAt)
  useReportScoreOnGameOver(timeUp, score, onGameOver)
  const popTimeoutRef = useRef(null)
  const hideTimeoutRef = useRef(null)
  const activeIndexRef = useRef(null)

  const clearTimers = useCallback(() => {
    clearTimeout(popTimeoutRef.current)
    clearTimeout(hideTimeoutRef.current)
  }, [])

  const scheduleNextPop = useCallback((delay) => {
    popTimeoutRef.current = setTimeout(() => {
      const idx = randomHole(activeIndexRef.current)
      activeIndexRef.current = idx
      setActiveIndex(idx)
      const visibleFor = 500 + Math.random() * 350
      hideTimeoutRef.current = setTimeout(() => {
        activeIndexRef.current = null
        setActiveIndex(null)
        scheduleNextPop(250 + Math.random() * 250)
      }, visibleFor)
    }, delay)
  }, [])

  useEffect(() => {
    if (timeUp) { clearTimers(); return }
    scheduleNextPop(500)
    return clearTimers
  }, [timeUp, scheduleNextPop, clearTimers])

  function handleWhack(idx) {
    if (timeUp || idx !== activeIndexRef.current) return
    clearTimeout(hideTimeoutRef.current)
    activeIndexRef.current = null
    setActiveIndex(null)
    setScore(s => s + 1)
    scheduleNextPop(200 + Math.random() * 250)
  }

  return (
    <div style={{ maxWidth: 380, margin: '0 auto' }}>
      <GameHeader onExit={onExit} status={`Score: ${score}`} remainingMs={remainingMs} timeUp={timeUp} />

      {timeUp ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 10 }}>🐹</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>Time's up!</div>
          <div style={{ fontSize: '0.88rem', color: '#64748b', marginTop: 6 }}>You whacked {score} mole{score === 1 ? '' : 's'}.</div>
          <button className="btn btn-outline" style={{ marginTop: 18 }} onClick={onExit}>Back to Games</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {Array.from({ length: HOLE_COUNT }).map((_, i) => (
            <button
              key={i}
              onClick={() => handleWhack(i)}
              style={{
                aspectRatio: '1', borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: 'radial-gradient(circle at 50% 40%, #a16207, #78350f)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', overflow: 'hidden',
              }}
            >
              {activeIndex === i ? '🐹' : ''}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
