import { useState } from 'react'

const SQUARE = { width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }

// "What if one company fails?" side-by-side: putting $100 in one company vs.
// spreading it across four. Hitting the button "crashes" one investment in
// each column and the totals update -- all-in-one loses almost everything,
// spread-out only loses its quarter share.
export default function DiversificationPuzzle() {
  const [crashed, setCrashed] = useState(false)

  const allInTotal = crashed ? 5 : 100
  const spreadTotal = crashed ? 75 : 100

  return (
    <div style={{ marginTop: 18, textAlign: 'left', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 16px 18px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f766e', marginBottom: 12, textAlign: 'center' }}>
        🧩 $100 invested, two ways
      </div>

      <div style={{ display: 'flex', gap: 14 }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: 8 }}>All in 1 company</div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              ...SQUARE, width: 70, height: 70, fontSize: '1.6rem',
              background: crashed ? '#fee2e2' : '#ccfbf1',
              border: `2px solid ${crashed ? '#fca5a5' : '#5eead4'}`,
            }}>
              {crashed ? '💥' : '🏢'}
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: '0.95rem', fontWeight: 800, color: crashed ? '#dc2626' : '#0f766e' }}>
            ${allInTotal}
          </div>
        </div>

        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: 8 }}>Spread across 4</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap', maxWidth: 80, margin: '0 auto' }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{
                ...SQUARE,
                background: crashed && i === 0 ? '#fee2e2' : '#ccfbf1',
                border: `2px solid ${crashed && i === 0 ? '#fca5a5' : '#5eead4'}`,
              }}>
                {crashed && i === 0 ? '💥' : '🏢'}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: '0.95rem', fontWeight: 800, color: '#0f766e' }}>
            ${spreadTotal}
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button
          type="button"
          onClick={() => setCrashed(v => !v)}
          style={{
            background: crashed ? '#fff' : 'linear-gradient(135deg,#dc2626,#ef4444)',
            color: crashed ? '#334155' : '#fff',
            border: crashed ? '1.5px solid #cbd5e1' : 'none',
            borderRadius: 999, padding: '8px 18px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
          }}
        >
          {crashed ? '↺ Reset' : '💥 What if one company fails?'}
        </button>
      </div>

      {crashed && (
        <div style={{ textAlign: 'center', marginTop: 12, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
          Putting it all in one place meant losing almost everything when it failed. Spreading it across four meant one failure only cost a quarter — that's diversification.
        </div>
      )}
    </div>
  )
}
