import { useState, useEffect, useRef, useCallback } from 'react'
import { useCountdown } from './useCountdown.js'
import { useReportScoreOnGameOver } from './useReportScoreOnGameOver.js'
import { playCorrectSound, playWrongSound } from './gameSounds.js'
import GameHeader from './GameHeader.jsx'
import LevelResultCard from './LevelResultCard.jsx'

const GRID_SIZE = 13
const TICK_MS = 150
const START_SNAKE = [{ x: 6, y: 6 }, { x: 5, y: 6 }, { x: 4, y: 6 }]
const DIRECTIONS = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }
const KEY_MAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' }

function targetForLevel(level) {
  return 2 + level
}

function levelSecondsForTarget(target) {
  return 15 + target * 6
}

function newExpiry(seconds) {
  return new Date(Date.now() + seconds * 1000).toISOString()
}

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
// Each level has a food target and its own clock: reach the target to pass
// and face a higher target on a fresh board; crashing, or running out of
// the level's time before hitting the target, fails the level and drops
// back to level 1's smaller target.
export default function SnakeGame({ session, onExit, onGameOver }) {
  const [level, setLevel] = useState(1)
  const [bestLevel, setBestLevel] = useState(0)
  const [snake, setSnake] = useState(START_SNAKE)
  const [food, setFood] = useState(() => randomFood(START_SNAKE))
  const [score, setScore] = useState(0)
  const [roundResult, setRoundResult] = useState(null) // 'pass' | 'fail' | null
  const [levelExpiresAt, setLevelExpiresAt] = useState(() => newExpiry(levelSecondsForTarget(targetForLevel(1))))
  const dirRef = useRef(DIRECTIONS.right)
  // The tick interval reads these instead of `snake`/`score` state directly, so the
  // interval doesn't need to be torn down and recreated every tick just to stay
  // current -- it's recreated only on roundResult/timeUp/food changes (see below).
  const snakeRef = useRef(START_SNAKE)
  const scoreRef = useRef(0)
  const { remainingMs, timeUp } = useCountdown(session.expiresAt)
  const { remainingMs: levelRemainingMs, timeUp: levelTimeUp } = useCountdown(levelExpiresAt)
  useReportScoreOnGameOver(timeUp, bestLevel, onGameOver)

  const target = targetForLevel(level)

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

  // Running out of the level's own clock before reaching its target fails
  // it, same as crashing.
  useEffect(() => {
    if (timeUp || roundResult || !levelTimeUp) return
    playWrongSound()
    setRoundResult('fail')
  }, [levelTimeUp, timeUp, roundResult])

  useEffect(() => {
    if (roundResult || timeUp) return
    const interval = setInterval(() => {
      const prev = snakeRef.current
      const dir = dirRef.current
      const head = prev[0]
      const newHead = { x: head.x + dir.x, y: head.y + dir.y }

      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        playWrongSound()
        setRoundResult('fail')
        return
      }

      const willEat = newHead.x === food.x && newHead.y === food.y
      // The tail cell vacates this tick unless the snake is growing, so it's
      // safe to move into it -- only check the segments that stay put.
      const bodyToCheck = willEat ? prev : prev.slice(0, -1)
      if (bodyToCheck.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
        playWrongSound()
        setRoundResult('fail')
        return
      }

      const newSnake = willEat ? [newHead, ...prev] : [newHead, ...prev.slice(0, -1)]
      snakeRef.current = newSnake
      setSnake(newSnake)
      if (willEat) {
        playCorrectSound()
        const nextScore = scoreRef.current + 1
        scoreRef.current = nextScore
        setScore(nextScore)
        if (nextScore >= target) {
          setRoundResult('pass')
        } else {
          setFood(randomFood(newSnake))
        }
      }
    }, TICK_MS)
    return () => clearInterval(interval)
  }, [roundResult, timeUp, food, target])

  function startLevel(targetLevel) {
    snakeRef.current = START_SNAKE
    scoreRef.current = 0
    setLevel(targetLevel)
    setSnake(START_SNAKE)
    setFood(randomFood(START_SNAKE))
    setScore(0)
    dirRef.current = DIRECTIONS.right
    setLevelExpiresAt(newExpiry(levelSecondsForTarget(targetForLevel(targetLevel))))
    setRoundResult(null)
  }

  function handleContinue() {
    setBestLevel(b => Math.max(b, level))
    startLevel(level + 1)
  }

  function handleRetry() {
    startLevel(1)
  }

  const snakeSet = new Set(snake.map(s => `${s.x},${s.y}`))
  const headKey = `${snake[0].x},${snake[0].y}`
  const levelUrgent = levelRemainingMs < 8000

  return (
    <div style={{ maxWidth: 380, margin: '0 auto' }}>
      <GameHeader onExit={onExit} gameName={session.gameName} status={`Level ${level} · Best: ${bestLevel}`} remainingMs={remainingMs} timeUp={timeUp} />

      {timeUp ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 10 }}>🐍</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>Time's up!</div>
          <div style={{ fontSize: '0.88rem', color: '#64748b', marginTop: 6 }}>You reached level {bestLevel}.</div>
          <button className="btn btn-outline" style={{ marginTop: 18 }} onClick={onExit}>Back to Games</button>
        </div>
      ) : roundResult === 'pass' ? (
        <LevelResultCard
          result="pass" level={level} nextLevel={level + 1}
          subtext={`Ate ${target} food to clear this level.`}
          onContinue={handleContinue}
        />
      ) : roundResult === 'fail' ? (
        <LevelResultCard
          result="fail" level={level}
          subtext={`Got ${score} of ${target} needed.`}
          onRetry={handleRetry}
        />
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Food: {score} / {target}</span>
            <span style={{
              fontSize: '0.85rem', fontWeight: 700, borderRadius: 999, padding: '4px 12px',
              background: levelUrgent ? '#fed7aa' : '#f1f5f9', color: levelUrgent ? '#c2410c' : '#64748b',
            }}>
              ⏳ {Math.max(0, Math.ceil(levelRemainingMs / 1000))}s left this level
            </span>
          </div>
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
