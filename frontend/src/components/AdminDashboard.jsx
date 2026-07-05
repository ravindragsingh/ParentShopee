import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api.js'

const STATUS_STYLE = {
  open:     { bg: '#eff6ff', color: '#1d4ed8' },
  pending:  { bg: '#fefce8', color: '#a16207' },
  complete: { bg: '#f0fdf4', color: '#166534' },
  expired:  { bg: '#fef2f2', color: '#991b1b' },
}

const TXN_STYLE = {
  earned:           { color: '#166534', symbol: '+' },
  bonus:            { color: '#7c3aed', symbol: '+' },
  behaviour:        { color: '#0369a1', symbol: '+' },
  spent:            { color: '#b91c1c', symbol: '-' },
  deduct:           { color: '#b91c1c', symbol: '-' },
  behaviour_deduct: { color: '#b91c1c', symbol: '-' },
}

const KID_AVATARS = ['🐶','🐱','🦁','🐯','🦊','🐻','🐼','🐨','🐸','🦄','🐧','🐬','🦋','🐙','🦖','🦒','🐘','🌟','⭐','🌈']

const inputStyle = {
  width: '100%', padding: '8px 11px', borderRadius: 8,
  border: '1px solid #e2e8f0', fontSize: '0.87rem', outline: 'none', boxSizing: 'border-box',
}
const labelStyle = { display: 'block', fontWeight: 600, fontSize: '0.8rem', color: '#374151', marginBottom: 4 }
const editBtnStyle = {
  background: '#ede9fe', border: '1px solid #c4b5fd', borderRadius: 6,
  padding: '4px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', color: '#7c3aed', flexShrink: 0,
}

// ── Edit modal ────────────────────────────────────────────────────────────────

