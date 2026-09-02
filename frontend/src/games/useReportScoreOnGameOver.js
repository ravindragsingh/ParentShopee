import { useEffect, useRef } from 'react'

// Calls onGameOver(score) exactly once, the first time `ended` becomes true --
// every game's pass concludes exactly once (time runs out, or a
// win/completion state that ends the pass), so this is shared instead of each
// game re-implementing its own "don't double-report" guard.
export function useReportScoreOnGameOver(ended, score, onGameOver) {
  const reported = useRef(false)
  useEffect(() => {
    if (ended && !reported.current && onGameOver) {
      reported.current = true
      onGameOver(score)
    }
  }, [ended, score, onGameOver])
}
