import { useState, useRef, useEffect, useCallback } from 'react'
import { useCountdown } from './useCountdown.js'
import { useReportScoreOnGameOver } from './useReportScoreOnGameOver.js'
import { playCorrectSound, playWrongSound } from './gameSounds.js'
import GameHeader from './GameHeader.jsx'

const PADS = [
  { color: '#dc2626', lit: '#fca5a5' },
  { color: '#2563eb', lit: '#93c5fd' },
  { color: '#16a34a', lit: '#86efac' },
  { color: '#ca8a04', lit: '#fde047' },
]

function randomPad() {
  return Math.floor(Math.random() * PADS.length)
}

function levelSecondsForLength(length) {
  return 4 + length * 2.5
}

function newExpiry(seconds) {
  return new Date(Date.now() + seconds * 1000).toISOString()
}

// Simon-Says style: watch a growing sequence flash, then repeat it by
// tapping the same pads in order. Getting one wrong, or running out of
// that attempt's own clock before finishing, resets to a fresh 1-pad
// sequence -- same as every other game here, only the overall pass
// countdown ends things for good. Score is the longest sequence ever
// completed, not the current one, since a late mistake shouldn't erase an
// earlier best.
//
// Finishing a sequence pauses on a "Level complete" card instead of
// immediately flashing a longer one -- auto-advancing forever made it feel
// like one continuous, monotonous loop rather than a series of distinct
// levels with a real sense of progress.
export default function MemorySequenceGame({ session, onExit, onGameOver }) {
  const [sequence, setSequence] = useState(() => [randomPad()])
  const [pendingNext, setPendingNext] = useState(null)
  const [activePad, setActivePad] = useState(null)
  const [pressedPad, setPressedPad] = useState(null)
  const [phase, setPhase] = useState('showing') // 'showing' | 'input' | 'wrong' | 'level-complete'
  const [level, setLevel] = useState(0)
  const [levelExpiresAt, setLevelExpiresAt] = useState(() => newExpiry(levelSecondsForLength(1)))
  const inputIndexRef = useRef(0)
  const cancelledRef = useRef(false)
  const pressTimeoutRef = useRef(null)
  const levelTimeoutHandledRef = useRef(false)
  const { remainingMs, timeUp } = useCountdown(session.expiresAt)
  const { remainingMs: levelRemainingMs, timeUp: levelTimeUp } = useCountdown(levelExpiresAt)
  useReportScoreOnGameOver(timeUp, level, onGameOver)

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
    // started explicitly from handleContinue, which already has the fresh array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const failToLevelOne = useCallback(() => {
    setPhase('wrong')
    setTimeout(() => {
      if (cancelledRef.current) return
      const fresh = [randomPad()]
      setSequence(fresh)
      playSequence(fresh)
    }, 700)
  }, [playSequence])

  // Running out of this attempt's own clock before finishing the sequence
  // fails it, same as tapping the wrong pad. Guarded with a ref rather than
  // relying on `phase` alone in the dependency array -- setPhase('wrong')
  // below would otherwise re-run this effect and re-fire it.
  useEffect(() => {
    if (timeUp || phase !== 'input' || !levelTimeUp || levelTimeoutHandledRef.current) return
    levelTimeoutHandledRef.current = true
    playWrongSound()
    failToLevelOne()
  }, [levelTimeUp, timeUp, phase, failToLevelOne])

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
      failToLevelOne()
      return
    }
    inputIndexRef.current += 1
    if (inputIndexRef.current === sequence.length) {
      playCorrectSound()
      setLevel(l => Math.max(l, sequence.length))
      setPendingNext([...sequence, randomPad()])
      setPhase('level-complete')
    }
  }

  function handleContinue() {
    if (!pendingNext || cancelledRef.current) return
    const next = pendingNext
    setPendingNext(null)
    setSequence(next)
    playSequence(next)
  }

  const instructionStyles = {
    showing: { bg: '#f0fdfa', border: '#99f6e4', color: '#0d9488', text: '👀 Watch the pattern...' },
    input: { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8', text: '👆 Your turn -- repeat it back' },
    wrong: { bg: '#fef2f2', border: '#fecaca', color: '#dc2626', text: '❌ Oops! New pattern starting...' },
  }
  const levelUrgent = phase === 'input' && levelRemainingMs < 3000

  return (
    <div style={{ maxWidth: 360, margin: '0 auto' }}>
      <GameHeader onExit={onExit} gameName={session.gameName} status={`Level ${sequence.length} · Best: ${level}`} remainingMs={remainingMs} timeUp={timeUp} />

      {timeUp ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 10 }}>🎵</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>Time's up!</div>
          <div style={{ fontSize: '0.88rem', color: '#64748b', marginTop: 6 }}>Longest pattern: {level}</div>
          <button className="btn btn-outline" style={{ marginTop: 18 }} onClick={onExit}>Back to Games</button>
        </div>
      ) : phase === 'level-complete' ? (
        <div style={{ textAlign: 'center', padding: '34px 20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 16 }}>
          <div style={{ fontSize: '2.6rem', marginBottom: 8 }}>🎉</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#166534' }}>Level {sequence.length} complete!</div>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 6 }}>
            Ready to try a {pendingNext?.length}-step pattern?
          </div>
          <button className="btn btn-green" style={{ marginTop: 18 }} onClick={handleContinue}>
            Continue to Level {pendingNext?.length} →
          </button>
        </div>
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
