import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api.js'
import { KidChoreCard } from './ChoreCard.jsx'
import { KidShopItem } from './ShopItem.jsx'
import { KidWalletView } from './WalletView.jsx'
import GamesTab from '../games/GamesTab.jsx'
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

// ─── Daily chore row (highlighted within the merged Chores list) ────────────

function DailyChoreRow({ item, busy, onToggle }) {
  const isPending = item.status === 'pending'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fffbeb', border: `1px solid ${isPending ? '#fed7aa' : '#fde68a'}`, borderRadius: 10, padding: '10px 14px' }}>
      {isPending ? (
        <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>⏳</span>
      ) : (
        <input
          type="checkbox"
          checked={item.status === 'complete'}
          disabled={busy}
          onChange={onToggle}
          style={{ width: 20, height: 20, accentColor: '#d97706', cursor: busy ? 'default' : 'pointer', flexShrink: 0 }}
        />
      )}
      <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{item.imageEmoji}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontWeight: 600, color: '#1e293b' }}>{item.title}</span>
        {isPending && <span style={{ display: 'block', fontSize: '0.72rem', color: '#c2410c', fontWeight: 700 }}>⏳ Waiting for approval</span>}
      </span>
      <span style={{ fontSize: '0.72rem', background: '#fde68a', color: '#92400e', borderRadius: 6, padding: '1px 7px', fontWeight: 700, flexShrink: 0 }}>📅 Daily</span>
      <span className="points-badge">{item.points} pts</span>
    </div>
  )
}

// ─── Chores Tab ─────────────────────────────────────────────────────────────

function KidChoresTab({ userId, onBalanceChange }) {
  const [chores, setChores] = useState([])
  const [dailyItems, setDailyItems] = useState([])
  const [dailyBusyId, setDailyBusyId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [choresExpanded, setChoresExpanded] = useState(false)

  const loadChores = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [choresData, dailyData] = await Promise.all([api.getChores(), api.getDailyChores()])
      setChores(Array.isArray(choresData) ? choresData : [])
      setDailyItems(Array.isArray(dailyData?.items) ? dailyData.items : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadChores() }, [loadChores])

  async function handleDailyToggle(item) {
    setDailyBusyId(item.id)
    try {
      const res = await api.toggleDailyChore(item.id)
      setDailyItems(items => items.map(i => i.id === item.id ? res.item : i))
      if (res.newBalance !== undefined) onBalanceChange && onBalanceChange(res.newBalance)
    } catch (err) {
      alert(err.message)
    } finally {
      setDailyBusyId(null)
    }
  }

  // Available: open chores assigned to me or to nobody
  const available = chores.filter(c =>
    c.status === 'open' &&
    (!c.assignedKidId || c.assignedKidId === userId)
  )

  // My pending: chores I marked complete, awaiting guardian approval
  const myPending = chores.filter(c =>
    c.status === 'pending' &&
    (c.completedByKidId === userId || c.assignedKidId === userId)
  )

  // My completed: chores I completed and guardian approved
  const myCompleted = chores.filter(c =>
    c.status === 'complete' &&
    (c.completedByKidId === userId || c.assignedKidId === userId)
  )

  // Expired: chores assigned to me (or any kid) that expired
  const myExpired = chores.filter(c =>
    c.status === 'expired' &&
    (!c.assignedKidId || c.assignedKidId === userId)
  )

  // Daily chore items — merged into the same list, just visually highlighted
  const dailyAvailable = dailyItems.filter(i => i.status === 'open')
  const dailyPending = dailyItems.filter(i => i.status === 'pending')

  const totalCount = available.length + myPending.length + dailyAvailable.length + dailyPending.length
  const totalPendingCount = myPending.length + dailyPending.length

  if (loading) return <div className="loading-text">Loading chores...</div>
  if (error) return <div className="error-msg">{error}</div>

  return (
    <div>
      <div className="form-card" style={{ border: '1.5px solid #99f6e4', background: 'linear-gradient(135deg, #f0fdfa, #ffffff)' }}>
        <div
          role="button" tabIndex={0}
          onClick={() => setChoresExpanded(v => !v)}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setChoresExpanded(v => !v)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
        >
          <span className="form-title" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            ✨ Chores
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0d9488', background: '#ccfbf1', borderRadius: 999, padding: '2px 10px' }}>
              {totalCount} total
            </span>
            {totalPendingCount > 0 && (
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#c2410c', background: '#fed7aa', borderRadius: 999, padding: '2px 10px' }}>
                ⏳ {totalPendingCount} awaiting approval
              </span>
            )}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{choresExpanded ? '▲' : '▼'}</span>
        </div>
        {choresExpanded && (
          totalCount === 0 ? (
            <div className="empty-text" style={{ marginTop: 14 }}>No available chores right now.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
              {dailyPending.map(item => (
                <DailyChoreRow key={`daily-${item.id}`} item={item} busy={dailyBusyId === item.id} onToggle={() => handleDailyToggle(item)} />
              ))}
              {myPending.map(chore => (
                <KidChoreCard key={chore.id} chore={chore} onRefresh={loadChores} variant="row" />
              ))}
              {dailyAvailable.map(item => (
                <DailyChoreRow key={`daily-${item.id}`} item={item} busy={dailyBusyId === item.id} onToggle={() => handleDailyToggle(item)} />
              ))}
              {available.map(chore => (
                <KidChoreCard key={chore.id} chore={chore} onRefresh={loadChores} variant="row" />
              ))}
            </div>
          )
        )}
      </div>

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

function KidShopTab({ userId, onBalanceChange }) {
  const [items, setItems] = useState([])
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortOrder, setSortOrder] = useState('')  // '' | 'asc' | 'desc'
  const [pendingItemIds, setPendingItemIds] = useState(new Set())

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [shopData, walletData, purchasesData] = await Promise.all([
        api.getShopItems(),
        api.getWallet(userId),
        api.getShopPurchases(),
      ])
      setItems(Array.isArray(shopData) ? shopData : [])
      setBalance(walletData?.balance ?? 0)
      const pending = (Array.isArray(purchasesData) ? purchasesData : []).filter(p => p.status === 'pending')
      setPendingItemIds(new Set(pending.map(p => p.shopItemId)))
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

      {pendingItemIds.size > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', marginBottom: 14, color: '#92400e', fontSize: '0.85rem' }}>
          ⏳ You have {pendingItemIds.size} purchase{pendingItemIds.size > 1 ? 's' : ''} waiting for a guardian to approve.
        </div>
      )}

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
                isPending={pendingItemIds.has(item.id)}
                onRefresh={() => { loadData(); onBalanceChange && onBalanceChange() }}
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

// ─── Home screen ──────────────────────────────────────────────────────────────

// Always-increasing round-number goals so the progress bar has something to
// aim for even though the app has no explicit savings-goal feature.
const POINT_MILESTONES = [10, 25, 50, 100, 200, 500, 1000, 2000, 5000, 10000]

function nextMilestone(balance) {
  return POINT_MILESTONES.find(m => m > balance) ?? (Math.ceil((balance + 100) / 100) * 100)
}

function HomeNavRow({ icon, iconBg, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, width: '100%',
        background: '#fff', border: '1px solid #f1f5f9', borderRadius: 14,
        padding: '14px 16px', cursor: 'pointer', textAlign: 'left',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      <span style={{ width: 42, height: 42, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.35rem', flexShrink: 0 }}>
        {icon}
      </span>
      <span style={{ flex: 1, fontWeight: 700, color: '#1e293b', fontSize: '0.98rem' }}>{label}</span>
      <span style={{ color: '#cbd5e1', fontSize: '1.3rem', lineHeight: 1 }}>›</span>
    </button>
  )
}

function KidHomeScreen({ name, balance, onNavigate }) {
  const [message] = useState(
    () => MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)]
  )
  const greeting = getGreeting()
  const bal = balance ?? 0
  const goal = nextMilestone(bal)
  const progressPct = Math.min(100, Math.round((bal / goal) * 100))

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
          Hi {name}! <span style={{ fontSize: '1.25rem' }}>{greeting.icon}</span>
        </div>
        <div style={{ fontSize: '0.92rem', color: '#64748b', marginTop: 3 }}>{message}</div>
      </div>

      <div style={{
        background: '#fff', borderRadius: 20, padding: '26px 22px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)', textAlign: 'center', marginBottom: 22,
        border: '1px solid #f1f5f9',
      }}>
        <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.02em', marginBottom: 6 }}>YOUR POINTS</div>
        <div style={{ fontSize: '2.8rem', fontWeight: 800, color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, lineHeight: 1 }}>
          {bal} <span style={{ fontSize: '1.9rem' }}>⭐</span>
        </div>
        <div style={{ height: 9, background: '#f1f5f9', borderRadius: 999, marginTop: 18, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg,#10b981,#059669)', borderRadius: 999, transition: 'width 0.4s ease' }} />
        </div>
        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 9 }}>
          Keep it up! {Math.max(0, goal - bal)} pts to {goal}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <HomeNavRow icon="📋" iconBg="#dbeafe" label="My Tasks" onClick={() => onNavigate('chores')} />
        <HomeNavRow icon="🎁" iconBg="#fef3c7" label="My Rewards" onClick={() => onNavigate('shop')} />
        <HomeNavRow icon="🎮" iconBg="#ede9fe" label="Games" onClick={() => onNavigate('games')} />
        <HomeNavRow icon="👛" iconBg="#fce7f3" label="My Wallet" onClick={() => onNavigate('wallet')} />
      </div>
    </div>
  )
}

