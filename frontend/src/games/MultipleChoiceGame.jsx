import { useState, useCallback, useEffect } from 'react'
import { useCountdown } from './useCountdown.js'
import { useReportScoreOnGameOver } from './useReportScoreOnGameOver.js'
import { playCorrectSound, playWrongSound } from './gameSounds.js'
import GameHeader from './GameHeader.jsx'
import LevelResultCard from './LevelResultCard.jsx'

const BASE_LEVEL_SECONDS = 15
const MIN_LEVEL_SECONDS = 6

// Time budget shrinks slightly each level -- a real, escalating pass/fail
// challenge without needing every generateRound() to also scale its own
// difficulty.
function levelSeconds(level) {
  return Math.max(MIN_LEVEL_SECONDS, BASE_LEVEL_SECONDS - (level - 1) * 0.5)
}

function newLevelExpiry(level) {
  return new Date(Date.now() + levelSeconds(level) * 1000).toISOString()
}

// Shared shell for every "show a prompt, tap the right one of 4 choices"
// game (Quick Math, Alphabet Hunt, Number Match, Sight Words, Word Scramble,
// Shape Sort, Color Match). `generateRound()` returns
// { prompt: ReactNode, choices: [{id, label}], correctId }.
// `onCorrect(round)` is optional and only fires on a correct pick -- Sight
// Words uses it to speak the word aloud; the others don't pass it at all.
//
// Each round is its own timed level: answer correctly before the level
// clock runs out to pass and see the next one; a wrong answer or running
// out of time on a level fails it and drops back to level 1 -- reported
// score is the highest level ever passed, not a running correct-answer
// tally, consistent with Memory Sequence's leveling.
export default function MultipleChoiceGame({ session, onExit, onGameOver, generateRound, timeUpEmoji = '🎉', onCorrect }) {
  const [round, setRound] = useState(generateRound)
  const [level, setLevel] = useState(1)
  const [bestLevel, setBestLevel] = useState(0)
  const [feedback, setFeedback] = useState(null) // { choiceId, correct } | null
  const [roundResult, setRoundResult] = useState(null) // 'pass' | 'fail' | null
  const [levelExpiresAt, setLevelExpiresAt] = useState(() => newLevelExpiry(1))
  const { remainingMs, timeUp } = useCountdown(session.expiresAt)
  const { remainingMs: levelRemainingMs, timeUp: levelTimeUp } = useCountdown(levelExpiresAt)
  useReportScoreOnGameOver(timeUp, bestLevel, onGameOver)

  // Running out of the level's own clock without answering fails it, same
  // as picking the wrong choice. `feedback` is deliberately read but not
  // listed as a dependency: listing it would re-run this effect (and its
  // cleanup would cancel the very timeout it just scheduled) the instant
  // setFeedback below fires, which silently ate the whole timeout-fail path.
  useEffect(() => {
    if (timeUp || feedback || roundResult || !levelTimeUp) return
    playWrongSound()
    setFeedback({ choiceId: null, correct: false })
    const t = setTimeout(() => {
      setFeedback(null)
      setRoundResult('fail')
    }, 900)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelTimeUp, timeUp, roundResult])

  const handleChoice = useCallback((choiceId) => {
    if (timeUp || feedback || roundResult) return
    const correct = choiceId === round.correctId
    setFeedback({ choiceId, correct })
    if (correct) {
      playCorrectSound()
      onCorrect?.(round)
    } else {
      playWrongSound()
    }
    setTimeout(() => {
      setFeedback(null)
      setRoundResult(correct ? 'pass' : 'fail')
    }, correct ? 450 : 900)
  }, [feedback, roundResult, round, timeUp, onCorrect])

  function handleContinue() {
    const nextLevel = level + 1
    setBestLevel(b => Math.max(b, level))
    setLevel(nextLevel)
    setLevelExpiresAt(newLevelExpiry(nextLevel))
    setRound(generateRound())
    setRoundResult(null)
  }

  function handleRetry() {
    setLevel(1)
    setLevelExpiresAt(newLevelExpiry(1))
    setRound(generateRound())
    setRoundResult(null)
  }

  const levelUrgent = levelRemainingMs < 5000

  return (
    <div style={{ maxWidth: 420, margin: '0 auto' }}>
      <GameHeader onExit={onExit} gameName={session.gameName} status={`Level ${level} · Best: ${bestLevel}`} remainingMs={remainingMs} timeUp={timeUp} />

      {timeUp ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 10 }}>{timeUpEmoji}</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>Time's up!</div>
          <div style={{ fontSize: '0.88rem', color: '#64748b', marginTop: 6 }}>
            You reached level {bestLevel}.
          </div>
          <button className="btn btn-outline" style={{ marginTop: 18 }} onClick={onExit}>Back to Games</button>
        </div>
      ) : roundResult === 'pass' ? (
        <LevelResultCard result="pass" level={level} nextLevel={level + 1} onContinue={handleContinue} />
      ) : roundResult === 'fail' ? (
        <LevelResultCard result="fail" level={level} onRetry={handleRetry} />
      ) : (
        <div>
          <div style={{
            textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, marginBottom: 12,
            padding: '6px 12px', borderRadius: 999, display: 'inline-block',
            background: levelUrgent ? '#fed7aa' : '#f1f5f9', color: levelUrgent ? '#c2410c' : '#64748b',
          }}>
            ⏳ {Math.max(0, Math.ceil(levelRemainingMs / 1000))}s to answer
          </div>

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
