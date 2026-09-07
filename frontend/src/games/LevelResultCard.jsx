// Shared pause screen every leveled game stops on between attempts --
// deliberately requires a tap to continue rather than auto-advancing, so
// progress feels like a series of distinct, earned levels instead of one
// continuous loop.
//
// A fail retries at the same level, not level 1 -- progress is saved
// server-side, so a kid picks back up where they left off next time too.
// `onRestart` is optional and only shown past level 1, for a kid who
// wants to deliberately start over instead.
export default function LevelResultCard({ result, level, nextLevel, subtext, onContinue, onRetry, onRestart }) {
  if (result === 'pass') {
    return (
      <div style={{ textAlign: 'center', padding: '34px 20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 16 }}>
        <div style={{ fontSize: '2.6rem', marginBottom: 8 }}>🎉</div>
        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#166534' }}>Level {level} complete!</div>
        {subtext && <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 6 }}>{subtext}</div>}
        <button className="btn btn-green" style={{ marginTop: 18 }} onClick={onContinue}>
          Continue to Level {nextLevel} →
        </button>
      </div>
    )
  }
  return (
    <div style={{ textAlign: 'center', padding: '34px 20px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 16 }}>
      <div style={{ fontSize: '2.6rem', marginBottom: 8 }}>😅</div>
      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#b91c1c' }}>Level {level} failed</div>
      {subtext && <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 6 }}>{subtext}</div>}
      <button className="btn btn-outline" style={{ marginTop: 18 }} onClick={onRetry}>
        Try Again from Level {level}
      </button>
      {onRestart && level > 1 && (
        <div style={{ marginTop: 12 }}>
          <button
            onClick={onRestart}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.8rem', textDecoration: 'underline', cursor: 'pointer' }}
          >
            Start from Level 1 instead
          </button>
        </div>
      )}
    </div>
  )
}
