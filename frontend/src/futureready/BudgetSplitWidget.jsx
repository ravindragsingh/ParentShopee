import { useState } from 'react'
import { formatMoney } from './financeMath.js'

const SLICES = [
  { key: 'spend', label: '🛍️ Spend', color: '#d97706' },
  { key: 'save', label: '🐷 Save', color: '#0d9488' },
  { key: 'give', label: '💛 Give', color: '#db2777' },
]

// Drag three "parts" sliders (not percentages, so they never need to add up
// to exactly 100) to split a fixed allowance across Spend/Save/Give --
// shares are normalized automatically from however many parts each gets.
export default function BudgetSplitWidget({ config }) {
  const { totalAmount } = config
  const [parts, setParts] = useState({ spend: 5, save: 3, give: 2 })

  const totalParts = parts.spend + parts.save + parts.give || 1

  return (
    <div style={{ marginTop: 18, textAlign: 'left', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 16px 18px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f766e', marginBottom: 12, textAlign: 'center' }}>
        🧪 Split {formatMoney(totalAmount)}
      </div>

      <div style={{ display: 'flex', height: 22, borderRadius: 999, overflow: 'hidden', marginBottom: 16 }}>
        {SLICES.map(s => (
          <div key={s.key} style={{ width: `${(parts[s.key] / totalParts) * 100}%`, background: s.color, transition: 'width 0.2s ease' }} />
        ))}
      </div>

      {SLICES.map(s => {
        const share = parts[s.key] / totalParts
        return (
          <div key={s.key} style={{ marginBottom: 12 }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
              <span>{s.label}</span>
              <span style={{ color: s.color }}>{formatMoney(share * totalAmount)} ({Math.round(share * 100)}%)</span>
            </label>
            <input
              type="range" min={0} max={10} value={parts[s.key]}
              onChange={e => setParts(p => ({ ...p, [s.key]: Number(e.target.value) }))}
              style={{ width: '100%', accentColor: s.color }}
            />
          </div>
        )
      })}

      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4, textAlign: 'center' }}>
        Drag each slider — there's no one right split, it's your choice.
      </div>
    </div>
  )
}
