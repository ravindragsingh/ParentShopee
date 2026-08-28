import { useState, useEffect, useMemo, useCallback } from 'react'

function formatRemaining(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// Shared shell for every "show a prompt, tap the right one of 4 choices"
// game (Quick Math, Alphabet Hunt, Number Match, Sight Words, Word Scramble).
// `generateRound()` returns { prompt: ReactNode, choices: [{id, label}], correctId }.
export default function MultipleChoiceGame({ session, onExit, generateRound, timeUpEmoji = '🎉' }) {
  const [round, setRound] = useState(generateRound)
  const [score, setScore] = useState(0)
  const [attempted, setAttempted] = useState(0)
  const [feedback, setFeedback] = useState(null) // { choiceId, correct } | null
  const [remainingMs, setRemainingMs] = useState(() => new Date(session.expiresAt) - new Date())

  const expiresAt = useMemo(() => new Date(session.expiresAt).getTime(), [session.expiresAt])

  useEffect(() => {
    const tick = () => setRemainingMs(expiresAt - Date.now())
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  const timeUp = remainingMs <= 0

  const handleChoice = useCallback((choiceId) => {
    if (timeUp || feedback) return
    const correct = choiceId === round.correctId
    setFeedback({ choiceId, correct })
    setAttempted(n => n + 1)
    if (correct) setScore(s => s + 1)
    setTimeout(() => {
      setFeedback(null)
      setRound(generateRound())
    }, correct ? 450 : 900)
  }, [feedback, round, timeUp, generateRound])

  return (
    <div style={{ maxWidth: 420, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <button className="btn btn-outline btn-sm" onClick={onExit}>← Back to Games</button>
        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Score: {score} / {attempted}</span>
        <span
          style={{
            fontSize: '0.85rem', fontWeight: 700, borderRadius: 999, padding: '4px 12px',
            background: timeUp ? '#fee2e2' : remainingMs < 60000 ? '#fed7aa' : '#ccfbf1',
            color: timeUp ? '#b91c1c' : remainingMs < 60000 ? '#c2410c' : '#0d9488',
          }}
        >
          ⏱️ {timeUp ? "Time's up" : formatRemaining(remainingMs)}
        </span>
      </div>

      {timeUp ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 10 }}>{timeUpEmoji}</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>Time's up!</div>
          <div style={{ fontSize: '0.88rem', color: '#64748b', marginTop: 6 }}>
            You got {score} of {attempted} correct.
          </div>
          <button className="btn btn-outline" style={{ marginTop: 18 }} onClick={onExit}>Back to Games</button>
        </div>
      ) : (
        <div>
          <div style={{
            background: '#fff', border: '1px solid #f1f5f9', borderRadius: 16, padding: '26px 20px',
            textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', marginBottom: 16,
          }}>
            {round.prompt}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {round.choices.map(choice => {
              const isChosen = feedback?.choiceId === choice.id
              const showCorrect = feedback && choice.id === round.correctId
              let background = 'linear-gradient(135deg, #0d9488, #0891b2)'
              if (feedback) {
                if (showCorrect) background = '#059669'
                else if (isChosen) background = '#dc2626'
                else background = '#cbd5e1'
              }
              return (
                <button
                  key={choice.id}
                  onClick={() => handleChoice(choice.id)}
                  disabled={!!feedback}
                  style={{
                    padding: '18px 10px', fontSize: '1.3rem', fontWeight: 700, color: '#fff',
                    borderRadius: 12, border: 'none', cursor: feedback ? 'default' : 'pointer',
                    background, transition: 'background 0.15s ease',
                  }}
                >
                  {choice.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
