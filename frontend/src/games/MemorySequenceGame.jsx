import { useState, useRef, useEffect, useCallback } from 'react'
import { api } from '../api.js'
import { useCountdown } from './useCountdown.js'
import { useReportScoreOnGameOver } from './useReportScoreOnGameOver.js'
import { playCorrectSound, playWrongSound } from './gameSounds.js'
import GameHeader from './GameHeader.jsx'
import LevelResultCard from './LevelResultCard.jsx'

const PADS = [
  { color: '#dc2626', lit: '#fca5a5' },
  { color: '#2563eb', lit: '#93c5fd' },
  { color: '#16a34a', lit: '#86efac' },
  { color: '#ca8a04', lit: '#fde047' },
]

const ROUNDS_PER_LEVEL = 10

function randomPad() {
  return Math.floor(Math.random() * PADS.length)
}

function randomSequence(length) {
  return Array.from({ length }, randomPad)
}

// The pattern length a level's gauntlet starts at -- level 1 is patterns
// 1-10 steps long, level 2 is 11-20, and so on, so resuming "at level 3"
// means picking back up at a 21-step pattern, not a 1-step one.
function startLengthForLevel(level) {
  return (level - 1) * ROUNDS_PER_LEVEL + 1
}

function levelSecondsForLength(length) {
  return 4 + length * 2.5
}

function newExpiry(seconds) {
  return new Date(Date.now() + seconds * 1000).toISOString()
}

