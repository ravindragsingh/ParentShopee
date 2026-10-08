import { useState } from 'react'
import Reaction from './Reaction.jsx'

// Generic "what would you do?" decision widget: pick one of 2-3 responses
// to a short scenario, reveal that choice's outcome. Config-driven so it
// covers digital safety, negotiation, communication, leadership,
// problem-solving, manners, making-friends, entrepreneurship, etc. without
// a new component per topic.
export default function ScenarioPicker({ config, onResult }) {
  const { scenario, options } = config
  const [picked, setPicked] = useState(null)

  const choice = picked !== null ? options[picked] : null

  function pick(i) {
    setPicked(i)
    onResult?.(!!options[i].good)
  }

  return (
    <div style={{ marginTop: 18, textAlign: 'left', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 16px 18px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f766e', marginBottom: 10, textAlign: 'center' }}>
        🎮 What would you do?
      </div>
      {scenario && (
        <div style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 600, lineHeight: 1.5, marginBottom: 12, textAlign: 'center' }}>
          {scenario}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {options.map((opt, i) => {
          const isPicked = picked === i
          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => pick(i)}
              disabled={picked !== null}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10,
                textAlign: 'left', cursor: picked === null ? 'pointer' : 'default',
                border: `2px solid ${isPicked ? (opt.good ? '#86efac' : '#fde68a') : '#e2e8f0'}`,
                background: isPicked ? (opt.good ? '#f0fdf4' : '#fffbeb') : '#fff',
                opacity: picked !== null && !isPicked ? 0.55 : 1,
              }}
            >
              {opt.emoji && <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{opt.emoji}</span>}
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>{opt.label}</span>
            </button>
          )
        })}
      </div>

      {choice && (
        <>
          <Reaction status={choice.good ? 'correct' : 'incorrect'} keyProp={picked} />
          <div style={{
            marginTop: 4, padding: '10px 12px', borderRadius: 10, fontSize: '0.8rem', lineHeight: 1.5,
            background: choice.good ? '#f0fdf4' : '#fffbeb',
            color: choice.good ? '#166534' : '#92400e',
          }}>
            {choice.good ? '✅ ' : '💭 '}{choice.outcome}
          </div>
        </>
      )}
    </div>
  )
}
