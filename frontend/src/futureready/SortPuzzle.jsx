import { useState } from 'react'
import Reaction from './Reaction.jsx'

// Generic tap-to-sort puzzle: sort each item into one of two categories,
// get instant feedback. Config-driven (see investing.json's "need-vs-want"
// for the original, topic-specific instance) so any topic can define its
// own two buckets and items without a new component.
export default function SortPuzzle({ config, onResult }) {
  const { prompt = 'Tap a button for each one', categoryA, categoryB, items } = config
  const [answers, setAnswers] = useState({}) // index -> category key
  const [lastTap, setLastTap] = useState(null) // { index, correct } for the mascot reaction

  function choose(i, key) {
    setAnswers(a => ({ ...a, [i]: key }))
    const correct = key === items[i].answer
    setLastTap({ index: i, correct })
    onResult?.(correct)
  }

  const doneCount = Object.keys(answers).length
  const correctCount = items.reduce((sum, item, i) => sum + (answers[i] === item.answer ? 1 : 0), 0)
  const allDone = doneCount === items.length

  return (
    <div style={{ marginTop: 18, textAlign: 'left', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 16px 18px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f766e', marginBottom: 4, textAlign: 'center' }}>
        🧩 Sort it!
      </div>
      <div style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', marginBottom: 4 }}>
        {prompt}
      </div>
      {lastTap && !allDone && (
        <Reaction status={lastTap.correct ? 'correct' : 'incorrect'} keyProp={lastTap.index} />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item, i) => {
          const chosen = answers[i]
          const isCorrect = chosen === item.answer
          return (
            <div key={item.label} style={{
              display: 'flex', alignItems: 'center', gap: 10, background: '#fff',
              border: `1px solid ${chosen ? (isCorrect ? '#86efac' : '#fca5a5') : '#e2e8f0'}`,
              borderRadius: 10, padding: '8px 10px',
            }}>
              <span style={{ fontSize: '1.1rem' }}>{item.emoji}</span>
              <span style={{ flex: 1, fontSize: '0.8rem', fontWeight: 600, color: '#1e293b' }}>{item.label}</span>
              {chosen ? (
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isCorrect ? '#16a34a' : '#dc2626' }}>
                  {isCorrect ? '✓ ' : '✗ '}{(item.answer === categoryA.key ? categoryA : categoryB).label}
                </span>
              ) : (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" onClick={() => choose(i, categoryA.key)} style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: 999, border: `1.5px solid ${categoryA.color}`, background: '#fff', color: categoryA.color, cursor: 'pointer' }}>{categoryA.label}</button>
                  <button type="button" onClick={() => choose(i, categoryB.key)} style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: 999, border: `1.5px solid ${categoryB.color}`, background: '#fff', color: categoryB.color, cursor: 'pointer' }}>{categoryB.label}</button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {allDone && (
        <>
          <Reaction status="correct" keyProp="all-done" />
          <div className="pop-in" style={{ textAlign: 'center', marginTop: 4, fontSize: '0.82rem', fontWeight: 700, color: '#059669' }}>
            🎉 You got {correctCount} of {items.length} right!
          </div>
        </>
      )}
    </div>
  )
}