// Simon-Says style: watch a growing sequence flash, then repeat it by
// tapping the same pads in order. The pattern keeps growing by one pad
// after every successful repeat -- that escalation is the whole appeal of
// the game -- but a "level" is a real difficulty tier, not a single
// repeat: it takes ROUNDS_PER_LEVEL successful repeats in a row to clear
// one, same weight as every other game's per-level question/action count.
// Missing a pad, or running out of that attempt's own clock, fails the
// level but not the kid's progress -- it saves server-side and the next
// attempt (now, or next time they play) resumes at the same level rather
// than level 1.
export default function MemorySequenceGame({ session, onExit, onGameOver }) {
  const initialLevel = session.startLevel || 1
  const [sequence, setSequence] = useState(() => randomSequence(startLengthForLevel(initialLevel)))
  const [pendingNext, setPendingNext] = useState(null)
  const [activePad, setActivePad] = useState(null)
  const [pressedPad, setPressedPad] = useState(null)
  const [phase, setPhase] = useState('showing') // 'showing' | 'input' | 'wrong' | 'level-complete' | 'level-failed'
  const [level, setLevel] = useState(initialLevel)
  const [bestLevel, setBestLevel] = useState(Math.max(0, initialLevel - 1))
  const [roundInLevel, setRoundInLevel] = useState(0) // successful repeats so far this level
  const [levelExpiresAt, setLevelExpiresAt] = useState(() => newExpiry(levelSecondsForLength(startLengthForLevel(initialLevel))))
  const inputIndexRef = useRef(0)
  const cancelledRef = useRef(false)
  const pressTimeoutRef = useRef(null)
  const levelTimeoutHandledRef = useRef(false)
  const { remainingMs, timeUp } = useCountdown(session.expiresAt)
  const { remainingMs: levelRemainingMs, timeUp: levelTimeUp } = useCountdown(levelExpiresAt)
  useReportScoreOnGameOver(timeUp, bestLevel, onGameOver)

  // Guardian "Try It" previews have no gameId (they're not a real kid's
  // session), so progress just isn't saved there -- every preview starts
  // fresh at level 1.
  const saveProgress = useCallback((lvl) => {
    if (session.gameId) api.saveGameProgress(session.gameId, lvl).catch(() => {})
  }, [session.gameId])

  useEffect(() => {
    if (timeUp) cancelledRef.current = true
  }, [timeUp])

  useEffect(() => () => clearTimeout(pressTimeoutRef.current), [])

  const playSequence = useCallback((seq) => {
    setPhase('showing')
    inputIndexRef.current = 0
    let i = 0
    function step() {
      if (cancelledRef.current) return
      if (i >= seq.length) {
        setActivePad(null)
        setPhase('input')
        levelTimeoutHandledRef.current = false
        setLevelExpiresAt(newExpiry(levelSecondsForLength(seq.length)))
        return
      }
      setActivePad(seq[i])
      setTimeout(() => {
        if (cancelledRef.current) return
        setActivePad(null)
        setTimeout(() => {
          if (cancelledRef.current) return
          i += 1
          step()
        }, 200)
      }, 500)
    }
    step()
  }, [])

  useEffect(() => {
    playSequence(sequence)
    // Only ever run for the very first sequence -- every later one is
    // started explicitly from handleContinue/handleTap/handleRetryLevel,
    // which already have the fresh array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fails the level: a brief "Oops" flash, then a pause card (same pattern
  // as every other game's LevelResultCard) rather than silently restarting
  // -- a kid should see they failed and choose to retry this level or start
  // over, not have it happen automatically underneath them.
  const failLevel = useCallback(() => {
    setPhase('wrong')
    saveProgress(level)
    setTimeout(() => {
      if (cancelledRef.current) return
      setPhase('level-failed')
    }, 700)
  }, [level, saveProgress])

  // Running out of this attempt's own clock before finishing the sequence
  // fails the level, same as tapping the wrong pad. Guarded with a ref
  // rather than relying on `phase` alone in the dependency array --
  // setPhase('wrong') below would otherwise re-run this effect and re-fire it.
  useEffect(() => {
    if (timeUp || phase !== 'input' || !levelTimeUp || levelTimeoutHandledRef.current) return
    levelTimeoutHandledRef.current = true
    playWrongSound()
    failLevel()
  }, [levelTimeUp, timeUp, phase, failLevel])

  function handleTap(padIndex) {
    if (timeUp || phase !== 'input') return

    // Press feedback so a tap always visibly registers, independent of
    // whether it turns out to be right or wrong -- without this the pad
    // grid looked completely inert between the "watch" and "result" beats.
    setPressedPad(padIndex)
    clearTimeout(pressTimeoutRef.current)
    pressTimeoutRef.current = setTimeout(() => {
      if (!cancelledRef.current) setPressedPad(null)
    }, 180)

    const expected = sequence[inputIndexRef.current]
    if (padIndex !== expected) {
      playWrongSound()
      failLevel()
      return
    }
    inputIndexRef.current += 1
    if (inputIndexRef.current === sequence.length) {
      playCorrectSound()
      const nextRoundInLevel = roundInLevel + 1
      const next = [...sequence, randomPad()]
      if (nextRoundInLevel >= ROUNDS_PER_LEVEL) {
        setBestLevel(b => Math.max(b, level))
        setRoundInLevel(nextRoundInLevel)
        setPendingNext(next)
        setPhase('level-complete')
      } else {
        setRoundInLevel(nextRoundInLevel)
        setSequence(next)
        playSequence(next)
      }
    }
  }

  function handleContinue() {
    if (!pendingNext || cancelledRef.current) return
    const next = pendingNext
    const nextLevel = level + 1
    setPendingNext(null)
    setLevel(nextLevel)
    setRoundInLevel(0)
    setSequence(next)
    playSequence(next)
    saveProgress(nextLevel)
  }

  // Retries the same level -- a fresh pattern at that level's own starting
  // length, not the 1-step pattern level 1 would start with.
  function handleRetryLevel() {
    if (cancelledRef.current) return
    const fresh = randomSequence(startLengthForLevel(level))
    setRoundInLevel(0)
    setSequence(fresh)
    playSequence(fresh)
  }

  function handleRestart() {
    if (cancelledRef.current) return
    const fresh = randomSequence(1)
    setLevel(1)
    setRoundInLevel(0)
    setSequence(fresh)
    playSequence(fresh)
    saveProgress(1)
  }

  const instructionStyles = {
    showing: { bg: '#f0fdfa', border: '#99f6e4', color: '#0d9488', text: '👀 Watch the pattern...' },
    input: { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8', text: '👆 Your turn -- repeat it back' },
    wrong: { bg: '#fef2f2', border: '#fecaca', color: '#dc2626', text: '❌ Oops!' },
  }
  const levelUrgent = phase === 'input' && levelRemainingMs < 3000

  return (
    <div style={{ maxWidth: 360, margin: '0 auto' }}>
      <GameHeader onExit={onExit} gameName={session.gameName} status={`Level ${level} · Best: ${bestLevel}`} remainingMs={remainingMs} timeUp={timeUp} />

      {timeUp ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 10 }}>🎵</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>Time's up!</div>
          <div style={{ fontSize: '0.88rem', color: '#64748b', marginTop: 6 }}>You reached level {bestLevel}.</div>
          <button className="btn btn-outline" style={{ marginTop: 18 }} onClick={onExit}>Back to Games</button>
        </div>
      ) : phase === 'level-complete' ? (
        <div style={{ textAlign: 'center', padding: '34px 20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 16 }}>
          <div style={{ fontSize: '2.6rem', marginBottom: 8 }}>🎉</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#166534' }}>Level {level} complete!</div>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 6 }}>
            Cleared {ROUNDS_PER_LEVEL} patterns, up to {sequence.length} steps long.
          </div>
          <button className="btn btn-green" style={{ marginTop: 18 }} onClick={handleContinue}>
            Continue to Level {level + 1} →
          </button>
        </div>
      ) : phase === 'level-failed' ? (
        <LevelResultCard
          result="fail" level={level}
          subtext={`Cleared ${roundInLevel} of ${ROUNDS_PER_LEVEL} patterns in this level.`}
          onRetry={handleRetryLevel}
          onRestart={handleRestart}
        />
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{
              flex: 1, textAlign: 'center', fontSize: '0.95rem', fontWeight: 700,
              padding: '10px 14px', borderRadius: 10,
              background: instructionStyles[phase].bg,
              border: `1px solid ${instructionStyles[phase].border}`,
              color: instructionStyles[phase].color,
            }}>
              {instructionStyles[phase].text}
            </div>
            {phase === 'input' && (
              <span style={{
                fontSize: '0.85rem', fontWeight: 700, borderRadius: 999, padding: '4px 12px', flexShrink: 0,
                background: levelUrgent ? '#fed7aa' : '#f1f5f9', color: levelUrgent ? '#c2410c' : '#64748b',
              }}>
                ⏳ {Math.max(0, Math.ceil(levelRemainingMs / 1000))}s
              </span>
            )}
          </div>
          <div style={{ textAlign: 'center', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: 10 }}>
            Pattern {roundInLevel + 1} of {ROUNDS_PER_LEVEL} · {sequence.length} step{sequence.length === 1 ? '' : 's'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {PADS.map((pad, i) => {
              const isShowingActive = phase === 'showing' && activePad === i
              const isDimmedByShow = phase === 'showing' && activePad !== null && activePad !== i
              const isPressed = pressedPad === i
              return (
                <button
                  key={i}
                  onClick={() => handleTap(i)}
                  disabled={phase !== 'input'}
                  style={{
                    aspectRatio: '1', borderRadius: 16, border: 'none',
                    cursor: phase === 'input' ? 'pointer' : 'default',
                    background: isShowingActive ? pad.lit : pad.color,
                    // Dimming via opacity fades a saturated color toward the page's
                    // light background, which lands close to the same pale look as
                    // the "lit" active color -- the two states became visually
                    // indistinguishable and it read as every pad dimming together.
                    // brightness() darkens the color itself instead, so a dimmed
                    // pad stays clearly its own (darker) hue, never pastel.
                    filter: isDimmedByShow ? 'brightness(0.45)' : isPressed ? 'brightness(0.7)' : 'none',
                    boxShadow: isShowingActive ? '0 0 0 4px rgba(255,255,255,0.7) inset' : 'none',
                    transition: 'background 0.15s ease, filter 0.15s ease, box-shadow 0.15s ease',
                  }}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
