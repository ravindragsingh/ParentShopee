import { useState, useEffect, useRef, useCallback } from 'react'
import { useCountdown } from './useCountdown.js'
import GameHeader from './GameHeader.jsx'

const GRID_SIZE = 13
const TICK_MS = 150
const START_SNAKE = [{ x: 6, y: 6 }, { x: 5, y: 6 }, { x: 4, y: 6 }]
const DIRECTIONS = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }
const KEY_MAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' }

function randomCell() {
  return { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) }
}

function randomFood(snake) {
  const occupied = new Set(snake.map(s => `${s.x},${s.y}`))
  let cell
  do { cell = randomCell() } while (occupied.has(`${cell.x},${cell.y}`))
  return cell
}

// Classic grid snake -- keyboard arrows on desktop, on-screen d-pad for touch
// (this app also ships as a Capacitor mobile app, so touch controls aren't optional).
// A crash shows "Game Over" and lets the kid restart the board without ending
// the purchased pass; only the pass timer running out ends the session for good.
export default function SnakeGame({ session, onExit }) {
  const [snake, setSnake] = useState(START_SNAKE)
  const [food, setFood] = useState(() => randomFood(START_SNAKE))
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const dirRef = useRef(DIRECTIONS.right)
  // The tick interval reads these instead of `snake`/`score` state directly, so the
  // interval doesn't need to be torn down and recreated every tick just to stay
  // current -- it's recreated only on gameOver/timeUp/food changes (see below).
  const snakeRef = useRef(START_SNAKE)
  const scoreRef = useRef(0)
  const { remainingMs, timeUp } = useCountdown(session.expiresAt)

  const setDirection = useCallback((dir) => {
    const cur = dirRef.current
    if (cur.x === -dir.x && cur.y === -dir.y) return // no instant reversal into your own neck
    dirRef.current = dir
  }, [])

  useEffect(() => {
    function handleKey(e) {
      const dirKey = KEY_MAP[e.key]
      if (!dirKey) return
      e.preventDefault()
      setDirection(DIRECTIONS[dirKey])
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [setDirection])

  useEffect(() => {
    if (gameOver || timeUp) return
    const interval = setInterval(() => {
      const prev = snakeRef.current
      const dir = dirRef.current
      const head = prev[0]
      const newHead = { x: head.x + dir.x, y: head.y + dir.y }

      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        setGameOver(true)
        return
      }

      const willEat = newHead.x === food.x && newHead.y === food.y
      // The tail cell vacates this tick unless the snake is growing, so it's
      // safe to move into it -- only check the segments that stay put.
      const bodyToCheck = willEat ? prev : prev.slice(0, -1)
      if (bodyToCheck.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
        setGameOver(true)
        return
      }

      const newSnake = willEat ? [newHead, ...prev] : [newHead, ...prev.slice(0, -1)]
      snakeRef.current = newSnake
      setSnake(newSnake)
      if (willEat) {
        const nextScore = scoreRef.current + 1
        scoreRef.current = nextScore
        setScore(nextScore)
        setBestScore(b => Math.max(b, nextScore))
        setFood(randomFood(newSnake))
      }
    }, TICK_MS)
    return () => clearInterval(interval)
  }, [gameOver, timeUp, food])

  function handleRestart() {
    snakeRef.current = START_SNAKE
    scoreRef.current = 0
    setSnake(START_SNAKE)
    setFood(randomFood(START_SNAKE))
    setScore(0)
    dirRef.current = DIRECTIONS.right
    setGameOver(false)
  }

  const snakeSet = new Set(snake.map(s => `${s.x},${s.y}`))
  const headKey = `${snake[0].x},${snake[0].y}`

  return (
    <div style={{ maxWidth: 380, margin: '0 auto' }}>
      <GameHeader onExit={onExit} status={`Score: ${score} · Best: ${bestScore}`} remainingMs={remainingMs} timeUp={timeUp} />

      {timeUp ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 10 }}>🐍</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>Time's up!</div>
          <div style={{ fontSize: '0.88rem', color: '#64748b', marginTop: 6 }}>Best score this session: {bestScore}</div>
          <button className="btn btn-outline" style={{ marginTop: 18 }} onClick={onExit}>Back to Games</button>
        </div>
      ) : (
        <>
          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gap: 2,
              background: '#0f172a', borderRadius: 12, padding: 6, aspectRatio: '1',
            }}>
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                const x = i % GRID_SIZE, y = Math.floor(i / GRID_SIZE)
                const key = `${x},${y}`
                const isHead = key === headKey
                const isBody = !isHead && snakeSet.has(key)
                const isFood = x === food.x && y === food.y
                return (
                  <div key={key} style={{
                    aspectRatio: '1', borderRadius: 3,
                    background: isHead ? '#059669' : isBody ? '#34d399' : isFood ? '#ef4444' : '#1e293b',
                  }} />
                )
              })}
            </div>

            {gameOver && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.85)', borderRadius: 12,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>Game Over</div>
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Score: {score}</div>
                <button className="btn btn-green btn-sm" onClick={handleRestart}>Play Again</button>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(2, 44px)', gap: 6, maxWidth: 190, margin: '16px auto 0' }}>
            <div />
            <button className="btn btn-outline" style={{ gridColumn: 2, gridRow: 1 }} onClick={() => setDirection(DIRECTIONS.up)}>▲</button>
            <div />
            <button className="btn btn-outline" style={{ gridColumn: 1, gridRow: 2 }} onClick={() => setDirection(DIRECTIONS.left)}>◀</button>
            <button className="btn btn-outline" style={{ gridColumn: 2, gridRow: 2 }} onClick={() => setDirection(DIRECTIONS.down)}>▼</button>
            <button className="btn btn-outline" style={{ gridColumn: 3, gridRow: 2 }} onClick={() => setDirection(DIRECTIONS.right)}>▶</button>
          </div>
        </>
      )}
    </div>
  )
}
