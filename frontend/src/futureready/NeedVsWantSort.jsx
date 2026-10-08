import { useState } from 'react'

const ITEMS = [
  { emoji: '🍎', label: 'Food for dinner', answer: 'need' },
  { emoji: '🎮', label: 'New video game', answer: 'want' },
  { emoji: '👟', label: 'School shoes', answer: 'need' },
  { emoji: '🍬', label: 'Candy', answer: 'want' },
  { emoji: '🏠', label: 'A place to live', answer: 'need' },
  { emoji: '🎨', label: 'Extra art supplies', answer: 'want' },
]

// Tap-to-sort puzzle: pick Need or Want for each item, get instant feedback.
// No scoring tied to points (that's the end-of-lesson quiz's job) -- this is
// just a quick hands-on check of the idea the slide just explained.
export default function NeedVsWantSort() {
  const [answers, setAnswers] = useState({}) // index -> 'need' | 'want'

  function choose(i, choice) {
    setAnswers(a => ({ ...a, [i]: choice }))
  }

  const doneCount = Object.keys(answers).length
  const correctCount = ITEMS.reduce((sum, item, i) => sum + (answers[i] === item.answer ? 1 : 0), 0)

  return (
    <div style={{ marginTop: 18, textAlign: 'left', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 16px 18px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f766e', marginBottom: 4, textAlign: 'center' }}>
        🧩 Need or Want?
      </div>
      <div style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', marginBottom: 12 }}>
        Tap a button for each one
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ITEMS.map((item, i) => {
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
                  {isCorrect ? '✓ ' : '✗ '}{item.answer === 'need' ? 'Need' : 'Want'}
                </span>
              ) : (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" onClick={() => choose(i, 'need')} style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: 999, border: '1.5px solid #0d9488', background: '#fff', color: '#0d9488', cursor: 'pointer' }}>Need</button>
                  <button type="button" onClick={() => choose(i, 'want')} style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: 999, border: '1.5px solid #d97706', background: '#fff', color: '#d97706', cursor: 'pointer' }}>Want</button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {doneCount === ITEMS.length && (
        <div style={{ textAlign: 'center', marginTop: 12, fontSize: '0.82rem', fontWeight: 700, color: '#059669' }}>
          🎉 You got {correctCount} of {ITEMS.length} right!
        </div>
      )}
    </div>
  )
}
