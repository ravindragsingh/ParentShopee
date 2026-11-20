import { useState, useEffect, useRef } from 'react'

// Activity durations are free-text, admin-authored strings ("10-15 min",
// "5 min", "A few minutes") -- not a number anywhere in the data model. Pulls
// out the digits and, for a range, uses the larger end so a kid never gets
// cut off mid-activity. Returns null (no timer shown) when nothing parses,
// e.g. "Ongoing" or a description with no time estimate at all.
export function parseDurationMinutes(duration) {
  if (!duration) return null
  const nums = duration.match(/\d+/g)
  if (!nums || !nums.length) return null
  return Math.max(...nums.map(Number))
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// A cheerful 4-note chime (no audio asset needed -- generated on the fly, so
// there's nothing to bundle and nothing that can 404). The AudioContext is
// created lazily from the Start tap itself (a real user gesture), not here,
// so the browser's autoplay policy never blocks it when the timer finishes
// on its own later.
function playChime(ctx) {
  const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    const t = ctx.currentTime + i * 0.14
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.25, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.36)
  })
}

const RING_RADIUS = 70
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS
const CONFETTI = ['🎉', '✨', '⭐', '🎊', '🌟']
const EXTEND_SECONDS = 2 * 60

// App's own brand teal (same gradient as every primary button/badge) --
// deliberately not category-tinted, so the timer always reads as "the app",
// not a per-category skin.
const TEAL = '#0d9488'
const TEAL_DARK = '#0f766e'

// A big, bouncy circular countdown a kid can start right from the activity
// card -- no account/server state, purely a stopwatch to help them actually
// do the timed activity rather than guess at "10-15 min". Celebrates
// finishing with the same confetti-burst language as the rest of the app
// (see futureready/Reaction.jsx), plus a generated chime and a gentle
// vibration where supported. A manual "Finish" ends the countdown early and
// plays the same celebration -- not every activity needs the full suggested
// time to count as done.
export default function ActivityTimer({ minutes }) {
  const totalSeconds = minutes * 60
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds)
  const [running, setRunning] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const intervalRef = useRef(null)
  const audioCtxRef = useRef(null)

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current)
          celebrate()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running])

  // The celebration (bounce + confetti) plays once right when the timer
  // finishes, then settles into the plain "finished" look -- so it doesn't
  // keep re-bursting every time this component re-renders.
  useEffect(() => {
    if (!celebrating) return
    const t = setTimeout(() => setCelebrating(false), 1100)
    return () => clearTimeout(t)
  }, [celebrating])

  const finished = secondsLeft === 0
  const started = secondsLeft < totalSeconds || finished
  const pct = totalSeconds ? secondsLeft / totalSeconds : 0
  // A finished ring reads as "complete", not "drained to zero" -- force it
  // fully drawn rather than following secondsLeft (which is 0 by then).
  const dashOffset = finished ? 0 : RING_CIRCUMFERENCE * (1 - Math.min(1, pct))

  function ensureAudioReady() {
    // AudioContext must be created/resumed from inside a real tap for the
    // chime to be allowed to play later, unprompted, when time runs out.
    if (!audioCtxRef.current && (window.AudioContext || window.webkitAudioContext)) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    } else if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume()
    }
  }

  function celebrate() {
    setRunning(false)
    setSecondsLeft(0)
    setCelebrating(true)
    if (audioCtxRef.current) playChime(audioCtxRef.current)
    if (navigator.vibrate) navigator.vibrate([120, 60, 120, 60, 220])
  }

  function start() {
    ensureAudioReady()
    setRunning(true)
  }

  function pause() {
    setRunning(false)
  }

  function finishNow() {
    ensureAudioReady()
    celebrate()
  }

  function restart() {
    setRunning(false)
    setCelebrating(false)
    setSecondsLeft(totalSeconds)
  }

  function extend() {
    setCelebrating(false)
    setSecondsLeft(EXTEND_SECONDS)
    setRunning(true)
  }

  const btnBase = {
    border: 'none', borderRadius: 12, padding: '11px 18px', fontWeight: 800, fontSize: '0.88rem',
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  }
  const btnPrimary = { ...btnBase, background: `linear-gradient(135deg, ${TEAL_DARK}, ${TEAL})`, color: '#fff' }
  const btnOutline = { ...btnBase, background: '#fff', color: TEAL_DARK, border: `1.5px solid ${TEAL}` }
  const btnGhostSmall = { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, padding: 4 }

  return (
    <div style={{
      position: 'relative', textAlign: 'center', marginTop: 14, marginBottom: 4, overflow: 'hidden',
      background: finished ? '#f0fdf4' : '#f0fdfa', border: `2px solid ${finished ? '#86efac' : '#99f6e4'}`,
      borderRadius: 20, padding: '20px 18px', transition: 'background 0.3s ease, border-color 0.3s ease',
    }}>
      {celebrating && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden="true">
          {CONFETTI.map((p, i) => (
            <span key={i} className={`confetti-piece confetti-${i}`} style={{ left: '50%', top: '38%', fontSize: '1.4rem' }}>{p}</span>
          ))}
        </div>
      )}

      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: finished ? '#166534' : '#0f766e', marginBottom: 14 }}>
        {finished ? "Time's up! Awesome work! 🎉" : running ? 'Keep going — you\'ve got this!' : started ? 'Paused — ready when you are.' : 'Ready for this activity?'}
      </div>

      <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto' }}>
        <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="80" cy="80" r={RING_RADIUS} fill="none" stroke="#e2e8f0" strokeWidth="11" />
          <circle
            cx="80" cy="80" r={RING_RADIUS} fill="none" stroke={finished ? '#22c55e' : TEAL} strokeWidth="11"
            strokeLinecap="round" strokeDasharray={RING_CIRCUMFERENCE} strokeDashoffset={dashOffset}
            style={{ transition: running ? 'stroke-dashoffset 1s linear' : 'stroke-dashoffset 0.3s ease' }}
          />
        </svg>
        <div
          key={finished ? 'finished' : running ? 'running' : started ? 'paused' : 'idle'}
          className="mascot-face"
          style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
        >
          {finished ? (
            <span style={{ fontSize: '3rem' }}>🌟</span>
          ) : (
            <>
              <span style={{ fontSize: '2.1rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{formatTime(secondsLeft)}</span>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#94a3b8', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                {started ? 'left' : `min${minutes === 1 ? '' : 's'}`}
              </span>
            </>
          )}
        </div>
      </div>

      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        {finished ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={extend} style={btnOutline}>+2 min</button>
            <button type="button" onClick={restart} style={btnPrimary}>🔁 Go again</button>
          </div>
        ) : !started ? (
          <button type="button" onClick={start} style={{ ...btnPrimary, padding: '13px 28px', fontSize: '0.95rem' }}>
            ▶️ Start timer
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            {running ? (
              <button type="button" onClick={pause} style={btnOutline}>⏸ Pause</button>
            ) : (
              <button type="button" onClick={start} style={btnOutline}>▶️ Resume</button>
            )}
            <button type="button" onClick={finishNow} style={btnPrimary}>✅ Finish activity</button>
          </div>
        )}

        {started && !finished && (
          <button type="button" onClick={restart} style={btnGhostSmall}>🔁 Reset</button>
        )}
        {!started && (
          <div style={{ fontSize: '0.76rem', color: '#64748b' }}>Or skip the timer — you can log it below anytime.</div>
        )}
      </div>
    </div>
  )
}
