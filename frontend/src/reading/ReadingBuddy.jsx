// A persistent companion that grows with LIFETIME pages read (not any one
// book) -- distinct from the per-book ProgressBar's traveling icon, which
// tracks progress through a single book. `compact` renders a small chip
// (home-screen card); otherwise a full card with a mini progress-to-next bar.
export default function ReadingBuddy({ buddy, compact }) {
  if (!buddy) return null

  if (compact) {
    return (
      <span
        title={buddy.name}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', fontWeight: 800,
          color: '#7c3aed', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 999, padding: '3px 9px',
        }}
      >
        <span style={{ fontSize: '0.95rem' }}>{buddy.emoji}</span>
        {buddy.name}
      </span>
    )
  }

  const pct = buddy.maxStage ? 100 : Math.max(4, 100 - Math.min(100, (buddy.pagesToNext / 25) * 100))

  return (
    <div className="pop-in" style={{ background: 'linear-gradient(135deg,#f5f3ff,#fdf4ff)', border: '1px solid #ddd6fe', borderRadius: 16, padding: '16px 18px', marginBottom: 16, textAlign: 'center' }}>
      <div style={{ fontSize: '2.6rem', lineHeight: 1 }}>{buddy.emoji}</div>
      <div style={{ fontWeight: 800, color: '#6d28d9', fontSize: '1rem', marginTop: 6 }}>{buddy.name}</div>
      <div style={{ fontSize: '0.76rem', color: '#8b5cf6', marginTop: 2 }}>Your reading buddy</div>
      {!buddy.maxStage ? (
        <>
          <div style={{ height: 8, background: '#ede9fe', borderRadius: 999, overflow: 'hidden', marginTop: 10 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#8b5cf6,#c084fc)', borderRadius: 999, transition: 'width 0.4s ease' }} />
          </div>
          <div style={{ fontSize: '0.76rem', color: '#7c3aed', marginTop: 6 }}>
            {buddy.pagesToNext} more page{buddy.pagesToNext === 1 ? '' : 's'} to evolve into a <strong>{buddy.nextName}</strong>!
          </div>
        </>
      ) : (
        <div style={{ fontSize: '0.76rem', color: '#7c3aed', marginTop: 10, fontWeight: 700 }}>
          🎉 Max level reached — legendary reader!
        </div>
      )}
    </div>
  )
}
