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

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const [families, setFamilies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState({ chores: [], transactions: [] })
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailTab, setDetailTab] = useState('chores')

  useEffect(() => {
    api.adminFamilies()
      .then(data => { setFamilies(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  async function selectFamily(family) {
    if (selected?.familyId === family.familyId) {
      setSelected(null)
      return
    }
    setSelected(family)
    setDetailTab('chores')
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
          <StatCard icon="🏠" label="Families"  value={totalFamilies} color="#7c3aed" />
          <StatCard icon="👤" label="Parents"   value={totalParents}  color="#0369a1" />
          <StatCard icon="🧒" label="Children"  value={totalKids}     color="#059669" />
          <StatCard icon="📋" label="Chores"    value={totalChores}   color="#d97706" />
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
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
                  <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{family.parent.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>@{family.parent.username}</div>
                  {family.parent.email && <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{family.parent.email}</div>}
                </div>

                {/* Co-parent */}
                <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Co-Parent</div>
                  {family.coParent
                    ? <>
                        <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.88rem' }}>{family.coParent.name}</div>
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
                          <span key={kid.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 20, padding: '4px 11px', fontSize: '0.8rem' }}>
                            {kid.avatar} <strong>{kid.name}</strong>
                            <span style={{ color: '#7c3aed', fontWeight: 700, marginLeft: 2 }}>{kid.balance} pts</span>
                          </span>
                        ))
                    }
                  </div>
                </div>

                {/* Chore counts + recurring */}
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
                      { id: 'chores',       label: '📋 Chores',       count: detail.chores.length },
                      { id: 'transactions', label: '💳 Transactions',  count: detail.transactions.length },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={e => { e.stopPropagation(); setDetailTab(tab.id) }}
                        style={{
                          padding: '12px 18px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600,
                          fontSize: '0.85rem', color: detailTab === tab.id ? '#7c3aed' : '#64748b',
                          borderBottom: `2px solid ${detailTab === tab.id ? '#7c3aed' : 'transparent'}`,
                          marginBottom: -1,
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
                    {detailLoading && (
                      <div style={{ textAlign: 'center', color: '#94a3b8', padding: 32, fontSize: '0.88rem' }}>Loading…</div>
                    )}

                    {/* Chores table */}
                    {!detailLoading && detailTab === 'chores' && (
                      detail.chores.length === 0
                        ? <div style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>No chores found.</div>
                        : <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                  <Th>Chore</Th>
                                  <Th>Status</Th>
                                  <Th>Points</Th>
                                  <Th>Assigned to</Th>
                                  <Th>Completed by</Th>
                                  <Th>Due date</Th>
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
                                        {chore.templateId && (
                                          <span style={{ marginLeft: 6, fontSize: '0.7rem', background: '#ede9fe', color: '#7c3aed', borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>🔁</span>
                                        )}
                                      </Td>
                                      <Td>
                                        <span style={{ background: s.bg, color: s.color, borderRadius: 6, padding: '2px 8px', fontWeight: 700, fontSize: '0.74rem', textTransform: 'capitalize' }}>
                                          {chore.status}
                                        </span>
                                      </Td>
                                      <Td style={{ fontWeight: 700, color: '#7c3aed' }}>{chore.points}</Td>
                                      <Td>{assignedKid  ? `${assignedKid.avatar}  ${assignedKid.name}`  : '—'}</Td>
                                      <Td>{completedKid ? `${completedKid.avatar} ${completedKid.name}` : '—'}</Td>
                                      <Td style={{ color: '#94a3b8' }}>{chore.dueDate || '—'}</Td>
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
                                  <Th>Child</Th>
                                  <Th>Type</Th>
                                  <Th>Amount</Th>
                                  <Th>Description</Th>
                                  <Th>Date</Th>
                                </tr>
                              </thead>
                              <tbody>
                                {detail.transactions.map(t => {
                                  const c = TXN_STYLE[t.type] || { color: '#334155', symbol: '' }
                                  return (
                                    <tr key={t.id}>
                                      <Td><span style={{ marginRight: 4 }}>{t.kidAvatar}</span>{t.kidName}</Td>
                                      <Td>
                                        <span style={{ color: c.color, fontWeight: 700, fontSize: '0.78rem', textTransform: 'capitalize' }}>{t.type}</span>
                                      </Td>
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
