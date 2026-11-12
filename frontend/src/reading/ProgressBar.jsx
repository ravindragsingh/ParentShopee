// A reading-progress bar with a little bookmark that rides along the fill --
// used both on the kid's book detail and the guardian's log rows. Renders
// nothing when totalPages isn't known (Open Library doesn't have a page
// count for every book), rather than showing a bogus/empty bar.
export default function ProgressBar({ pagesRead = 0, totalPages, compact }) {
  if (!totalPages) return null
  const pct = Math.max(0, Math.min(100, Math.round((pagesRead / totalPages) * 100)))
  const done = pagesRead >= totalPages

  return (
    <div style={{ width: '100%' }}>
      <div style={{ position: 'relative', height: compact ? 10 : 14, background: '#f1f5f9', borderRadius: 999, overflow: 'visible' }}>
        <div
          style={{
            height: '100%', width: `${pct}%`, borderRadius: 999, transition: 'width 0.4s ease',
            background: done ? 'linear-gradient(90deg,#16a34a,#22c55e)' : 'linear-gradient(90deg,#0d9488,#2dd4bf)',
          }}
        />
        {!compact && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute', top: -8, left: `calc(${pct}% - 10px)`, fontSize: '1.1rem',
              transition: 'left 0.4s ease', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.15))',
            }}
          >
            {done ? '🏆' : '🐛'}
          </span>
        )}
      </div>
      <div style={{ fontSize: compact ? '0.7rem' : '0.76rem', color: '#64748b', marginTop: compact ? 3 : 8 }}>
        {done ? `🎉 All ${totalPages} pages!` : `${pagesRead} / ${totalPages} pages · ${pct}%`}
      </div>
    </div>
  )
}