function EditModal({ target, familyKids, onSave, onClose }) {
  const isUser = target.type === 'user'
  const isKid  = isUser && target.data.role === 'kid'
  const d      = target.data

  const [form, setForm] = useState({
    // user fields
    name:          d.name          || '',
    email:         d.email         || '',
    password:      '',
    avatar:        d.avatar        || '🐶',
    // chore fields
    title:         d.title         || '',
    description:   d.description   || '',
    points:        d.points        ?? 0,
    status:        d.status        || 'open',
    assignedKidId: d.assignedKidId || '',
    dueDate:       d.dueDate       || '',
    imageEmoji:    d.imageEmoji    || '📋',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  function set(field) { return e => setForm(f => ({ ...f, [field]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (isUser) {
        const body = { name: form.name }
        if (!isKid && form.email)  body.email    = form.email
        if (form.password)         body.password = form.password
        if (isKid)                 body.avatar   = form.avatar
        await api.adminUpdateUser(d.id, body)
      } else {
        await api.adminUpdateChore(d.id, {
          title:         form.title,
          description:   form.description,
          points:        Number(form.points),
          status:        form.status,
          assignedKidId: form.assignedKidId || null,
          dueDate:       form.dueDate || null,
          imageEmoji:    form.imageEmoji,
        })
      }
      onSave()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  const roleLabel = isKid ? 'Child' : (d.coParentOf ? 'Co-Parent' : 'Parent')

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.22)', maxHeight: '90vh', overflow: 'auto' }}
      >
        {/* Header */}
        <div style={{ padding: '16px 22px 12px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>
              {isUser ? `Edit ${roleLabel}` : 'Edit Chore'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
              {isUser ? `@${d.username}` : d.title}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '18px 22px' }}>
          {error && (
            <div style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: '0.83rem' }}>
              {error}
            </div>
          )}

          {/* ── User fields ── */}
          {isUser && (
            <>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Full Name</label>
                <input value={form.name} onChange={set('name')} style={inputStyle} required />
              </div>
              {!isKid && (
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Email</label>
                  <input type="email" value={form.email} onChange={set('email')} style={inputStyle} />
                </div>
              )}
              <div style={{ marginBottom: isKid ? 16 : 6 }}>
                <label style={labelStyle}>
                  New Password{' '}
                  <span style={{ fontWeight: 400, color: '#94a3b8' }}>(leave blank to keep current)</span>
                </label>
                <input type="password" value={form.password} onChange={set('password')} placeholder="••••" style={inputStyle} />
              </div>
              {isKid && (
                <div style={{ marginBottom: 6 }}>
                  <label style={labelStyle}>Avatar</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                    {KID_AVATARS.map(a => (
                      <button
                        key={a} type="button"
                        onClick={() => setForm(f => ({ ...f, avatar: a }))}
                        style={{ fontSize: '1.3rem', width: 42, height: 42, borderRadius: 10, border: `2px solid ${form.avatar === a ? '#7c3aed' : '#e2e8f0'}`, background: form.avatar === a ? '#ede9fe' : '#fff', cursor: 'pointer' }}
                      >{a}</button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Chore fields ── */}
          {!isUser && (
            <>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Emoji</label>
                  <input value={form.imageEmoji} onChange={set('imageEmoji')} style={{ ...inputStyle, width: 64, textAlign: 'center', fontSize: '1.2rem' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Title</label>
                  <input value={form.title} onChange={set('title')} style={inputStyle} required />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Description</label>
                <input value={form.description} onChange={set('description')} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Points</label>
                  <input type="number" min="0" value={form.points} onChange={set('points')} style={inputStyle} />
                </div>
                <div style={{ flex: 2 }}>
                  <label style={labelStyle}>Status</label>
                  <select value={form.status} onChange={set('status')} style={inputStyle}>
                    <option value="open">Open</option>
                    <option value="pending">Pending Approval</option>
                    <option value="complete">Complete</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
                <div style={{ flex: 2 }}>
                  <label style={labelStyle}>Assigned to</label>
                  <select value={form.assignedKidId} onChange={set('assignedKidId')} style={inputStyle}>
                    <option value="">— Any kid —</option>
                    {familyKids.map(k => <option key={k.id} value={k.id}>{k.avatar} {k.name}</option>)}
                  </select>
                </div>
                <div style={{ flex: 2 }}>
                  <label style={labelStyle}>Due date</label>
                  <input type="date" value={form.dueDate} onChange={set('dueDate')} style={inputStyle} />
                </div>
              </div>
            </>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="button" onClick={onClose}
              style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: '#7c3aed', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Helper components ─────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
      <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    </div>
  )
}

function Th({ children }) {
  return (
    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
      {children}
    </th>
  )
}

function Td({ children, style }) {
  return (
    <td style={{ padding: '9px 12px', fontSize: '0.83rem', color: '#334155', borderBottom: '1px solid #f1f5f9', ...style }}>
      {children}
    </td>
  )
}

// ── Admin Dashboard ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const [families,      setFamilies]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState('')
  const [search,        setSearch]        = useState('')
  const [selected,      setSelected]      = useState(null)
  const [detail,        setDetail]        = useState({ chores: [], transactions: [] })
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailTab,     setDetailTab]     = useState('chores')
  const [editTarget,    setEditTarget]    = useState(null)

  useEffect(() => { loadFamilies() }, [])

  async function loadFamilies() {
    try {
      const data = await api.adminFamilies()
      setFamilies(data)
      setLoading(false)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  async function refreshAll(familyId) {
    const data = await api.adminFamilies()
    setFamilies(data)
    if (familyId) {
      const fresh = data.find(f => f.familyId === familyId)
      if (fresh) setSelected(fresh)
      const [chores, transactions] = await Promise.all([
        api.adminFamilyChores(familyId),
        api.adminFamilyTransactions(familyId),
      ])
      setDetail({ chores, transactions })
    }
  }

  async function selectFamily(family) {
    if (selected?.familyId === family.familyId) { setSelected(null); return }
    setSelected(family)
    setDetailTab('members')
    setDetailLoading(true)
    setDetail({ chores: [], transactions: [] })
    try {
      const [chores, transactions] = await Promise.all([
        api.adminFamilyChores(family.familyId),
        api.adminFamilyTransactions(family.familyId),
      ])
      setDetail({ chores, transactions })
    } catch (e) {
      setDetail({ chores: [], transactions: [] })
    }
    setDetailLoading(false)
  }

  function openEditUser(e, data, familyId) {
    e.stopPropagation()
    setEditTarget({ type: 'user', data, familyId, familyKids: [] })
  }

  function openEditChore(e, data, family) {
    e.stopPropagation()
    setEditTarget({ type: 'chore', data, familyId: family.familyId, familyKids: family.kids })
  }

  async function handleEditSave() {
    const familyId = editTarget?.familyId
    setEditTarget(null)
    await refreshAll(familyId)
  }

  const filtered = families.filter(f => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      f.parent.name.toLowerCase().includes(q) ||
      f.parent.username.toLowerCase().includes(q) ||
      (f.parent.email || '').toLowerCase().includes(q) ||
      f.kids.some(k => k.name.toLowerCase().includes(q)) ||
      (f.coParent?.name || '').toLowerCase().includes(q)
    )
  })

  const totalFamilies = families.length
  const totalParents  = families.reduce((s, f) => s + 1 + (f.coParent ? 1 : 0), 0)
  const totalKids     = families.reduce((s, f) => s + f.kids.length, 0)
  const totalChores   = families.reduce((s, f) => s + Object.values(f.choreCounts).reduce((a, b) => a + b, 0), 0)

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Edit modal */}
      {editTarget && (
        <EditModal
          target={editTarget}
          familyKids={editTarget.familyKids || []}
          onSave={handleEditSave}
          onClose={() => setEditTarget(null)}
        />
      )}

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '1.5rem' }}>🛡️</span>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem' }}>ParentShopee — Admin Panel</div>
            <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Signed in as {user?.username}</div>
          </div>
        </div>
        <button
          onClick={logout}
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: '#e2e8f0', borderRadius: 8, padding: '7px 18px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
        >
          Sign out
        </button>
      </div>

      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '22px 16px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 22 }}>
          <StatCard icon="🏠" label="Families" value={totalFamilies} color="#7c3aed" />
          <StatCard icon="👤" label="Parents"  value={totalParents}  color="#0369a1" />
          <StatCard icon="🧒" label="Children" value={totalKids}     color="#059669" />
          <StatCard icon="📋" label="Chores"   value={totalChores}   color="#d97706" />
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by parent name, username, email or child name…"
            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: '0.88rem', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
          />
        </div>

        {error && <div style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: '0.85rem' }}>{error}</div>}
        {loading && <div style={{ textAlign: 'center', color: '#94a3b8', padding: 48, fontSize: '0.9rem' }}>Loading families…</div>}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: 48, fontSize: '0.9rem' }}>
            {search ? 'No families match your search.' : 'No families registered yet.'}
          </div>
        )}

        {/* Family rows */}
        {!loading && filtered.map(family => {
          const isSelected = selected?.familyId === family.familyId
          return (
            <div key={family.familyId} style={{ marginBottom: 12 }}>

              {/* Summary card */}
              <div
                onClick={() => selectFamily(family)}
                style={{ background: '#fff', borderRadius: isSelected ? '12px 12px 0 0' : 12, border: `1.5px solid ${isSelected ? '#7c3aed' : '#e2e8f0'}`, cursor: 'pointer', padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}
              >
                {/* Primary parent */}
                <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Primary Parent</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{family.parent.name}</span>
                    <button style={editBtnStyle} onClick={e => openEditUser(e, family.parent, family.familyId)}>✏️ Edit</button>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>@{family.parent.username}</div>
                  {family.parent.email && <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{family.parent.email}</div>}
                </div>

                {/* Co-parent */}
                <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Co-Parent</div>
                  {family.coParent
                    ? <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.88rem' }}>{family.coParent.name}</span>
                          <button style={editBtnStyle} onClick={e => openEditUser(e, family.coParent, family.familyId)}>✏️ Edit</button>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>@{family.coParent.username}</div>
                      </>
                    : <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>—</div>
                  }
                </div>

                {/* Kids */}
                <div style={{ flex: '2 1 240px', minWidth: 0 }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Children ({family.kids.length})</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {family.kids.length === 0
                      ? <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>None</span>
                      : family.kids.map(kid => (
                          <span key={kid.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 20, padding: '4px 10px', fontSize: '0.8rem' }}>
                            {kid.avatar} <strong>{kid.name}</strong>
                            <span style={{ color: '#7c3aed', fontWeight: 700, marginLeft: 2 }}>{kid.balance} pts</span>
                            <button style={{ ...editBtnStyle, padding: '1px 6px', marginLeft: 2 }} onClick={e => openEditUser(e, kid, family.familyId)}>✏️</button>
                          </span>
                        ))
                    }
                  </div>
                </div>

                {/* Counts + collapse toggle */}
                <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {Object.entries(family.choreCounts).map(([status, count]) => (
                      count > 0 && (
                        <span key={status} style={{ background: STATUS_STYLE[status]?.bg, color: STATUS_STYLE[status]?.color, borderRadius: 8, padding: '3px 9px', fontSize: '0.74rem', fontWeight: 700 }}>
                          {count} {status}
                        </span>
                      )
                    ))}
                  </div>
                  {family.recurringCount > 0 && (
                    <span style={{ background: '#ede9fe', color: '#7c3aed', borderRadius: 8, padding: '3px 9px', fontSize: '0.74rem', fontWeight: 700 }}>
                      🔁 {family.recurringCount} recurring
                    </span>
                  )}
                  <span style={{ color: '#94a3b8', fontSize: '0.72rem', marginTop: 4 }}>{isSelected ? '▲ collapse' : '▼ expand'}</span>
                </div>
              </div>

              {/* Detail panel */}
              {isSelected && (
                <div style={{ background: '#fff', border: '1.5px solid #7c3aed', borderTop: '1px solid #e2e8f0', borderRadius: '0 0 12px 12px' }}>

                  {/* Tabs */}
                  <div style={{ display: 'flex', padding: '0 20px', borderBottom: '1px solid #e2e8f0' }}>
                    {[
                      { id: 'members',      label: '👥 Members',      count: family.kids.length + 1 + (family.coParent ? 1 : 0) },
                      { id: 'chores',       label: '📋 Chores',       count: detail.chores.length },
                      { id: 'transactions', label: '💳 Transactions',  count: detail.transactions.length },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={e => { e.stopPropagation(); setDetailTab(tab.id) }}
                        style={{
                          padding: '12px 18px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600,
                          fontSize: '0.85rem', color: detailTab === tab.id ? '#7c3aed' : '#64748b',
                          borderBottom: `2px solid ${detailTab === tab.id ? '#7c3aed' : 'transparent'}`, marginBottom: -1,
                        }}
                      >
                        {tab.label}
                        {!detailLoading && tab.count > 0 && (
                          <span style={{ marginLeft: 6, background: detailTab === tab.id ? '#ede9fe' : '#f1f5f9', color: detailTab === tab.id ? '#7c3aed' : '#64748b', borderRadius: 10, padding: '1px 7px', fontSize: '0.75rem' }}>
                            {tab.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div style={{ padding: '0 4px 4px' }}>
                    {detailLoading && <div style={{ textAlign: 'center', color: '#94a3b8', padding: 32, fontSize: '0.88rem' }}>Loading…</div>}

                    {/* Members tab */}
                    {detailTab === 'members' && (
                      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[
                          { ...family.parent,   _label: 'Primary Parent' },
                          ...(family.coParent ? [{ ...family.coParent, _label: 'Co-Parent' }] : []),
                          ...family.kids.map(k => ({ ...k, _label: 'Child' })),
                        ].map(member => (
                          <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px' }}>
                            <div style={{ fontSize: '1.6rem', flexShrink: 0 }}>
                              {member.avatar || (member.gender === 'female' ? '👩' : '👨')}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{member.name}</span>
                                <span style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#64748b', borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>{member._label}</span>
                              </div>
                              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>@{member.username}</div>
                              {member.email && <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>{member.email}</div>}
                              {member.balance !== undefined && (
                                <div style={{ fontSize: '0.78rem', color: '#7c3aed', fontWeight: 700, marginTop: 2 }}>{member.balance} pts</div>
                              )}
                            </div>
                            <button
                              style={{ ...editBtnStyle, padding: '8px 18px', fontSize: '0.85rem' }}
                              onClick={e => openEditUser(e, member, family.familyId)}
                            >
                              ✏️ Edit
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Chores table */}
                    {!detailLoading && detailTab === 'chores' && (
                      detail.chores.length === 0
                        ? <div style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>No chores found.</div>
                        : <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                  <Th>Chore</Th><Th>Status</Th><Th>Points</Th>
                                  <Th>Assigned to</Th><Th>Completed by</Th><Th>Due date</Th><Th></Th>
                                </tr>
                              </thead>
                              <tbody>
                                {detail.chores.map(chore => {
                                  const assignedKid  = family.kids.find(k => k.id === chore.assignedKidId)
                                  const completedKid = family.kids.find(k => k.id === chore.completedByKidId)
                                  const s = STATUS_STYLE[chore.status] || {}
                                  return (
                                    <tr key={chore.id}>
                                      <Td>
                                        <span style={{ marginRight: 5 }}>{chore.imageEmoji}</span>
                                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{chore.title}</span>
                                        {chore.templateId && <span style={{ marginLeft: 6, fontSize: '0.7rem', background: '#ede9fe', color: '#7c3aed', borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>🔁</span>}
                                      </Td>
                                      <Td>
                                        <span style={{ background: s.bg, color: s.color, borderRadius: 6, padding: '2px 8px', fontWeight: 700, fontSize: '0.74rem', textTransform: 'capitalize' }}>
                                          {chore.status}
                                        </span>
                                      </Td>
                                      <Td style={{ fontWeight: 700, color: '#7c3aed' }}>{chore.points}</Td>
                                      <Td>{assignedKid  ? `${assignedKid.avatar} ${assignedKid.name}`   : '—'}</Td>
                                      <Td>{completedKid ? `${completedKid.avatar} ${completedKid.name}` : '—'}</Td>
                                      <Td style={{ color: '#94a3b8', whiteSpace: 'nowrap' }}>{chore.dueDate || '—'}</Td>
                                      <Td>
                                        <button style={editBtnStyle} onClick={e => openEditChore(e, chore, family)}>✏️ Edit</button>
                                      </Td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                    )}

                    {/* Transactions table */}
                    {!detailLoading && detailTab === 'transactions' && (
                      detail.transactions.length === 0
                        ? <div style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>No transactions found.</div>
                        : <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                  <Th>Child</Th><Th>Type</Th><Th>Amount</Th><Th>Description</Th><Th>Date</Th>
                                </tr>
                              </thead>
                              <tbody>
                                {detail.transactions.map(t => {
                                  const c = TXN_STYLE[t.type] || { color: '#334155', symbol: '' }
                                  return (
                                    <tr key={t.id}>
                                      <Td><span style={{ marginRight: 4 }}>{t.kidAvatar}</span>{t.kidName}</Td>
                                      <Td><span style={{ color: c.color, fontWeight: 700, fontSize: '0.78rem', textTransform: 'capitalize' }}>{t.type}</span></Td>
                                      <Td style={{ fontWeight: 700, color: c.color }}>{c.symbol}{t.amount} pts</Td>
                                      <Td>{t.description}</Td>
                                      <Td style={{ color: '#94a3b8', whiteSpace: 'nowrap' }}>{t.timestamp.slice(0, 10)}</Td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
