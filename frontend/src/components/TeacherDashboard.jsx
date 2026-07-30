import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api.js'
import AppNavbar from './AppNavbar.jsx'

// ─── Home Tab ───────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color, bg }) {
  return (
    <div style={{ background: bg, border: `1px solid ${color}33`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: '1.6rem' }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 800, fontSize: '1.3rem', color }}>{value}</div>
        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{label}</div>
      </div>
    </div>
  )
}

function HomeTab({ userName, classes, students, onGoToClasses, onGoToMaterials, onViewClass, onViewStudent }) {
  const totalStudents = classes.reduce((s, c) => s + c.approvedCount, 0)
  const totalPending = classes.reduce((s, c) => s + c.pendingCount, 0)
  const allPending = classes
    .flatMap(c => c.pendingRequests.map(r => ({ ...r, className: c.name })))
    .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))
    .slice(0, 5)

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontWeight: 800, color: '#1e293b', margin: 0 }}>Welcome, {userName}! 🍎</h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0' }}>Here's what's happening with your classes.</p>
      </div>

      <div className="form-card" style={{ border: '1.5px solid #c7d2fe', background: 'linear-gradient(135deg, #eef2ff, #ffffff)', marginBottom: 16 }}>
        <div className="form-title">👋 Getting Started</div>
        <ol style={{ paddingLeft: 20, color: '#334155', fontSize: '0.88rem', lineHeight: 1.9, margin: 0 }}>
          <li>Create a class from the <strong>Classes</strong> tab — you'll get a unique join code.</li>
          <li>Share the join code with parents; they use it to request joining your class.</li>
          <li>Approve join requests from the Classes tab to add students to your roster.</li>
          <li>Assign Math topics to a whole class or to one student from the <strong>Students</strong> tab, and share reading material from the <strong>Materials</strong> tab.</li>
        </ol>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
        <StatCard icon="🏫" label="Classes" value={classes.length} color="#4f46e5" bg="#eef2ff" />
        <StatCard icon="🧑‍🎓" label="Students" value={totalStudents} color="#0d9488" bg="#f0fdfa" />
        <StatCard icon="⏳" label="Pending Requests" value={totalPending} color="#c2410c" bg="#fff7ed" />
      </div>

      <div className="form-card" style={{ marginBottom: 16 }}>
        <div className="form-title">Quick Actions</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm" onClick={onGoToClasses}>➕ Create Class</button>
          <button className="btn btn-outline btn-sm" onClick={onGoToMaterials}>📖 Add Material</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 16 }}>
        <div className="form-card" style={{ margin: 0 }}>
          <div className="form-title">🏫 My Classes</div>
          {classes.length === 0 ? (
            <div className="empty-text">No classes yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {classes.map(c => (
                <button
                  key={c.id}
                  onClick={() => onViewClass(c.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', cursor: 'pointer', textAlign: 'left', width: '100%' }}
                >
                  <span style={{ fontSize: '1.1rem' }}>🏫</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{c.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{c.approvedCount} student{c.approvedCount === 1 ? '' : 's'}</div>
                  </div>
                  {c.pendingCount > 0 && (
                    <span style={{ background: '#fed7aa', color: '#c2410c', borderRadius: 999, padding: '1px 8px', fontSize: '0.72rem', fontWeight: 700 }}>{c.pendingCount} pending</span>
                  )}
                  <span style={{ color: '#cbd5e1' }}>›</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="form-card" style={{ margin: 0 }}>
          <div className="form-title">🧑‍🎓 My Students</div>
          {students.length === 0 ? (
            <div className="empty-text">No students yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {students.map(s => (
                <button
                  key={s.id}
                  onClick={() => onViewStudent(s.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', cursor: 'pointer', textAlign: 'left', width: '100%' }}
                >
                  <span style={{ fontSize: '1.1rem' }}>{s.avatar || '🧑'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{s.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{s.classes.map(c => c.name).join(', ')}</div>
                  </div>
                  <span style={{ color: '#cbd5e1' }}>›</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="form-card">
        <div className="form-title">🔔 Needs Your Approval</div>
        {allPending.length === 0 ? (
          <div className="empty-text">No pending join requests right now.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {allPending.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px' }}>
                <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{r.kidAvatar || '🧑'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>{r.kidName}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>wants to join {r.className}</div>
                </div>
                <button className="btn btn-outline btn-sm" onClick={onGoToClasses}>Review</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Classes Tab ────────────────────────────────────────────────────────────

function ClassesTab({ classes, onRefresh, preselectClassId, onViewStudent }) {
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [selectedClassId, setSelectedClassId] = useState(preselectClassId || classes[0]?.id || '')
  const [roster, setRoster] = useState([])
  const [rosterLoading, setRosterLoading] = useState(false)
  const [approveBusyId, setApproveBusyId] = useState(null)

  const [topics, setTopics] = useState([])
  const [topicSearch, setTopicSearch] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [assigningTopicId, setAssigningTopicId] = useState(null)
  const [assignMsg, setAssignMsg] = useState('')

  const [materials, setMaterials] = useState([])
  const [shareBusyId, setShareBusyId] = useState(null)

  useEffect(() => {
    if (classes.length && !classes.some(c => c.id === selectedClassId)) setSelectedClassId(classes[0].id)
  }, [classes, selectedClassId])

  useEffect(() => {
    if (preselectClassId) setSelectedClassId(preselectClassId)
  }, [preselectClassId])

  const selectedClass = classes.find(c => c.id === selectedClassId)

  const loadRoster = useCallback(async () => {
    if (!selectedClassId) return
    setRosterLoading(true)
    try {
      setRoster(await api.getClassRoster(selectedClassId))
    } catch (e) {
      setRoster([])
    } finally {
      setRosterLoading(false)
    }
  }, [selectedClassId])

  useEffect(() => { loadRoster() }, [loadRoster])

  useEffect(() => {
    api.getMathTopics(topicSearch || undefined).then(setTopics).catch(() => {})
  }, [topicSearch])

  const loadMaterials = useCallback(async () => {
    try { setMaterials(await api.getMaterials()) } catch (e) {}
  }, [])
  useEffect(() => { loadMaterials() }, [loadMaterials])

  async function handleCreate(e) {
    e.preventDefault()
    if (!newName.trim()) { setCreateError('Class name is required.'); return }
    setCreating(true); setCreateError('')
    try {
      const cls = await api.createClass(newName.trim())
      setNewName('')
      await onRefresh()
      setSelectedClassId(cls.id)
    } catch (err) {
      setCreateError(err.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleApprove(membershipId) {
    setApproveBusyId(membershipId)
    try {
      await api.approveMembership(membershipId)
      await onRefresh()
      loadRoster()
    } catch (err) {
      alert(err.message)
    } finally {
      setApproveBusyId(null)
    }
  }

  async function handleReject(membershipId) {
    setApproveBusyId(membershipId)
    try {
      await api.rejectMembership(membershipId)
      await onRefresh()
    } catch (err) {
      alert(err.message)
    } finally {
      setApproveBusyId(null)
    }
  }

  async function handleAssignTopic(topicId) {
    setAssigningTopicId(topicId); setAssignMsg('')
    try {
      const res = await api.assignMathTopicToClass(selectedClassId, topicId, dueDate || null)
      setAssignMsg(
        `Assigned to ${res.assignedCount} student${res.assignedCount === 1 ? '' : 's'}` +
        (res.skippedCount ? ` (${res.skippedCount} already had it).` : '.')
      )
    } catch (err) {
      setAssignMsg(err.message)
    } finally {
      setAssigningTopicId(null)
    }
  }

  async function handleShareMaterial(materialId) {
    setShareBusyId(materialId)
    try {
      await api.shareMaterial(materialId, selectedClassId)
      loadMaterials()
    } catch (err) {
      alert(err.message)
    } finally {
      setShareBusyId(null)
    }
  }

  async function handleUnshareMaterial(materialId) {
    setShareBusyId(materialId)
    try {
      await api.unshareMaterial(materialId, selectedClassId)
      loadMaterials()
    } catch (err) {
      alert(err.message)
    } finally {
      setShareBusyId(null)
    }
  }

  async function handleDeleteClass(cls) {
    if (!window.confirm(`Delete class "${cls.name}"? This removes all join requests and roster data.`)) return
    try {
      await api.deleteClass(cls.id)
      await onRefresh()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div>
      <div className="form-card" style={{ marginBottom: 16 }}>
        <div className="form-title">➕ Create a Class</div>
        {createError && <div className="error-msg">{createError}</div>}
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Grade 4A" style={{ flex: 1, minWidth: 180 }} />
          <button type="submit" className="btn btn-primary btn-sm" disabled={creating}>{creating ? 'Creating...' : 'Create Class'}</button>
        </form>
      </div>

      {classes.length === 0 ? (
        <div className="empty-text">No classes yet — create one above to get started.</div>
      ) : (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {classes.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedClassId(c.id)}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                  border: `1.5px solid ${selectedClassId === c.id ? '#4f46e5' : '#e2e8f0'}`,
                  background: selectedClassId === c.id ? '#eef2ff' : '#fff',
                  color: selectedClassId === c.id ? '#4f46e5' : '#64748b',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {c.name}
                {c.pendingCount > 0 && (
                  <span style={{ background: '#fed7aa', color: '#c2410c', borderRadius: 999, padding: '1px 6px', fontSize: '0.72rem', fontWeight: 700 }}>
                    {c.pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {selectedClass && (
            <>
              <div className="form-card" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1e293b' }}>{selectedClass.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>{roster.length} student{roster.length === 1 ? '' : 's'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Join code:</span>
                  <code
                    onClick={() => navigator.clipboard?.writeText(selectedClass.joinCode)}
                    title="Click to copy"
                    style={{ background: '#eef2ff', color: '#4f46e5', fontWeight: 800, fontSize: '1.05rem', padding: '5px 12px', borderRadius: 8, letterSpacing: 2, cursor: 'pointer' }}
                  >
                    {selectedClass.joinCode}
                  </code>
                  <button className="btn btn-red btn-sm" onClick={() => handleDeleteClass(selectedClass)}>🗑️ Delete Class</button>
                </div>
              </div>

              {selectedClass.pendingRequests.length > 0 && (
                <div className="form-card" style={{ marginBottom: 16, border: '1.5px solid #fed7aa', background: 'linear-gradient(135deg, #fff7ed, #ffffff)' }}>
                  <div className="form-title">⏳ Pending Join Requests</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedClass.pendingRequests.map(r => (
                      <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{r.kidAvatar || '🧑'}</span>
                        <div style={{ flex: 1, minWidth: 120 }}>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>{r.kidName}</span>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Requested by {r.guardianName || 'a parent'}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-green btn-sm" disabled={approveBusyId === r.id} onClick={() => handleApprove(r.id)}>✓ Approve</button>
                          <button className="btn btn-red btn-sm" disabled={approveBusyId === r.id} onClick={() => handleReject(r.id)}>✕ Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-card" style={{ marginBottom: 16 }}>
                <div className="form-title">🧑‍🎓 Roster</div>
                {rosterLoading ? (
                  <div className="loading-text">Loading...</div>
                ) : roster.length === 0 ? (
                  <div className="empty-text">No students yet — share the join code above with parents.</div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {roster.map(k => (
                      <button
                        key={k.id}
                        onClick={() => onViewStudent(k.id)}
                        title="View activity log"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 20, padding: '6px 14px', fontSize: '0.85rem', cursor: 'pointer' }}
                      >
                        {k.avatar} {k.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-card" style={{ marginBottom: 16, border: '1.5px solid #ddd6fe', background: 'linear-gradient(135deg, #f5f3ff, #ffffff)' }}>
                <div className="form-title">➗ Assign a Math Topic to the Whole Class</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  <input value={topicSearch} onChange={e => setTopicSearch(e.target.value)} placeholder="🔍 Search topics..." style={{ flex: '1 1 200px' }} />
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} title="Due date (optional)" />
                </div>
                {assignMsg && <div className="success-msg" style={{ marginBottom: 10 }}>{assignMsg}</div>}
                {roster.length === 0 && <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 10 }}>Add students to this class first.</div>}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                  {topics.map(t => (
                    <div key={t.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', background: '#fff' }}>
                      <div style={{ fontSize: '1.3rem', marginBottom: 4 }}>{t.emoji}</div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b', marginBottom: 8 }}>{t.title}</div>
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={roster.length === 0 || assigningTopicId === t.id}
                        onClick={() => handleAssignTopic(t.id)}
                      >
                        {assigningTopicId === t.id ? 'Assigning...' : '+ Assign to Class'}
                      </button>
                    </div>
                  ))}
                  {topics.length === 0 && <div className="empty-text">No topics match your search.</div>}
                </div>
              </div>

              <div className="form-card">
                <div className="form-title">📖 Reading Material</div>
                {materials.length === 0 ? (
                  <div className="empty-text">You haven't created any reading material yet — head to the Materials tab.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {materials.map(m => {
                      const isShared = m.sharedClassIds.includes(selectedClassId)
                      return (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: 140 }}>
                            <span style={{ fontWeight: 600, color: '#1e293b' }}>{m.title}</span>
                            {m.topic && <span style={{ marginLeft: 8, fontSize: '0.72rem', background: '#f1f5f9', color: '#64748b', borderRadius: 6, padding: '1px 7px' }}>{m.topic}</span>}
                          </div>
                          <button
                            className={`btn btn-sm ${isShared ? 'btn-outline' : 'btn-primary'}`}
                            disabled={shareBusyId === m.id}
                            onClick={() => (isShared ? handleUnshareMaterial(m.id) : handleShareMaterial(m.id))}
                          >
                            {isShared ? '✓ Shared — Unshare' : 'Share to Class'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

// ─── Students Tab ───────────────────────────────────────────────────────────

const ACTIVITY_ICONS = { math_assigned: '➗', math_submitted: '✅', material_submitted: '📖' }

function StudentsTab({ students, preselectStudentId }) {
  const [selectedId, setSelectedId] = useState(preselectStudentId || students[0]?.id || '')
  const [activity, setActivity] = useState(null)
  const [activityLoading, setActivityLoading] = useState(false)

  const [topics, setTopics] = useState([])
  const [topicSearch, setTopicSearch] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [assigningTopicId, setAssigningTopicId] = useState(null)
  const [assignMsg, setAssignMsg] = useState('')

  useEffect(() => {
    if (students.length && !students.some(s => s.id === selectedId)) setSelectedId(students[0].id)
  }, [students, selectedId])

  useEffect(() => {
    if (preselectStudentId) setSelectedId(preselectStudentId)
  }, [preselectStudentId])

  const selected = students.find(s => s.id === selectedId)

  const loadActivity = useCallback(async () => {
    if (!selectedId) return
    setActivityLoading(true)
    try {
      setActivity(await api.getStudentActivity(selectedId))
    } catch (e) {
      setActivity(null)
    } finally {
      setActivityLoading(false)
    }
  }, [selectedId])

  useEffect(() => { loadActivity() }, [loadActivity])

  useEffect(() => {
    api.getMathTopics(topicSearch || undefined).then(setTopics).catch(() => {})
  }, [topicSearch])

  async function handleAssignTopic(topicId) {
    setAssigningTopicId(topicId); setAssignMsg('')
    try {
      await api.assignMathTopicToStudent(selectedId, topicId, dueDate || null)
      setAssignMsg(`Assigned to ${selected?.name}.`)
      loadActivity()
    } catch (err) {
      setAssignMsg(err.message)
    } finally {
      setAssigningTopicId(null)
    }
  }

  if (students.length === 0) {
    return <div className="empty-text">No students yet — approve a join request from the Classes tab first.</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {students.map(s => (
          <button
            key={s.id}
            onClick={() => setSelectedId(s.id)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
              border: `1.5px solid ${selectedId === s.id ? '#4f46e5' : '#e2e8f0'}`,
              background: selectedId === s.id ? '#eef2ff' : '#fff',
              color: selectedId === s.id ? '#4f46e5' : '#64748b',
            }}
          >
            {s.avatar} {s.name}
          </button>
        ))}
      </div>

      {selected && (
        <>
          <div className="form-card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.8rem' }}>{selected.avatar}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1e293b' }}>{selected.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{selected.classes.map(c => c.name).join(', ')}</div>
              </div>
            </div>
          </div>

          <div className="form-card" style={{ marginBottom: 16, border: '1.5px solid #ddd6fe', background: 'linear-gradient(135deg, #f5f3ff, #ffffff)' }}>
            <div className="form-title">➗ Assign a Math Topic to {selected.name}</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <input value={topicSearch} onChange={e => setTopicSearch(e.target.value)} placeholder="🔍 Search topics..." style={{ flex: '1 1 200px' }} />
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} title="Due date (optional)" />
            </div>
            {assignMsg && <div className="success-msg" style={{ marginBottom: 10 }}>{assignMsg}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {topics.map(t => (
                <div key={t.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', background: '#fff' }}>
                  <div style={{ fontSize: '1.3rem', marginBottom: 4 }}>{t.emoji}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b', marginBottom: 8 }}>{t.title}</div>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={assigningTopicId === t.id}
                    onClick={() => handleAssignTopic(t.id)}
                  >
                    {assigningTopicId === t.id ? 'Assigning...' : `+ Assign to ${selected.name}`}
                  </button>
                </div>
              ))}
              {topics.length === 0 && <div className="empty-text">No topics match your search.</div>}
            </div>
          </div>

          <div className="form-card">
            <div className="form-title">📋 Activity — Last 10 Days</div>
            {activityLoading ? (
              <div className="loading-text">Loading...</div>
            ) : !activity || activity.events.length === 0 ? (
              <div className="empty-text">No activity from {selected.name} in the last 10 days yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activity.events.map((e, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px' }}>
                    <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{ACTIVITY_ICONS[e.type] || '•'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', color: '#1e293b' }}>{e.text}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{new Date(e.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Materials Tab ──────────────────────────────────────────────────────────

function MaterialShareControls({ material, classes, students, onChanged }) {
  const [shareClassId, setShareClassId] = useState('')
  const [shareStudentId, setShareStudentId] = useState('')
  const [busy, setBusy] = useState(false)

  async function run(fn) {
    setBusy(true)
    try {
      await fn()
      onChanged()
    } catch (err) {
      alert(err.message)
    } finally {
      setBusy(false)
    }
  }

  const availableClasses = classes.filter(c => !material.sharedClassIds.includes(c.id))
  const availableStudents = students.filter(s => !material.sharedKidIds.includes(s.id))
  const chipStyle = { display: 'flex', alignItems: 'center', gap: 5, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 20, padding: '3px 6px 3px 10px', fontSize: '0.75rem', color: '#334155' }
  const chipBtnStyle = { border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem', padding: '0 4px' }

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed #e2e8f0' }}>
      {(material.sharedClassIds.length > 0 || material.sharedKidIds.length > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {material.sharedClassIds.map(id => {
            const cls = classes.find(c => c.id === id)
            return (
              <span key={id} style={chipStyle}>
                🏫 {cls?.name || 'Class'}
                <button type="button" disabled={busy} style={chipBtnStyle} onClick={() => run(() => api.unshareMaterial(material.id, id))}>✕</button>
              </span>
            )
          })}
          {material.sharedKidIds.map(id => {
            const student = students.find(s => s.id === id)
            return (
              <span key={id} style={chipStyle}>
                🧑 {student?.name || 'Student'}
                <button type="button" disabled={busy} style={chipBtnStyle} onClick={() => run(() => api.unshareMaterialFromStudent(material.id, id))}>✕</button>
              </span>
            )
          })}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <select value={shareClassId} onChange={e => setShareClassId(e.target.value)} style={{ fontSize: '0.78rem', padding: '4px 8px' }}>
          <option value="">Share with a class...</option>
          {availableClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button
          type="button" className="btn btn-outline btn-sm" disabled={!shareClassId || busy}
          onClick={() => run(() => api.shareMaterial(material.id, shareClassId)).then(() => setShareClassId(''))}
        >
          Share
        </button>
        <select value={shareStudentId} onChange={e => setShareStudentId(e.target.value)} style={{ fontSize: '0.78rem', padding: '4px 8px' }}>
          <option value="">Share with a student...</option>
          {availableStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button
          type="button" className="btn btn-outline btn-sm" disabled={!shareStudentId || busy}
          onClick={() => run(() => api.shareMaterialWithStudent(material.id, shareStudentId)).then(() => setShareStudentId(''))}
        >
          Share
        </button>
      </div>
    </div>
  )
}

function MaterialsTab({ classes, students }) {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [topic, setTopic] = useState('')
  const [questions, setQuestions] = useState([])
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setMaterials(await api.getMaterials(search || undefined))
    } catch (e) {
      setMaterials([])
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { load() }, [load])

  function addQuestionRow() {
    setQuestions(qs => [...qs, { question: '', answers: '' }])
  }
  function updateQuestionRow(i, field, value) {
    setQuestions(qs => qs.map((q, idx) => (idx === i ? { ...q, [field]: value } : q)))
  }
  function removeQuestionRow(i) {
    setQuestions(qs => qs.filter((_, idx) => idx !== i))
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!title.trim()) { setAddError('Title is required.'); return }
    const cleanQuestions = questions
      .filter(q => q.question.trim() && q.answers.trim())
      .map(q => ({ question: q.question.trim(), answers: q.answers.split(',').map(a => a.trim()).filter(Boolean) }))
    setAdding(true); setAddError('')
    try {
      await api.createMaterial({
        title: title.trim(), description: description.trim(), url: url.trim() || null, topic: topic.trim() || null,
        questions: cleanQuestions.length ? cleanQuestions : undefined,
      })
      setTitle(''); setDescription(''); setUrl(''); setTopic(''); setQuestions([])
      load()
    } catch (err) {
      setAddError(err.message)
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this reading material? It will be removed from any classes or students it was shared with.')) return
    try {
      await api.deleteMaterial(id)
      load()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div>
      <div className="form-card" style={{ marginBottom: 16 }}>
        <div className="form-title">➕ Add Reading Material</div>
        {addError && <div className="error-msg">{addError}</div>}
        <form onSubmit={handleAdd}>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Fun with Fractions" />
            </div>
            <div className="form-group">
              <label>Topic</label>
              <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. fractions" />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 10 }}>
            <label>Description</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional details..." />
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label>Link (optional)</label>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label>Practice Questions <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '0.78rem' }}>(optional — students can answer these for points)</span></label>
            {questions.map((q, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <input value={q.question} onChange={e => updateQuestionRow(i, 'question', e.target.value)} placeholder="Question" style={{ flex: '2 1 200px' }} />
                <input value={q.answers} onChange={e => updateQuestionRow(i, 'answers', e.target.value)} placeholder="Accepted answers, comma-separated" style={{ flex: '1 1 180px' }} />
                <button type="button" className="btn btn-red btn-sm" onClick={() => removeQuestionRow(i)}>✕</button>
              </div>
            ))}
            <button type="button" className="btn btn-outline btn-sm" onClick={addQuestionRow}>+ Add Question</button>
          </div>
          <button type="submit" className="btn btn-primary" disabled={adding}>{adding ? 'Adding...' : 'Add Material'}</button>
        </form>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="🔍 Search your material by topic, title, or description..."
        style={{ marginBottom: 14, width: '100%', boxSizing: 'border-box' }}
      />

      {loading ? (
        <div className="loading-text">Loading...</div>
      ) : materials.length === 0 ? (
        <div className="empty-text">No reading material {search ? 'matches your search' : 'yet — add some above'}.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {materials.map(m => (
            <div key={m.id} className="form-card" style={{ margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: '#1e293b' }}>
                    {m.title}
                    {m.topic && <span style={{ marginLeft: 8, fontSize: '0.72rem', background: '#f1f5f9', color: '#64748b', borderRadius: 6, padding: '1px 7px', fontWeight: 600 }}>{m.topic}</span>}
                    {m.questionCount > 0 && <span style={{ marginLeft: 8, fontSize: '0.72rem', background: '#ede9fe', color: '#7c3aed', borderRadius: 6, padding: '1px 7px', fontWeight: 600 }}>❓ {m.questionCount} questions</span>}
                  </div>
                  {m.description && <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 4 }}>{m.description}</div>}
                  {m.url && <a href={m.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#4f46e5', display: 'inline-block', marginTop: 6 }}>🔗 {m.url}</a>}
                </div>
                <button className="btn btn-red btn-sm" onClick={() => handleDelete(m.id)}>🗑️</button>
              </div>
              <MaterialShareControls material={m} classes={classes} students={students} onChanged={load} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Teacher Dashboard Shell ────────────────────────────────────────────────

export default function TeacherDashboard() {
  const { user, logout } = useAuth()
  const [tab, setTab] = useState('home')
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [preselectClassId, setPreselectClassId] = useState('')
  const [preselectStudentId, setPreselectStudentId] = useState('')

  const loadClasses = useCallback(async () => {
    try {
      setClasses(await api.getClasses())
    } catch (e) {
      setClasses([])
    }
  }, [])

  const loadStudents = useCallback(async () => {
    try {
      setStudents(await api.getAllStudents())
    } catch (e) {
      setStudents([])
    }
  }, [])

  useEffect(() => {
    Promise.all([loadClasses(), loadStudents()]).finally(() => setLoading(false))
  }, [loadClasses, loadStudents])

  function goToClass(classId) {
    setPreselectClassId(classId)
    setTab('classes')
  }

  function goToStudent(kidId) {
    setPreselectStudentId(kidId)
    setTab('students')
  }

  async function refreshAll() {
    await Promise.all([loadClasses(), loadStudents()])
  }

  return (
    <div className="app-container">
      <AppNavbar variant="teacher" userName={user.name}>
        <button className="logout-btn" onClick={logout}>🚪 Sign Out</button>
      </AppNavbar>

      <div className="main-content">
        <div className="tabs">
          {['home', 'classes', 'students', 'materials'].map(t => (
            <button key={t} className={`tab-btn${tab === t ? ' active teacher' : ''}`} onClick={() => setTab(t)}>
              {t === 'home' ? '🏠 Dashboard' : t === 'classes' ? '🏫 Classes' : t === 'students' ? '🧑‍🎓 Students' : '📖 Materials'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-text">Loading...</div>
        ) : (
          <>
            {tab === 'home'      && (
              <HomeTab
                userName={user.name} classes={classes} students={students}
                onGoToClasses={() => setTab('classes')} onGoToMaterials={() => setTab('materials')}
                onViewClass={goToClass} onViewStudent={goToStudent}
              />
            )}
            {tab === 'classes'   && (
              <ClassesTab classes={classes} onRefresh={refreshAll} preselectClassId={preselectClassId} onViewStudent={goToStudent} />
            )}
            {tab === 'students'  && (
              <StudentsTab students={students} preselectStudentId={preselectStudentId} />
            )}
            {tab === 'materials' && <MaterialsTab classes={classes} students={students} />}
          </>
        )}
      </div>
    </div>
  )
}
