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

const RING_RADIUS = 46
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS
const CONFETTI = ['🎉', '✨', '⭐', '🎊']

// A big, bouncy circular countdown a kid can start right from the activity
// card -- no account/server state, purely a stopwatch to help them actually
// do the timed activity rather than guess at "10-15 min". `color` ties its
// ring to the quest category's own color so it doesn't look bolted-on.
// Celebrates finishing with the same confetti-burst language as the rest of
// the app (see futureready/Reaction.jsx), plus a generated chime and a
// gentle vibration where supported.
export default function ActivityTimer({ minutes, color = '#0d9488' }) {
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
          setRunning(false)
          setCelebrating(true)
          if (audioCtxRef.current) playChime(audioCtxRef.current)
          if (navigator.vibrate) navigator.vibrate([120, 60, 120, 60, 220])
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running])

  // The celebration (bounce + confetti) plays once right when the timer
  // hits zero, then settles into the plain "finished" look -- so it doesn't
  // keep re-bursting every time this component re-renders.
  useEffect(() => {
    if (!celebrating) return
    const t = setTimeout(() => setCelebrating(false), 1000)
    return () => clearTimeout(t)
  }, [celebrating])

  const finished = secondsLeft === 0
  const started = secondsLeft < totalSeconds
  const pct = secondsLeft / totalSeconds
  const dashOffset = RING_CIRCUMFERENCE * (1 - pct)

  function toggle() {
    // AudioContext must be created/resumed from inside a real tap for the
    // chime to be allowed to play later, unprompted, when time runs out.
    if (!audioCtxRef.current && (window.AudioContext || window.webkitAudioContext)) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    } else if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume()
    }
    if (finished) {
      setSecondsLeft(totalSeconds)
      setRunning(true)
    } else {
      setRunning(r => !r)
    }
  }

  function reset() {
    setRunning(false)
    setCelebrating(false)
    setSecondsLeft(totalSeconds)
  }

  return (
    <div style={{
      position: 'relative', display: 'flex', alignItems: 'center', gap: 16, marginTop: 14, marginBottom: 4,
      background: finished ? '#f0fdf4' : '#f8fafc', border: `2px solid ${finished ? '#86efac' : '#e2e8f0'}`,
      borderRadius: 18, padding: '14px 16px', overflow: 'hidden',
      transition: 'background 0.3s ease, border-color 0.3s ease',
    }}>
      {celebrating && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden="true">
          {CONFETTI.map((p, i) => <span key={i} className={`confetti-piece confetti-${i}`} style={{ left: '15%', top: '50%', fontSize: '1.3rem' }}>{p}</span>)}
        </div>
      )}

      <button
        type="button"
        onClick={toggle}
        aria-label={running ? 'Pause timer' : finished ? 'Restart timer' : 'Start timer'}
        style={{ position: 'relative', width: 86, height: 86, flexShrink: 0, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
      >
        <svg width="86" height="86" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="50" cy="50" r={RING_RADIUS} fill="none" stroke="#e2e8f0" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={RING_RADIUS} fill="none" stroke={finished ? '#22c55e' : color} strokeWidth="8"
            strokeLinecap="round" strokeDasharray={RING_CIRCUMFERENCE} strokeDashoffset={dashOffset}
            style={{ transition: running ? 'stroke-dashoffset 1s linear' : 'stroke-dashoffset 0.3s ease' }}
          />
        </svg>
        <div
          key={finished ? 'finished' : running ? 'running' : started ? 'paused' : 'idle'}
          className="mascot-face"
          style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: finished ? '2.1rem' : running || started ? '1.6rem' : '1.15rem',
            fontWeight: 800, color: finished ? '#16a34a' : '#334155', lineHeight: 1,
          }}
        >
          {finished ? '🎉' : running ? '⏸' : started ? '▶️' : formatTime(secondsLeft)}
        </div>
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: '1rem', color: finished ? '#166534' : '#1e293b' }}>
          {finished ? "Time's up! Awesome work! 🎉" : running ? `⏳ ${formatTime(secondsLeft)} left — keep going!` : started ? `⏸ Paused · ${formatTime(secondsLeft)} left` : `${minutes} min timer`}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 3 }}>
          {finished ? "Tell your guardian about it below!" : "Tap the circle to start, then dive in!"}
        </div>
      </div>

      {started && !finished && (
        <button
          type="button"
          onClick={reset}
          title="Reset timer"
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.3rem', flexShrink: 0, padding: 6 }}
        >
          🔁
        </button>
      )}
    </div>
  )
}
