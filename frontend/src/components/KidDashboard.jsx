import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api.js'
import { KidChoreCard } from './ChoreCard.jsx'
import { KidShopItem } from './ShopItem.jsx'
import { KidWalletView } from './WalletView.jsx'
import MessagesTab from './Messages.jsx'
import { HelpTab } from './Help.jsx'
import HamburgerMenu from './HamburgerMenu.jsx'
import SettingsPanel from './Settings.jsx'

// ─── Chores Tab ─────────────────────────────────────────────────────────────

function KidChoresTab({ userId }) {
  const [chores, setChores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadChores = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getChores()
      setChores(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadChores() }, [loadChores])

  // Available: open chores assigned to me or to nobody
  const available = chores.filter(c =>
    c.status === 'open' &&
    (!c.assignedKidId || c.assignedKidId === userId)
  )

  // My pending: chores I marked complete, awaiting parent approval
  const myPending = chores.filter(c =>
    c.status === 'pending' &&
    (c.completedByKidId === userId || c.assignedKidId === userId)
  )

  // My completed: chores I completed and parent approved
  const myCompleted = chores.filter(c =>
    c.status === 'complete' &&
    (c.completedByKidId === userId || c.assignedKidId === userId)
  )

  // Expired: chores assigned to me (or any kid) that expired
  const myExpired = chores.filter(c =>
    c.status === 'expired' &&
    (!c.assignedKidId || c.assignedKidId === userId)
  )

  if (loading) return <div className="loading-text">Loading chores...</div>
  if (error) return <div className="error-msg">{error}</div>

  return (
    <div>
      <div className="section-header open">✨ Available Chores ({available.length})</div>
      {available.length === 0 ? (
        <div className="empty-text">No available chores right now.</div>
      ) : (
        available.map(chore => (
          <KidChoreCard key={chore.id} chore={chore} onRefresh={loadChores} />
        ))
      )}

      <div className="section-header pending" style={{ marginTop: 8 }}>⏳ My Pending ({myPending.length})</div>
      {myPending.length === 0 ? (
        <div className="empty-text">No chores awaiting approval.</div>
      ) : (
        myPending.map(chore => (
          <KidChoreCard key={chore.id} chore={chore} onRefresh={loadChores} />
        ))
      )}

      <div className="section-header complete" style={{ marginTop: 8 }}>🏆 My Completed ({myCompleted.length})</div>
      {myCompleted.length === 0 ? (
        <div className="empty-text">No approved chores yet. Keep it up!</div>
      ) : (
        myCompleted.map(chore => (
          <KidChoreCard key={chore.id} chore={chore} onRefresh={loadChores} />
        ))
      )}

      {myExpired.length > 0 && (
        <>
          <div className="section-header expired" style={{ marginTop: 8 }}>⌛ Expired ({myExpired.length})</div>
          {myExpired.map(chore => (
            <KidChoreCard key={chore.id} chore={chore} onRefresh={loadChores} />
          ))}
        </>
      )}
    </div>
  )
}

// ─── Shop Tab ────────────────────────────────────────────────────────────────

function KidShopTab({ userId }) {
  const [items, setItems] = useState([])
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortOrder, setSortOrder] = useState('')  // '' | 'asc' | 'desc'

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [shopData, walletData] = await Promise.all([
        api.getShopItems(),
        api.getWallet(userId)
      ])
      setItems(Array.isArray(shopData) ? shopData : [])
      setBalance(walletData?.balance ?? 0)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { loadData() }, [loadData])

  if (loading) return <div className="loading-text">Loading shop...</div>
  if (error) return <div className="error-msg">{error}</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ color: '#334155', margin: 0 }}>Available Items</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Sort by points:</span>
          <button
            className={`btn btn-sm ${sortOrder === 'asc' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setSortOrder(v => v === 'asc' ? '' : 'asc')}
          >↑ Low → High</button>
          <button
            className={`btn btn-sm ${sortOrder === 'desc' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setSortOrder(v => v === 'desc' ? '' : 'desc')}
          >↓ High → Low</button>
        </div>
        <span className="balance-chip">Balance: {balance} pts</span>
      </div>

      {items.length === 0 ? (
        <div className="empty-text">The shop is empty. Check back later!</div>
      ) : (
        <div className="shop-grid">
          {[...items]
            .sort((a, b) => sortOrder === 'asc' ? a.cost - b.cost : sortOrder === 'desc' ? b.cost - a.cost : 0)
            .map(item => (
              <KidShopItem
                key={item.id}
                item={item}
                balance={balance}
                onRefresh={loadData}
              />
            ))}
        </div>
      )}
    </div>
  )
}

// ─── Kid Dashboard Shell ─────────────────────────────────────────────────────

export default function KidDashboard() {
  const { user, logout } = useAuth()
  const [tab, setTab] = useState('chores')

  return (
    <div className="app-container">
      <nav className="navbar kid">
        <div className="navbar-brand">🛒 ParentShopee</div>
        <div className="navbar-user">
          {user.avatar && (
            <span className="kid-avatar lg">{user.avatar}</span>
          )}
          <span>Hi, {user.name}!</span>
          <button className="logout-btn" onClick={logout}>Sign Out</button>
        </div>
      </nav>

      <div className="main-content">
        <div className="tabs">
          {['chores', 'shop', 'wallet'].map(t => (
            <button
              key={t}
              className={`tab-btn${tab === t ? ' active kid' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'chores' ? 'Chores' : t === 'shop' ? 'Shop' : 'Wallet'}
            </button>
          ))}
          <HamburgerMenu tab={tab} setTab={setTab} role="kid" />
        </div>

        {tab === 'chores'   && <KidChoresTab userId={user.id} />}
        {tab === 'shop'     && <KidShopTab userId={user.id} />}
        {tab === 'wallet'   && <KidWalletView kidId={user.id} />}
        {tab === 'messages' && <MessagesTab />}
        {tab === 'help'     && <HelpTab role="kid" />}
        {tab === 'settings' && <SettingsPanel />}
      </div>
    </div>
  )
}
