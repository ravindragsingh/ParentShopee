import { useState, useEffect } from 'react'
import { useCountdown } from './useCountdown.js'
import GameHeader from './GameHeader.jsx'

const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]
const EMPTY_BOARD = Array(9).fill(null)

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

export default function TicTacToeGame({ session, onExit }) {
  const [board, setBoard] = useState(EMPTY_BOARD)
  const [winner, setWinner] = useState(null)
  const [aiThinking, setAiThinking] = useState(false)
  const [tally, setTally] = useState({ wins: 0, losses: 0, draws: 0 })
  const { remainingMs, timeUp } = useCountdown(session.expiresAt)

  useEffect(() => {
    if (!aiThinking || winner) return
    const t = setTimeout(() => {
      const move = pickAiMove(board)
      if (move !== undefined) {
        const next = [...board]
        next[move] = 'O'
        setBoard(next)
        const result = checkWinner(next)
        if (result) {
          setWinner(result)
          setTally(tl => result === 'O' ? { ...tl, losses: tl.losses + 1 } : { ...tl, draws: tl.draws + 1 })
        }
      }
      setAiThinking(false)
    }, 450)
    return () => clearTimeout(t)
  }, [aiThinking, winner, board])

  function handleCellClick(i) {
    if (timeUp || winner || aiThinking || board[i]) return
    const next = [...board]
    next[i] = 'X'
    setBoard(next)
    const result = checkWinner(next)
    if (result) {
      setWinner(result)
      setTally(tl => result === 'X' ? { ...tl, wins: tl.wins + 1 } : { ...tl, draws: tl.draws + 1 })
    } else {
      setAiThinking(true)
    }
  }

  function handleRestart() {
    setBoard(EMPTY_BOARD)
    setWinner(null)
    setAiThinking(false)
  }

  const resultText = winner === 'X' ? 'You win! 🎉' : winner === 'O' ? 'Computer wins' : winner === 'draw' ? "It's a draw" : ''

  return (
    <div style={{ maxWidth: 360, margin: '0 auto' }}>
      <GameHeader
        onExit={onExit}
        status={`W ${tally.wins} · L ${tally.losses} · D ${tally.draws}`}
        remainingMs={remainingMs}
        timeUp={timeUp}
      />

      {timeUp ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 10 }}>⭕</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>Time's up!</div>
          <div style={{ fontSize: '0.88rem', color: '#64748b', marginTop: 6 }}>
            {tally.wins} win{tally.wins === 1 ? '' : 's'}, {tally.losses} loss{tally.losses === 1 ? '' : 'es'}, {tally.draws} draw{tally.draws === 1 ? '' : 's'}.
          </div>
          <button className="btn btn-outline" style={{ marginTop: 18 }} onClick={onExit}>Back to Games</button>
        </div>
      ) : (
        <>
          <div style={{ position: 'relative' }}>
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

            {winner && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.92)', borderRadius: 12,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>{resultText}</div>
                <button className="btn btn-green btn-sm" onClick={handleRestart}>Play Again</button>
              </div>
            )}
          </div>
          {aiThinking && !winner && (
            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8', marginTop: 10 }}>Computer is thinking...</div>
          )}
        </>
      )}
    </div>
  )
}
