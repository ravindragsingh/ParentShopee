import { useState, useEffect } from 'react'
import { useCountdown } from './useCountdown.js'
import { useReportScoreOnGameOver } from './useReportScoreOnGameOver.js'
import { playCorrectSound, playWrongSound } from './gameSounds.js'
import GameHeader from './GameHeader.jsx'
import LevelResultCard from './LevelResultCard.jsx'

const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]
const EMPTY_BOARD = Array(9).fill(null)

function levelSeconds() {
  return 30
}

function newExpiry(seconds) {
  return new Date(Date.now() + seconds * 1000).toISOString()
}

function checkWinner(board) {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a]
  }
  return board.every(Boolean) ? 'draw' : null
}

// Not unbeatable (no full minimax), but plays solidly: take a winning move,
// otherwise block the kid's, otherwise center/corner/edge in that order.
function pickAiMove(board) {
  const empty = board.map((v, i) => (v ? null : i)).filter(i => i !== null)
  for (const i of empty) {
    const copy = [...board]; copy[i] = 'O'
    if (checkWinner(copy) === 'O') return i
  }
  for (const i of empty) {
    const copy = [...board]; copy[i] = 'X'
    if (checkWinner(copy) === 'X') return i
  }
  if (!board[4]) return 4
  const corners = [0, 2, 6, 8].filter(i => !board[i])
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)]
  const edges = [1, 3, 5, 7].filter(i => !board[i])
  return edges[Math.floor(Math.random() * edges.length)]
}

// Each level is one game against the AI, with its own clock: win it to pass
// and face the next level; losing, drawing, or running out of the level's
// time mid-game fails it and drops back to level 1.
export default function TicTacToeGame({ session, onExit, onGameOver }) {
  const [level, setLevel] = useState(1)
  const [bestLevel, setBestLevel] = useState(0)
  const [board, setBoard] = useState(EMPTY_BOARD)
  const [winner, setWinner] = useState(null)
  const [aiThinking, setAiThinking] = useState(false)
  const [roundResult, setRoundResult] = useState(null) // 'pass' | 'fail' | null
  const [levelExpiresAt, setLevelExpiresAt] = useState(() => newExpiry(levelSeconds()))
  const { remainingMs, timeUp } = useCountdown(session.expiresAt)
  const { remainingMs: levelRemainingMs, timeUp: levelTimeUp } = useCountdown(levelExpiresAt)
  useReportScoreOnGameOver(timeUp, bestLevel, onGameOver)

  // Running out of the level's own clock mid-game fails it, same as a loss.
  useEffect(() => {
    if (timeUp || roundResult || winner || !levelTimeUp) return
    playWrongSound()
    setRoundResult('fail')
  }, [levelTimeUp, timeUp, roundResult, winner])

  useEffect(() => {
    if (!aiThinking || winner || roundResult) return
    const t = setTimeout(() => {
      const move = pickAiMove(board)
      if (move !== undefined) {
        const next = [...board]
        next[move] = 'O'
        setBoard(next)
        const result = checkWinner(next)
        if (result) {
          // Both a computer win and a draw fail the level -- only the kid
          // winning outright passes it.
          playWrongSound()
          setWinner(result)
          setTimeout(() => setRoundResult('fail'), 900)
        }
      }
      setAiThinking(false)
    }, 450)
    return () => clearTimeout(t)
  }, [aiThinking, winner, roundResult, board])

  function handleCellClick(i) {
    if (timeUp || roundResult || winner || aiThinking || board[i]) return
    const next = [...board]
    next[i] = 'X'
    setBoard(next)
    const result = checkWinner(next)
    if (result) {
      if (result === 'X') playCorrectSound()
      setWinner(result)
      setTimeout(() => setRoundResult(result === 'X' ? 'pass' : 'fail'), 900)
    } else {
      setAiThinking(true)
    }
  }

  function startLevel(targetLevel) {
    setLevel(targetLevel)
    setBoard(EMPTY_BOARD)
    setWinner(null)
    setAiThinking(false)
    setLevelExpiresAt(newExpiry(levelSeconds()))
    setRoundResult(null)
  }

  function handleContinue() {
    setBestLevel(b => Math.max(b, level))
    startLevel(level + 1)
  }

  function handleRetry() {
    startLevel(1)
  }

  const levelUrgent = levelRemainingMs < 8000
  const resultText = winner === 'X' ? 'You win! 🎉' : winner === 'O' ? 'Computer wins' : winner === 'draw' ? "It's a draw" : ''

  return (
    <div style={{ maxWidth: 360, margin: '0 auto' }}>
      <GameHeader onExit={onExit} gameName={session.gameName} status={`Level ${level} · Best: ${bestLevel}`} remainingMs={remainingMs} timeUp={timeUp} />

      {timeUp ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 10 }}>⭕</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>Time's up!</div>
          <div style={{ fontSize: '0.88rem', color: '#64748b', marginTop: 6 }}>You reached level {bestLevel}.</div>
          <button className="btn btn-outline" style={{ marginTop: 18 }} onClick={onExit}>Back to Games</button>
        </div>
      ) : roundResult === 'pass' ? (
        <LevelResultCard result="pass" level={level} nextLevel={level + 1} subtext="You win!" onContinue={handleContinue} />
      ) : roundResult === 'fail' ? (
        <LevelResultCard result="fail" level={level} subtext={resultText || 'Ran out of time.'} onRetry={handleRetry} />
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
            <span style={{
              fontSize: '0.85rem', fontWeight: 700, borderRadius: 999, padding: '4px 12px',
              background: levelUrgent ? '#fed7aa' : '#f1f5f9', color: levelUrgent ? '#c2410c' : '#64748b',
            }}>
              ⏳ {Math.max(0, Math.ceil(levelRemainingMs / 1000))}s left this level
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {board.map((cell, i) => (
              <button
                key={i}
                onClick={() => handleCellClick(i)}
                disabled={!!cell || !!winner || aiThinking}
                style={{
                  aspectRatio: '1', fontSize: '2.2rem', fontWeight: 800, borderRadius: 12,
                  border: '1px solid #e2e8f0', background: '#fff', cursor: cell || winner ? 'default' : 'pointer',
                  color: cell === 'X' ? '#0d9488' : '#ea580c',
                }}
              >
                {cell}
              </button>
            ))}
          </div>
          {aiThinking && (
            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8', marginTop: 10 }}>Computer is thinking...</div>
          )}
        </>
      )}
    </div>
  )
}
