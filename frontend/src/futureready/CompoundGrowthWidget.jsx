import { useMemo, useState } from 'react'
import { futureValue, formatMoney } from './financeMath.js'

const RATE_PRESETS = [
  { label: 'Cautious', rate: 0.04 },
  { label: 'Average', rate: 0.07 },
  { label: 'Optimistic', rate: 0.10 },
]

// A hands-on companion to the "compound growth" slide -- drag the years
// slider (and, for older bands, pick a return assumption) and watch two
// bars compare what you put in vs. what it could grow to. Config is
// data-driven per age band/topic (see investing.json's widgetConfig),
// so the component itself has no age-specific logic.
export default function CompoundGrowthWidget({ config }) {
  const { startAmount, monthlyAmount = 0, rate: defaultRate, maxYears, allowRateAdjust } = config
  const [years, setYears] = useState(maxYears)
  const [rate, setRate] = useState(defaultRate)

  const contributed = startAmount + monthlyAmount * years * 12
  const value = useMemo(
    () => futureValue(startAmount, monthlyAmount, rate, years),
    [startAmount, monthlyAmount, rate, years]
  )
  const growth = Math.max(0, value - contributed)
  const maxBar = Math.max(value, contributed, 1)
  const contributedPct = Math.max((contributed / maxBar) * 100, 6)
  const valuePct = Math.max((value / maxBar) * 100, 6)

  return (
    <div style={{ marginTop: 18, textAlign: 'left', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 16px 18px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f766e', marginBottom: 12, textAlign: 'center' }}>
        🧪 Try it yourself
      </div>

      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
        Years invested: <span style={{ color: '#0d9488' }}>{years}</span>
      </label>
      <input
        type="range" min={1} max={maxYears} value={years}
        onChange={e => setYears(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#0d9488' }}
      />

      {allowRateAdjust && (
        <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
          {RATE_PRESETS.map(p => (
            <button
              key={p.label}
              type="button"
              onClick={() => setRate(p.rate)}
              style={{
                flex: 1, padding: '6px 4px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                border: `1.5px solid ${rate === p.rate ? '#0d9488' : '#e2e8f0'}`,
                background: rate === p.rate ? '#f0fdfa' : '#fff',
                color: rate === p.rate ? '#0d9488' : '#64748b',
                lineHeight: 1.3,
              }}
            >
              {p.label}<br />{Math.round(p.rate * 100)}%
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 14, marginTop: 18 }}>
        <div style={{ flex: 1 }}>
          <div style={{ height: 90, display: 'flex', alignItems: 'flex-end' }}>
            <div style={{ width: '100%', background: '#cbd5e1', borderRadius: '8px 8px 0 0', height: `${contributedPct}%`, transition: 'height 0.2s ease' }} />
          </div>
          <div style={{ textAlign: 'center', marginTop: 6 }}>
            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>You put in</div>
            <div style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 800 }}>{formatMoney(contributed)}</div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ height: 90, display: 'flex', alignItems: 'flex-end' }}>
            <div style={{ width: '100%', background: 'linear-gradient(180deg, #34d399, #0d9488)', borderRadius: '8px 8px 0 0', height: `${valuePct}%`, transition: 'height 0.2s ease' }} />
          </div>
          <div style={{ textAlign: 'center', marginTop: 6 }}>
            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>Could grow to</div>
            <div style={{ fontSize: '0.85rem', color: '#0d9488', fontWeight: 800 }}>{formatMoney(value)}</div>
          </div>
        </div>
      </div>

      {growth > 0 && (
        <div style={{ textAlign: 'center', marginTop: 12, fontSize: '0.82rem', fontWeight: 700, color: '#059669' }}>
          🌱 That's {formatMoney(growth)} of growth — money your money earned on its own!
        </div>
      )}

      <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 10, textAlign: 'center', lineHeight: 1.4 }}>
        Just for learning — real investments can go up or down and nothing is guaranteed.
      </div>
    </div>
  )
}
