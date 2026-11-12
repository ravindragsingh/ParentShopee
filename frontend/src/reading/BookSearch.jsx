import { useState, useEffect } from 'react'
import { api } from '../api.js'

// Shared live-search box over Google Books, used by both the guardian's
// "assign a book" flow and the kid's "log a book my guardian hasn't added
// yet" flow -- debounced so it doesn't fire a request per keystroke.
//
// `expandedId` + `renderExpanded` let a caller (the guardian's assign flow)
// drop extra UI (a kid-picker) directly under the ONE result that was
// clicked, rather than in one shared panel disconnected from which book it's
// actually for -- confusing once there's more than one search result on
// screen. Omit both for a plain single-click pick (the kid's "start reading"
// flow, which needs no follow-up step).
export default function BookSearch({ onPick, ctaLabel = 'Select', placeholder = 'Search by title or author…', expandedId, renderExpanded }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setSearched(false)
      setError('')
      return
    }
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const data = await api.searchBooks(trimmed)
        setResults(Array.isArray(data) ? data : [])
        setError('')
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
        setSearched(true)
      }
    }, 450)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.88rem', boxSizing: 'border-box' }}
      />
      {loading && <div className="loading-text" style={{ marginTop: 10 }}>Searching…</div>}
      {error && <div className="error-msg" style={{ marginTop: 10 }}>{error}</div>}
      {!loading && searched && results.length === 0 && !error && (
        <div className="empty-text" style={{ marginTop: 10 }}>No books found — try a different search.</div>
      )}
      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, maxHeight: 360, overflowY: 'auto' }}>
          {results.map(r => (
            <div key={r.volumeId} style={{ border: expandedId === r.volumeId ? '1px solid #99f6e4' : '1px solid #e2e8f0', borderRadius: 10, background: '#fff', overflow: 'hidden' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 10px' }}>
                {r.thumbnailUrl ? (
                  <img src={r.thumbnailUrl} alt="" style={{ width: 40, height: 56, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 40, height: 56, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', background: '#f8fafc', borderRadius: 4 }}>📖</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                  {r.author && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.author}</div>}
                  {r.totalPages && <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>📄 ~{r.totalPages} pages</div>}
                </div>
                <button type="button" className="btn btn-sm btn-primary" onClick={() => onPick(r)} style={{ flexShrink: 0 }}>
                  {ctaLabel}
                </button>
              </div>
              {expandedId === r.volumeId && renderExpanded && (
                <div style={{ padding: '0 10px 10px' }}>{renderExpanded(r)}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
