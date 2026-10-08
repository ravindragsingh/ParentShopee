import { useMemo, useState } from 'react'
import Reaction from './Reaction.jsx'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Generic "put these in the right order" puzzle: tap steps one at a time in
// the correct sequence. Tapping the right next step locks it into the
// numbered list below; tapping any other step just shakes that chip, so the
// puzzle works by trial and feel rather than a multiple-choice question.
// Good for process/step-based content (apology steps, a framework, a
// sequence of events) across any topic.
export default function SequenceOrder({ config, onResult }) {
  const { prompt = 'Tap them in the right order', items } = config
  const shuffled = useMemo(() => shuffle(items.map((text, i) => ({ text, i }))), [items])
  const [placed, setPlaced] = useState([]) // array of original indices, in the order tapped
  const [shakeIndex, setShakeIndex] = useState(null)

  const nextCorrect = placed.length
  const done = placed.length === items.length

  function tap(item) {
    if (done || placed.includes(item.i)) return
    if (item.i === nextCorrect) {
      setPlaced(p => [...p, item.i])
      onResult?.(true)
    } else {
      setShakeIndex(item.i)
      onResult?.(false)
      setTimeout(() => setShakeIndex(null), 450)
    }
  }

  return (
    <div style={{ marginTop: 18, textAlign: 'left', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 16px 18px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f766e', marginBottom: 4, textAlign: 'center' }}>
        🔢 Put them in order
      </div>
      <div style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', marginBottom: 10 }}>
        {prompt}
      </div>

      {placed.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
          {placed.map((origIndex, pos) => (
            <div key={origIndex} className="pop-in" style={{
              display: 'flex', alignItems: 'center', gap: 8, background: '#f0fdf4',
              border: '1px solid #86efac', borderRadius: 9, padding: '7px 10px',
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#16a34a', flexShrink: 0 }}>{pos + 1}.</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#166534' }}>{items[origIndex]}</span>
            </div>
          ))}
        </div>
      )}

      {!done && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {shuffled.filter(item => !placed.includes(item.i)).map(item => (
            <button
              key={item.i}
              type="button"
              onClick={() => tap(item)}
              className={shakeIndex === item.i ? 'tile-shake' : ''}
              style={{
                padding: '9px 12px', borderRadius: 9, fontSize: '0.8rem', fontWeight: 700,
                border: '1.5px solid #e2e8f0', background: '#fff', color: '#1e293b', cursor: 'pointer',
              }}
            >
              {item.text}
            </button>
          ))}
        </div>
      )}

      {done && (
        <>
          <Reaction status="correct" keyProp="sequence-done" />
          <div className="pop-in" style={{ textAlign: 'center', marginTop: 4, fontSize: '0.82rem', fontWeight: 700, color: '#059669' }}>
            🎉 That's the right order!
          </div>
        </>
      )}
    </div>
  )
}
