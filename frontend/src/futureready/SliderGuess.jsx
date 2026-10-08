import { useState } from 'react'
import Reaction from './Reaction.jsx'

// Generic "guess the number, then reveal" widget: drag a slider to estimate
// an answer, lock it in, and see how close you were. A different feel from
// every tap-based widget -- a continuous drag instead of discrete choices --
// good for any slide built around a surprising number or guideline.
export default function SliderGuess({ config, onResult }) {
  const { question, min, max, step = 1, unit = '', answer, tolerance = 0, revealText } = config
  const mid = Math.round((min + max) / 2)
  const [guess, setGuess] = useState(mid)
  const [revealed, setRevealed] = useState(false)

  const diff = Math.abs(guess - answer)
  const close = diff <= tolerance

  function reveal() {
    setRevealed(true)
    onResult?.(close)
  }

  return (
    <div style={{ marginTop: 18, textAlign: 'left', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 16px 18px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f766e', marginBottom: 10, textAlign: 'center' }}>
        🎯 Take a guess
      </div>
      {question && (
        <div style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 600, lineHeight: 1.5, marginBottom: 14, textAlign: 'center' }}>
          {question}
        </div>
      )}

      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6, textAlign: 'center' }}>
        Your guess: <span style={{ color: '#0d9488' }}>{guess}{unit}</span>
      </label>
      <input
        type="range" min={min} max={max} step={step} value={guess}
        disabled={revealed}
        onChange={e => setGuess(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#0d9488' }}
      />

      {!revealed ? (
        <button
          type="button"
          onClick={reveal}
          style={{
            display: 'block', margin: '14px auto 0', padding: '9px 22px', borderRadius: 999,
            border: 'none', background: 'linear-gradient(135deg, #0d9488, #0891b2)', color: '#fff',
            fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer',
          }}
        >
          Check my guess
        </button>
      ) : (
        <>
          <Reaction status={close ? 'correct' : 'incorrect'} keyProp={guess} />
          <div style={{ textAlign: 'center', fontSize: '0.85rem', fontWeight: 800, color: close ? '#059669' : '#b45309', marginTop: 2 }}>
            {close ? '🎯 Nailed it!' : `The real answer is ${answer}${unit}`}
          </div>
          {revealText && (
            <div style={{
              marginTop: 8, padding: '10px 12px', borderRadius: 10, fontSize: '0.8rem', lineHeight: 1.5,
              background: close ? '#f0fdf4' : '#fffbeb', color: close ? '#166534' : '#92400e',
            }}>
              {revealText}
            </div>
          )}
        </>
      )}
    </div>
  )
}
