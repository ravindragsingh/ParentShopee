import { useState, useEffect, useMemo, useCallback } from 'react'
import { api } from '../api.js'

// Shared topic browser for assigning content (Math today, more subjects planned
// later) — groups topics by class/grade, collapsed by default so a growing
// catalog doesn't dump everything on screen at once. A class filter and a
// keyword search narrow the list; either one auto-expands matching groups.

function TopicCard({ topic, assignLabel, assignDisabled, assigningTopicId, onAssign }) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>{topic.emoji}</div>
      <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{topic.title}</div>
      <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 10, lineHeight: 1.4, flex: 1 }}>
        {(() => {
          const explanation = topic.explanation || ''
          if (!explanation) return 'No description yet.'
          return explanation.length > 110 ? explanation.slice(0, 110) + '…' : explanation
        })()}
      </div>
      <button
        className="btn btn-primary btn-sm"
        disabled={assignDisabled || assigningTopicId === topic.id}
        onClick={() => onAssign(topic.id)}
      >
        {assigningTopicId === topic.id ? 'Adding...' : assignLabel}
      </button>
    </div>
  )
}

function ClassGroup({ subject, grade, topics, expanded, onToggle, ...cardProps }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        role="button" tabIndex={0}
        onClick={onToggle}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onToggle()}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px' }}
      >
        <span style={{ fontWeight: 700, color: '#334155', fontSize: '0.88rem' }}>
          📚 {subject} — Class {grade}
          <span style={{ marginLeft: 8, fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>
            ({topics.length} topic{topics.length === 1 ? '' : 's'})
          </span>
        </span>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginTop: 10 }}>
          {topics.map(t => <TopicCard key={t.id} topic={t} {...cardProps} />)}
        </div>
      )}
    </div>
  )
}

export default function TopicPicker({ assignLabel, assignDisabled = false, assigningTopicId, onAssign, banner }) {
  const [allTopics, setAllTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')
  const [expandedGrades, setExpandedGrades] = useState({})

  const load = useCallback(() => {
    setLoading(true)
    api.getMathTopics().then(setAllTopics).catch(() => setAllTopics([])).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const grades = useMemo(() => [...new Set(allTopics.map(t => t.grade))].sort((a, b) => a - b), [allTopics])

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return allTopics.filter(t => {
      if (gradeFilter && String(t.grade) !== gradeFilter) return false
      if (needle && !(t.title.toLowerCase().includes(needle) || (t.explanation || '').toLowerCase().includes(needle))) return false
      return true
    })
  }, [allTopics, search, gradeFilter])

  const grouped = useMemo(() => {
    const map = new Map()
    for (const t of filtered) {
      const key = `${t.subject}::${t.grade}`
      if (!map.has(key)) map.set(key, { subject: t.subject, grade: t.grade, topics: [] })
      map.get(key).topics.push(t)
    }
    return [...map.values()].sort((a, b) => a.grade - b.grade)
  }, [filtered])

  const isFiltering = !!(search.trim() || gradeFilter)

  function toggleGrade(key) {
    setExpandedGrades(e => ({ ...e, [key]: !e[key] }))
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)} style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem' }}>
          <option value="">All Classes</option>
          {grades.map(g => <option key={g} value={g}>Class {g}</option>)}
        </select>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search topics (e.g. Addition)..." style={{ flex: '1 1 200px' }}
        />
      </div>

      {banner}

      {loading ? (
        <div className="loading-text">Loading topics...</div>
      ) : grouped.length === 0 ? (
        <div className="empty-text">No topics match your filters.</div>
      ) : (
        grouped.map(g => {
          const key = `${g.subject}::${g.grade}`
          return (
            <ClassGroup
              key={key}
              subject={g.subject} grade={g.grade} topics={g.topics}
              expanded={isFiltering || !!expandedGrades[key]}
              onToggle={() => toggleGrade(key)}
              assignLabel={assignLabel} assignDisabled={assignDisabled}
              assigningTopicId={assigningTopicId} onAssign={onAssign}
            />
          )
        })
      )}
    </div>
  )
}
