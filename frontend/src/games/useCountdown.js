import { useState, useEffect, useMemo } from 'react'

// Ticks down to a game pass's expiresAt once per second. Every game screen
// needs this same "how much play time is left" state.
export function useCountdown(expiresAt) {
  const expiresAtMs = useMemo(() => new Date(expiresAt).getTime(), [expiresAt])
  const [remainingMs, setRemainingMs] = useState(() => expiresAtMs - Date.now())

  useEffect(() => {
    const tick = () => setRemainingMs(expiresAtMs - Date.now())
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [expiresAtMs])

  return { remainingMs, timeUp: remainingMs <= 0 }
}
