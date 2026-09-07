import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../api.js'
import { useCountdown } from './useCountdown.js'
import { useReportScoreOnGameOver } from './useReportScoreOnGameOver.js'
import { playCorrectSound, playWrongSound } from './gameSounds.js'
import GameHeader from './GameHeader.jsx'
import LevelResultCard from './LevelResultCard.jsx'

const HOLE_COUNT = 9

function targetForLevel(level) {
  return 2 + level
}

function levelSecondsForTarget(target) {
  return 10 + target * 3
}

function newExpiry(seconds) {
  return new Date(Date.now() + seconds * 1000).toISOString()
}

function randomHole(exclude) {
  let idx
  do { idx = Math.floor(Math.random() * HOLE_COUNT) } while (idx === exclude && HOLE_COUNT > 1)
  return idx
}

// Each level has a whack target and its own clock: reach the target to pass
// and face a higher target next time. Running out of the level's time
// before hitting the target fails it but not the kid's progress -- it saves
// server-side and the next attempt (now, or next time they play) resumes at
// the same level rather than level 1. Tapping an empty hole just plays a
// miss sound -- it doesn't end the level on its own, only the clock does.
export default function WhackAMoleGame({ session, onExit, onGameOver }) {
  const initialLevel = session.startLevel || 1
  const [level, setLevel] = useState(initialLevel)
  const [bestLevel, setBestLevel] = useState(Math.max(0, initialLevel - 1))
  const [activeIndex, setActiveIndex] = useState(null)
  const [score, setScore] = useState(0)
  const [roundResult, setRoundResult] = useState(null) // 'pass' | 'fail' | null
  const [levelExpiresAt, setLevelExpiresAt] = useState(() => newExpiry(levelSecondsForTarget(targetForLevel(initialLevel))))
  const { remainingMs, timeUp } = useCountdown(session.expiresAt)
  const { remainingMs: levelRemainingMs, timeUp: levelTimeUp } = useCountdown(levelExpiresAt)
  useReportScoreOnGameOver(timeUp, bestLevel, onGameOver)

  // Guardian "Try It" previews have no gameId (they're not a real kid's
  // session), so progress just isn't saved there -- every preview starts
  // fresh at level 1.
  const saveProgress = useCallback((lvl) => {
    if (session.gameId) api.saveGameProgress(session.gameId, lvl).catch(() => {})
  }, [session.gameId])
  const popTimeoutRef = useRef(null)
  const hideTimeoutRef = useRef(null)
  const activeIndexRef = useRef(null)
  const scoreRef = useRef(0)

  const target = targetForLevel(level)

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
    if (timeUp || roundResult) { clearTimers(); return }
    scheduleNextPop(500)
    return clearTimers
  }, [timeUp, roundResult, scheduleNextPop, clearTimers])

  // Running out of the level's own clock before reaching its target fails it.
  useEffect(() => {
    if (timeUp || roundResult || !levelTimeUp) return
    playWrongSound()
    setRoundResult('fail')
    saveProgress(level)
  }, [levelTimeUp, timeUp, roundResult, level, saveProgress])

  function handleWhack(idx) {
    if (timeUp || roundResult) return
    if (idx !== activeIndexRef.current) {
      playWrongSound()
      return
    }
    playCorrectSound()
    clearTimeout(hideTimeoutRef.current)
    activeIndexRef.current = null
    setActiveIndex(null)
    const nextScore = scoreRef.current + 1
    scoreRef.current = nextScore
    setScore(nextScore)
    if (nextScore >= target) {
      setRoundResult('pass')
    } else {
      scheduleNextPop(200 + Math.random() * 250)
    }
  }

  function startLevel(targetLevel) {
    scoreRef.current = 0
    activeIndexRef.current = null
    setLevel(targetLevel)
    setScore(0)
    setActiveIndex(null)
    setLevelExpiresAt(newExpiry(levelSecondsForTarget(targetForLevel(targetLevel))))
    setRoundResult(null)
  }

  function handleContinue() {
    setBestLevel(b => Math.max(b, level))
    startLevel(level + 1)
    saveProgress(level + 1)
  }

  function handleRetry() {
    startLevel(level)
  }

  function handleRestart() {
    startLevel(1)
    saveProgress(1)
  }

  const levelUrgent = levelRemainingMs < 8000

  return (
    <div style={{ maxWidth: 380, margin: '0 auto' }}>
      <GameHeader onExit={onExit} gameName={session.gameName} status={`Level ${level} · Best: ${bestLevel}`} remainingMs={remainingMs} timeUp={timeUp} />

      {timeUp ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 10 }}>🐹</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>Time's up!</div>
          <div style={{ fontSize: '0.88rem', color: '#64748b', marginTop: 6 }}>You reached level {bestLevel}.</div>
          <button className="btn btn-outline" style={{ marginTop: 18 }} onClick={onExit}>Back to Games</button>
        </div>
      ) : roundResult === 'pass' ? (
        <LevelResultCard
          result="pass" level={level} nextLevel={level + 1}
          subtext={`Whacked ${target} moles to clear this level.`}
          onContinue={handleContinue}
        />
      ) : roundResult === 'fail' ? (
        <LevelResultCard
          result="fail" level={level}
          subtext={`Got ${score} of ${target} needed.`}
          onRetry={handleRetry}
          onRestart={handleRestart}
        />
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Whacked: {score} / {target}</span>
            <span style={{
              fontSize: '0.85rem', fontWeight: 700, borderRadius: 999, padding: '4px 12px',
              background: levelUrgent ? '#fed7aa' : '#f1f5f9', color: levelUrgent ? '#c2410c' : '#64748b',
            }}>
              ⏳ {Math.max(0, Math.ceil(levelRemainingMs / 1000))}s left this level
            </span>
          </div>
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
        </>
      )}
    </div>
  )
}
