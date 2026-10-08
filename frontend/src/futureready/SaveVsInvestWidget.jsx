import { useMemo, useState } from 'react'
import { futureValue, formatMoney } from './financeMath.js'

// Side-by-side comparison of leaving money in a low-rate savings account vs.
// investing it -- same contribution, different growth rate, so the gap
// between the two bars *is* the lesson.
export default function SaveVsInvestWidget({ config }) {
  const { startAmount, monthlyAmount = 0, saveRate, investRate, maxYears } = config
  const [years, setYears] = useState(maxYears)

  const savedValue = useMemo(() => futureValue(startAmount, monthlyAmount, saveRate, years), [startAmount, monthlyAmount, saveRate, years])
  const investedValue = useMemo(() => futureValue(startAmount, monthlyAmount, investRate, years), [startAmount, monthlyAmount, investRate, years])
  const gap = Math.max(0, investedValue - savedValue)
  const maxBar = Math.max(savedValue, investedValue, 1)

  return (
    <div style={{ marginTop: 18, textAlign: 'left', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 16px 18px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f766e', marginBottom: 12, textAlign: 'center' }}>
        🧪 Try it yourself
      </div>

      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
        Years: <span style={{ color: '#0d9488' }}>{years}</span>
      </label>
      <input
        type="range" min={1} max={maxYears} value={years}
        onChange={e => setYears(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#0d9488' }}
      />

      <div style={{ display: 'flex', gap: 14, marginTop: 18 }}>
        <div style={{ flex: 1 }}>
          <div style={{ height: 90, display: 'flex', alignItems: 'flex-end' }}>
            <div style={{ width: '100%', background: '#94a3b8', borderRadius: '8px 8px 0 0', height: `${Math.max((savedValue / maxBar) * 100, 6)}%`, transition: 'height 0.2s ease' }} />
          </div>
          <div style={{ textAlign: 'center', marginTop: 6 }}>
            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>🏦 In savings ({Math.round(saveRate * 100)}%)</div>
            <div style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 800 }}>{formatMoney(savedValue)}</div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ height: 90, display: 'flex', alignItems: 'flex-end' }}>
            <div style={{ width: '100%', background: 'linear-gradient(180deg, #34d399, #0d9488)', borderRadius: '8px 8px 0 0', height: `${Math.max((investedValue / maxBar) * 100, 6)}%`, transition: 'height 0.2s ease' }} />
          </div>
          <div style={{ textAlign: 'center', marginTop: 6 }}>
            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>📈 Invested ({Math.round(investRate * 100)}%)</div>
            <div style={{ fontSize: '0.85rem', color: '#0d9488', fontWeight: 800 }}>{formatMoney(investedValue)}</div>
          </div>
        </div>
      </div>

      {gap > 0 && (
        <div style={{ textAlign: 'center', marginTop: 12, fontSize: '0.82rem', fontWeight: 700, color: '#059669' }}>
          📈 Investing could end up {formatMoney(gap)} ahead of just saving — same money put in, different result.
        </div>
      )}

      <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 10, textAlign: 'center', lineHeight: 1.4 }}>
        Just for learning — savings rates are usually steadier, investing returns can go up or down.
      </div>
    </div>
  )
}
