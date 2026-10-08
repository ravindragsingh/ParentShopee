import { useState } from 'react'

// Two preset, hand-authored year-by-year value paths (not random) so the
// lesson is reproducible: a low-risk option that climbs steadily, and a
// higher-risk one that dips along the way but can end up higher. Picking
// one reveals its path as a mini bar chart plus the ending value.
const OPTIONS = {
  steady: {
    label: '🐢 Steady Saver', sub: 'Low risk', color: '#64748b',
    values: [100, 102, 104, 106, 108, 110],
  },
  growth: {
    label: '🚀 Growth Stock', sub: 'Higher risk', color: '#0d9488',
    values: [100, 118, 96, 132, 109, 148],
  },
}

export default function RiskRewardSimulator() {
  const [picked, setPicked] = useState(null)

  const option = picked ? OPTIONS[picked] : null
  const maxVal = option ? Math.max(...option.values) : 0

  return (
    <div style={{ marginTop: 18, textAlign: 'left', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 16px 18px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f766e', marginBottom: 12, textAlign: 'center' }}>
        🎮 Which would you pick?
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        {Object.entries(OPTIONS).map(([key, opt]) => (
          <button
            key={key}
            type="button"
            onClick={() => setPicked(key)}
            style={{
              flex: 1, padding: '12px 8px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
              border: `2px solid ${picked === key ? opt.color : '#e2e8f0'}`,
              background: picked === key ? '#fff' : '#fff',
              boxShadow: picked === key ? `0 2px 10px ${opt.color}33` : 'none',
            }}
          >
            <div style={{ fontSize: '1.3rem', marginBottom: 4 }}>{opt.label.split(' ')[0]}</div>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e293b' }}>{opt.label.slice(opt.label.indexOf(' ') + 1)}</div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>{opt.sub}</div>
          </button>
        ))}
      </div>

      {option && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 70 }}>
            {option.values.map((v, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'flex-end', height: '100%' }}>
                <div style={{
                  width: '100%', background: option.color, borderRadius: '4px 4px 0 0',
                  height: `${Math.max((v / maxVal) * 100, 8)}%`, transition: 'height 0.2s ease',
                }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.64rem', color: '#94a3b8', marginTop: 4 }}>
            <span>Year 0</span><span>Year 5</span>
          </div>
          <div style={{ textAlign: 'center', marginTop: 10, fontSize: '0.82rem', fontWeight: 700, color: option.color }}>
            $100 became {`$${option.values[option.values.length - 1]}`} after 5 years
          </div>
          <div style={{ textAlign: 'center', marginTop: 6, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
            {picked === 'steady'
              ? "Steady and predictable, but it won't grow very fast."
              : 'Notice the dips along the way — that\'s risk. It fell before it grew, and it could have ended lower too.'}
          </div>
        </div>
      )}
    </div>
  )
}
