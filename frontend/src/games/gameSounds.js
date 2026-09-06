// Shared correct/wrong feedback sounds for every game, plus a single mute
// switch all of them respect. Synthesized with the Web Audio API (a couple
// of oscillators + gain envelopes) instead of shipping audio files, and the
// AudioContext is created lazily on first call so the browser's
// user-gesture requirement is satisfied automatically (every call here
// happens from inside a click handler).

const MUTE_KEY = 'gamesSoundMuted'

export function isSoundMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

export function setSoundMuted(muted) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
  } catch {
    // Storage unavailable (private browsing, etc.) -- sound just stays
    // unmuted for the session instead of erroring.
  }
}

let audioCtx = null
function getAudioCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return null
    audioCtx = new Ctx()
  }
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

function playTone(freq, durationMs, type, startDelay) {
  const ctx = getAudioCtx()
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  const start = ctx.currentTime + startDelay
  const end = start + durationMs / 1000
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(0.22, start + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, end)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(start)
  osc.stop(end + 0.02)
}

// Bright ascending arpeggio for "that was right".
export function playCorrectSound() {
  if (isSoundMuted()) return
  playTone(523.25, 120, 'sine', 0)
  playTone(659.25, 150, 'sine', 0.1)
  playTone(783.99, 220, 'sine', 0.2)
}

// Low descending buzz for "that was wrong".
export function playWrongSound() {
  if (isSoundMuted()) return
  playTone(220, 180, 'square', 0)
  playTone(164.81, 260, 'square', 0.13)
}
