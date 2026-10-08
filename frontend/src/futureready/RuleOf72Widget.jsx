import { useState } from 'react'

// The Rule of 72 is itself an interactive formula -- just a slider and a
// division, no simulation needed. Drag the rate, watch "years to double"
// update live.
export default function RuleOf72Widget() {
  const [rate, setRate] = useState(7)
  const years = (72 / rate).toFixed(1)

  return (
    <div style={{ marginTop: 18, textAlign: 'left', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 16px 18px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f766e', marginBottom: 12, textAlign: 'center' }}>
        🧪 Try it yourself
      </div>

      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
        Annual return: <span style={{ color: '#0d9488' }}>{rate}%</span>
      </label>
      <input
        type="range" min={1} max={15} value={rate}
        onChange={e => setRate(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#0d9488' }}
      />

      <div style={{ textAlign: 'center', marginTop: 18, padding: '14px 0', background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700 }}>72 ÷ {rate} =</div>
        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0d9488', marginTop: 2 }}>{years} years</div>
        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>to double your money</div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 10, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
        At {rate}%, $100 would become about $200 in roughly {years} years.
      </div>
    </div>
  )
}
