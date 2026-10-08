import { useState } from 'react'
import Reaction from './Reaction.jsx'

// Generic "which one doesn't belong?" widget: a grid of items where exactly
// one is the odd one out, tap it. A quick, single-pick format distinct from
// ScenarioPicker's narrative "what would you do" framing -- works well for
// "which of these is NOT an example of X" content.
export default function OddOneOut({ config, onResult }) {
  const { prompt, items, oddIndex, explanation } = config
  const [picked, setPicked] = useState(null)

  const correct = picked === oddIndex

  function pick(i) {
    if (picked !== null) return
    setPicked(i)
    onResult?.(i === oddIndex)
  }

  return (
    <div style={{ marginTop: 18, textAlign: 'left', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 16px 18px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f766e', marginBottom: 10, textAlign: 'center' }}>
        🔎 Which one doesn't belong?
      </div>
      {prompt && (
        <div style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 600, lineHeight: 1.5, marginBottom: 12, textAlign: 'center' }}>
          {prompt}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {items.map((item, i) => {
          const isPicked = picked === i
          const isOdd = i === oddIndex
          let border = '#e2e8f0'
          let background = '#fff'
          if (picked !== null) {
            if (isOdd) { border = '#86efac'; background = '#f0fdf4' }
            else if (isPicked) { border = '#fde68a'; background = '#fffbeb' }
          }
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => pick(i)}
              disabled={picked !== null}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 8px',
                borderRadius: 10, cursor: picked === null ? 'pointer' : 'default',
                border: `2px solid ${border}`, background,
                opacity: picked !== null && !isOdd && !isPicked ? 0.55 : 1,
              }}
            >
              <span style={{ fontSize: '1.4rem' }}>{item.emoji}</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', textAlign: 'center' }}>{item.label}</span>
            </button>
          )
        })}
      </div>

      {picked !== null && (
        <>
          <Reaction status={correct ? 'correct' : 'incorrect'} keyProp={picked} />
          <div style={{
            marginTop: 4, padding: '10px 12px', borderRadius: 10, fontSize: '0.8rem', lineHeight: 1.5,
            background: correct ? '#f0fdf4' : '#fffbeb',
            color: correct ? '#166534' : '#92400e',
          }}>
            {correct ? '✅ ' : '💭 '}{explanation}
          </div>
        </>
      )}
    </div>
  )
}
