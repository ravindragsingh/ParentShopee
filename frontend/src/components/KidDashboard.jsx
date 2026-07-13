import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api.js'
import { KidChoreCard } from './ChoreCard.jsx'
import { DailyChoresCard } from './DailyChoresCard.jsx'
import { KidShopItem } from './ShopItem.jsx'
import { KidWalletView } from './WalletView.jsx'
import MessagesTab from './Messages.jsx'
import { HelpTab } from './Help.jsx'
import SettingsPanel from './Settings.jsx'
import ContactUs from './ContactUs.jsx'
import AppNavbar from './AppNavbar.jsx'

// ─── Collapsible section header ──────────────────────────────────────────────

function CollapsibleSection({ icon, title, count, colorClass, defaultOpen = false, emptyText, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <div style={{ marginTop: 8 }}>
      <div
        role="button"
        tabIndex={0}
        className={`section-header ${colorClass}`}
        onClick={() => setIsOpen(v => !v)}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setIsOpen(v => !v)}
        style={{ display: 'flex', width: '100%', cursor: 'pointer', userSelect: 'none', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' }}
      >
        <span>{icon} {title}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: 'rgba(0,0,0,0.12)', borderRadius: 10, padding: '1px 8px', fontSize: '0.8rem', fontWeight: 700 }}>
            {count}
          </span>
          <span style={{ fontSize: '0.75rem', opacity: 0.65 }}>{isOpen ? '▲' : '▼'}</span>
        </span>
      </div>
      {isOpen && (
        count === 0
          ? <div className="empty-text">{emptyText}</div>
          : <div className="chore-grid">{children}</div>
      )}
    </div>
  )
}

// ─── Chores Tab ─────────────────────────────────────────────────────────────

function KidChoresTab({ userId, onBalanceChange }) {
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
      <DailyChoresCard kid={{ id: userId }} isParent={false} onWalletChange={onBalanceChange} />

      <CollapsibleSection icon="✨" title="Available" count={available.length} colorClass="open" defaultOpen emptyText="No available chores right now.">
        {available.map(chore => <KidChoreCard key={chore.id} chore={chore} onRefresh={loadChores} />)}
      </CollapsibleSection>

      <CollapsibleSection icon="⏳" title="My Pending" count={myPending.length} colorClass="pending" defaultOpen emptyText="No chores awaiting approval.">
        {myPending.map(chore => <KidChoreCard key={chore.id} chore={chore} onRefresh={loadChores} />)}
      </CollapsibleSection>

      <CollapsibleSection icon="🏆" title="My Completed" count={myCompleted.length} colorClass="complete" emptyText="No approved chores yet. Keep it up!">
        {myCompleted.map(chore => <KidChoreCard key={chore.id} chore={chore} onRefresh={loadChores} />)}
      </CollapsibleSection>

      <CollapsibleSection icon="⌛" title="Expired" count={myExpired.length} colorClass="expired" emptyText="No expired chores.">
        {myExpired.map(chore => <KidChoreCard key={chore.id} chore={chore} onRefresh={loadChores} />)}
      </CollapsibleSection>
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

// ─── Motivational banner ─────────────────────────────────────────────────────

const MOTIVATIONAL_MESSAGES = [
  "Every chore you finish gets you one step closer to your reward! 🎯",
  "You're on fire — keep knocking out those chores! 🔥",
  "Champions do their chores without being asked! 💪",
  "Points are waiting for you — go grab them! ⭐",
  "Small tasks today, big rewards tomorrow! 🌟",
  "You've got this! Chores don't stand a chance! 🦸",
  "The more you do, the more you earn — let's go! 🚀",
  "Every point counts. Make today your best day! 💰",
  "Heroes help at home. Be today's hero! 🦸‍♀️",
  "A tidy home makes a happy family — and more points for you! 🏠",
  "Superstar alert — your chores are calling! ⭐",
  "Finish your chores and watch your points soar! 📈",
  "You're stronger than any chore list! 💪",
  "Every chore you finish is a victory. Go win! 🏆",
  "The fastest way to your reward? Start right now! ⚡",
  "Your future self will thank you for doing chores today! 🙌",
  "Dream big, earn big — start with your chores! 🌈",
  "You have the power to make today amazing! ✨",
  "Nothing feels better than a finished chore list! 🎉",
  "Level up your points — tackle your chores like a pro! 🎮",
  "Be the helper your family didn't know they needed! 💚",
  "One chore at a time — you'll get there! 🐢",
  "Your points are patiently waiting for you to collect them! 🏦",
  "Show your chores who's boss today! 👊",
  "Great things happen when you put in the work! 🌟",
  "Turn chores into points and points into prizes! 🎁",
  "You're building great habits — one chore at a time! 🧱",
  "Today is a perfect day to earn more points! ☀️",
  "Every sweep and tidy-up brings you closer to your goal! 🎯",
  "Your family is cheering for you — go get those points! 📣",
]

function getGreeting() {
  const h = new Date().getHours()
  if (h >= 5  && h < 12) return { text: 'Good Morning',   icon: '🌅' }
  if (h >= 12 && h < 17) return { text: 'Good Afternoon', icon: '☀️'  }
  if (h >= 17 && h < 21) return { text: 'Good Evening',   icon: '🌇' }
  return                         { text: 'Good Night',     icon: '🌙' }
}

function MotivationalBanner({ name }) {
  const [message] = useState(
    () => MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)]
  )
  const greeting = getGreeting()

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
      border: '1.5px solid #bbf7d0',
      borderRadius: 14,
      padding: '14px 18px',
      marginBottom: 16,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 14,
    }}>
      <span style={{ fontSize: '2rem', lineHeight: 1, flexShrink: 0 }}>{greeting.icon}</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#065f46', marginBottom: 3 }}>
          {greeting.text}, {name}!
        </div>
        <div style={{ fontSize: '0.875rem', color: '#047857', lineHeight: 1.5 }}>
          {message}
        </div>
      </div>
    </div>
  )
}

// ─── Kid Dashboard Shell ─────────────────────────────────────────────────────

export default function KidDashboard() {
  const { user, logout } = useAuth()
  const [tab, setTab] = useState('chores')
  const [balance, setBalance] = useState(null)

  useEffect(() => {
    api.getWallet(user.id)
      .then(data => setBalance(data?.balance ?? 0))
      .catch(() => {})
  }, [user.id, tab])

  function refreshBalance() {
    api.getWallet(user.id)
      .then(data => setBalance(data?.balance ?? 0))
      .catch(() => {})
  }

  return (
    <div className="app-container">
      <AppNavbar
        variant="kid"
        userName={user.name}
        avatar={user.avatar}
        onLogout={logout}
        tab={tab}
        setTab={setTab}
        role="kid"
      >
        {balance !== null && (
          <span style={{ background: '#ecfdf5', border: '1.5px solid #6ee7b7', borderRadius: 20, padding: '4px 12px', fontSize: '0.82rem', fontWeight: 700, color: '#059669' }}>
            ⭐ {balance} pts
          </span>
        )}
      </AppNavbar>

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
        </div>

        <MotivationalBanner name={user.name} />

        {tab === 'chores'   && <KidChoresTab userId={user.id} onBalanceChange={refreshBalance} />}
        {tab === 'shop'     && <KidShopTab userId={user.id} />}
        {tab === 'wallet'   && <KidWalletView kidId={user.id} />}
        {tab === 'messages' && <MessagesTab />}
        {tab === 'help'     && <HelpTab role="kid" />}
        {tab === 'contact'  && <ContactUs />}
        {tab === 'settings' && <SettingsPanel />}
      </div>
    </div>
  )
}
