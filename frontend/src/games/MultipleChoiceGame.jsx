import { useState, useCallback } from 'react'
import { useCountdown } from './useCountdown.js'
import GameHeader from './GameHeader.jsx'

// Shared shell for every "show a prompt, tap the right one of 4 choices"
// game (Quick Math, Alphabet Hunt, Number Match, Sight Words, Word Scramble).
// `generateRound()` returns { prompt: ReactNode, choices: [{id, label}], correctId }.
export default function MultipleChoiceGame({ session, onExit, generateRound, timeUpEmoji = '🎉' }) {
  const [round, setRound] = useState(generateRound)
  const [score, setScore] = useState(0)
  const [attempted, setAttempted] = useState(0)
  const [feedback, setFeedback] = useState(null) // { choiceId, correct } | null
  const { remainingMs, timeUp } = useCountdown(session.expiresAt)

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
      <GameHeader onExit={onExit} status={`Score: ${score} / ${attempted}`} remainingMs={remainingMs} timeUp={timeUp} />

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
