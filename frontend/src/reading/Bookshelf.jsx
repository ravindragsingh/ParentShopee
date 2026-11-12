// A trophy case of every finished book's cover -- `logs` is the kid's full
// reading-log list, filtered here to just the approved ones. Tapping a cover
// reopens that book's detail (same BookView an in-progress book opens into,
// which already has an "approved" celebration state).
export default function Bookshelf({ logs, onOpen }) {
  const finished = logs.filter(l => l.status === 'approved')
  if (finished.length === 0) return null

  return (
    <div className="form-card" style={{ marginBottom: 18 }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
        🏆 My Bookshelf ({finished.length})
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {finished.map(log => (
          <button
            key={log.id}
            onClick={() => onOpen(log)}
            title={log.title}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: 64, textAlign: 'center' }}
          >
            {log.thumbnailUrl ? (
              <img
                src={log.thumbnailUrl} alt=""
                style={{ width: 64, height: 90, objectFit: 'cover', borderRadius: 6, boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}
              />
            ) : (
              <div style={{ width: 64, height: 90, borderRadius: 6, background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>
                📖
              </div>
            )}
            <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {log.title}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