// ─── Kid Dashboard Shell ─────────────────────────────────────────────────────

export default function KidDashboard() {
  const { user, logout, switchProfile } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'home'
  const setTab = useCallback(next => {
    setSearchParams(next === 'home' ? {} : { tab: next })
  }, [setSearchParams])
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
        onSwitchProfile={() => { switchProfile(); navigate('/profiles') }}
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
        {tab !== 'home' && (
          <div className="tabs">
            {['home', 'chores', 'shop', 'games', 'wallet'].map(t => (
              <button
                key={t}
                className={`tab-btn${tab === t ? ' active kid' : ''}`}
                onClick={() => setTab(t)}
              >
                {t === 'home' ? '🏠 Home' : t === 'chores' ? 'Chores' : t === 'shop' ? 'Shop' : t === 'games' ? 'Games' : 'Wallet'}
              </button>
            ))}
          </div>
        )}

        {tab === 'home'     && <KidHomeScreen name={user.name} balance={balance} onNavigate={setTab} />}
        {tab === 'chores'   && <KidChoresTab userId={user.id} onBalanceChange={refreshBalance} />}
        {tab === 'shop'     && <KidShopTab userId={user.id} onBalanceChange={refreshBalance} />}
        {tab === 'games'    && <GamesTab userId={user.id} onBalanceChange={refreshBalance} />}
        {tab === 'wallet'   && <KidWalletView kidId={user.id} onBalanceChange={refreshBalance} />}
        {tab === 'messages' && <MessagesTab />}
        {tab === 'help'     && <HelpTab role="kid" />}
        {tab === 'contact'  && <ContactUs />}
        {tab === 'settings' && <SettingsPanel />}
      </div>
    </div>
  )
}
