import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api.js'
import { KidChoreCard } from './ChoreCard.jsx'
import { KidShopItem } from './ShopItem.jsx'
import { KidWalletView } from './WalletView.jsx'
import MessagesTab from './Messages.jsx'
import { HelpTab } from './Help.jsx'
import SettingsPanel from './Settings.jsx'
import ContactUs from './ContactUs.jsx'
import AppNavbar from './AppNavbar.jsx'
import BottomNav from './BottomNav.jsx'
import LearnGrowTab from '../learn/LearnGrowTab.jsx'

// ─── Daily chore row (highlighted within the merged Chores list) ────────────

function DailyChoreRow({ item, busy, onToggle }) {
  const isPending = item.status === 'pending'
  const isComplete = item.status === 'complete'
  return (
    <div className="kid-row">
      <span className="kid-row-icon">{item.imageEmoji}</span>
      <span className="kid-row-body">
        <span className={`kid-row-title${isComplete ? ' done' : ''}`}>{item.title}</span>
        <span className="kid-row-points">⭐ +{item.points} points · 📅 Daily</span>
      </span>
      <span className="kid-row-action">
        {isComplete ? (
          <span className="kid-check-circle">✓</span>
        ) : isPending ? (
          <span className="kid-pill-pending">⏳ Pending</span>
        ) : (
          <button className="kid-pill-btn" onClick={onToggle} disabled={busy}>
            {busy ? '...' : 'Done'}
          </button>
        )}
      </span>
    </div>
  )
}

// ─── Shared chore data (used by both the Home widget and the Chores tab) ───
// One fetch + one set of status filters, so the "what's due today" badge
// count, the home-screen preview list, and the Chores tab's Today list can
// never drift out of sync with each other.

function useKidChores(userId) {
  const [chores, setChores] = useState([])
  const [dailyItems, setDailyItems] = useState([])
  const [dailyDeductionEnabled, setDailyDeductionEnabled] = useState(false)
  const [dailyBusyId, setDailyBusyId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [choresData, dailyData] = await Promise.all([api.getChores(), api.getDailyChores()])
      setChores(Array.isArray(choresData) ? choresData : [])
      setDailyItems(Array.isArray(dailyData?.items) ? dailyData.items : [])
      setDailyDeductionEnabled(!!dailyData?.deductionEnabled)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  async function toggleDaily(item, onBalanceChange) {
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

  const available = chores.filter(c => c.status === 'open' && (!c.assignedKidId || c.assignedKidId === userId))
  const myPending = chores.filter(c => c.status === 'pending' && (c.completedByKidId === userId || c.assignedKidId === userId))
  const myCompleted = chores.filter(c => c.status === 'complete' && (c.completedByKidId === userId || c.assignedKidId === userId))
  const myExpired = chores.filter(c => c.status === 'expired' && (!c.assignedKidId || c.assignedKidId === userId))
  const dailyAvailable = dailyItems.filter(i => i.status === 'open')
  const dailyPending = dailyItems.filter(i => i.status === 'pending')
  const dailyComplete = dailyItems.filter(i => i.status === 'complete')
  const dailyAtRiskPoints = dailyAvailable.reduce((sum, i) => sum + i.points, 0)

  // Today: everything the kid can act on right now, pending-approval items
  // first so they're not missed, same ordering the old merged list used.
  const todayItems = [
    ...dailyPending.map(item => ({ kind: 'daily', item })),
    ...myPending.map(chore => ({ kind: 'chore', chore })),
    ...dailyAvailable.map(item => ({ kind: 'daily', item })),
    ...available.map(chore => ({ kind: 'chore', chore })),
  ]
  // For the home screen's preview widget only -- shows today's already-done
  // daily chores too (with a checkmark), not just what's left to do.
  const todayItemsWithDone = [...dailyComplete.map(item => ({ kind: 'daily', item })), ...todayItems]
  const totalPendingCount = myPending.length + dailyPending.length

  return {
    loading, error, reload,
    dailyDeductionEnabled, dailyAtRiskPoints, dailyBusyId, toggleDaily,
    todayItems, todayItemsWithDone, totalCount: todayItems.length, totalPendingCount,
    dailyTotal: dailyItems.length, dailyDoneCount: dailyComplete.length,
    myCompleted, myExpired,
  }
}

function TodayChoreRow({ entry, onRefresh, dailyBusyId, onToggleDaily }) {
  return entry.kind === 'daily'
    ? <DailyChoreRow item={entry.item} busy={dailyBusyId === entry.item.id} onToggle={() => onToggleDaily(entry.item)} />
    : <KidChoreCard chore={entry.chore} onRefresh={onRefresh} variant="row" />
}

// ─── Chores Tab ─────────────────────────────────────────────────────────────

function KidChoresTab({ userId, onBalanceChange }) {
  const {
    loading, error, reload,
    dailyDeductionEnabled, dailyAtRiskPoints, dailyBusyId, toggleDaily,
    todayItems, totalCount, totalPendingCount,
    myCompleted, myExpired,
  } = useKidChores(userId)
  const [view, setView] = useState('today') // 'today' | 'history'

  if (loading) return <div className="loading-text">Loading chores...</div>
  if (error) return <div className="error-msg">{error}</div>

  const historyCount = myCompleted.length + myExpired.length

  return (
    <div className="kid-chores-content">
      <div className="segmented-control">
        <button className={view === 'today' ? 'active' : ''} onClick={() => setView('today')}>
          ✨ Today{totalCount > 0 ? ` (${totalCount})` : ''}
        </button>
        <button className={view === 'history' ? 'active' : ''} onClick={() => setView('history')}>
          🗂️ History{historyCount > 0 ? ` (${historyCount})` : ''}
        </button>
      </div>

      {view === 'today' ? (
        <div>
          {totalPendingCount > 0 && (
            <div className="info-banner pending">
              ⏳ {totalPendingCount} chore{totalPendingCount > 1 ? 's' : ''} waiting for a guardian to approve.
            </div>
          )}
          {dailyDeductionEnabled && dailyAtRiskPoints > 0 && (
            <div className="info-banner warn">
              ⚠️ Don't forget your Daily Chores — anything left unchecked by the end of the day loses its points ({dailyAtRiskPoints} pts at risk right now).
            </div>
          )}
          {todayItems.length === 0 ? (
            <div className="empty-state-card">🎉 All done for today! Check back tomorrow for new chores.</div>
          ) : (
            <div className="kid-flat-card">
              <div className="kid-row-list">
                {todayItems.map(entry => (
                  <TodayChoreRow
                    key={entry.kind === 'daily' ? `daily-${entry.item.id}` : entry.chore.id}
                    entry={entry} onRefresh={reload} dailyBusyId={dailyBusyId}
                    onToggleDaily={item => toggleDaily(item, onBalanceChange)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        historyCount === 0 ? (
          <div className="empty-state-card">Nothing here yet — completed and expired chores will show up here.</div>
        ) : (
          <div className="kid-flat-card">
            {myCompleted.length > 0 && (
              <>
                <div className="list-subheader">🏆 Completed ({myCompleted.length})</div>
                <div className="kid-row-list">
                  {myCompleted.map(chore => <KidChoreCard key={chore.id} chore={chore} onRefresh={reload} variant="row" />)}
                </div>
              </>
            )}
            {myExpired.length > 0 && (
              <>
                <div className="list-subheader">⌛ Expired ({myExpired.length})</div>
                <div className="kid-row-list">
                  {myExpired.map(chore => <KidChoreCard key={chore.id} chore={chore} onRefresh={reload} variant="row" />)}
                </div>
              </>
            )}
          </div>
        )
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

// ─── Home screen ──────────────────────────────────────────────────────────────

// One stat in the available/saved/lifetime points breakdown -- shared markup
// between the compact home card and the bigger hero on the Wallet tab.
// Future-Ready modules come back ordered by the catalog's order_index, so the
// first one without a completion is exactly "pick up where you left off".
function nextIncompleteModule(modules) {
  return modules.find(m => !m.completed) ?? null
}

function ContinueLearningCard({ onOpenModule }) {
  const [modules, setModules] = useState(null)
  useEffect(() => {
    let cancelled = false
    api.getFutureReadyModules()
      .then(data => { if (!cancelled) setModules(Array.isArray(data) ? data : []) })
      .catch(() => { if (!cancelled) setModules([]) })
    return () => { cancelled = true }
  }, [])

  if (modules === null) return null

  if (modules.length === 0) return null

  const next = nextIncompleteModule(modules)

  if (!next) {
    return (
      <div className="kid-flat-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>🎓</div>
        <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.95rem' }}>You've finished every Future-Ready lesson!</div>
        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 3 }}>Check back for new ones soon.</div>
      </div>
    )
  }

  return (
    <button className="kid-explore-card" onClick={() => onOpenModule(next.id)}>
      <span className="kid-explore-icon">{next.topicEmoji || '🚀'}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="kid-explore-title">
          {modules.some(m => m.completed) ? 'Continue Learning' : 'Explore Future-Ready Skills'}
        </div>
        <div className="kid-explore-sub">{next.topicTitle} · {next.title} · earn {next.points} pts</div>
      </div>
      <span className="kid-explore-chevron">›</span>
    </button>
  )
}

function ExploreQuestsCard({ onOpenQuests }) {
  return (
    <button className="kid-explore-card" onClick={onOpenQuests} style={{ marginTop: 12 }}>
      <span className="kid-explore-icon">🧸</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="kid-explore-title">Explore Quests</div>
        <div className="kid-explore-sub">Hands-on things to try together</div>
      </div>
      <span className="kid-explore-chevron">›</span>
    </button>
  )
}

function KidHomeScreen({ name, userId, wallet, onNavigate, onOpenModule, onOpenQuests, onBalanceChange }) {
  const [message] = useState(
    () => MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)]
  )
  const greeting = getGreeting()
  const bal = wallet?.balance ?? 0
  const saved = wallet?.savingsBalance ?? 0
  const goalName = wallet?.goalName
  const goalTarget = wallet?.goalTarget
  const goalPct = goalTarget ? Math.min(100, Math.round((saved / goalTarget) * 100)) : 0

  const {
    loading, todayItemsWithDone, totalCount, dailyTotal, dailyDoneCount, dailyBusyId, toggleDaily, reload,
  } = useKidChores(userId)
  const [showAllChores, setShowAllChores] = useState(false)
  const visibleItems = showAllChores ? todayItemsWithDone : todayItemsWithDone.slice(0, 4)
  const hasMoreChores = todayItemsWithDone.length > 4
  // "Today's Chores" tracks the kid's daily routine (the only chores with a
  // real done-today/not-done-yet state) -- regular one-off chores don't
  // reset daily so they don't have a clean "X of Y today" number.
  const hasDailyChores = dailyTotal > 0
  const dailyRemaining = Math.max(0, dailyTotal - dailyDoneCount)

  return (
    <div className="kid-home-grid">
      <div>
        <div className="kid-hero-card">
          <div className="kid-hero-title">Hi, {name}! <span>{greeting.icon}</span></div>
          <div className="kid-hero-sub">{message}</div>
        </div>

        <div className="kid-stat-row">
          <div className="kid-stat-card">
            <div className="kid-stat-label">Today's Chores</div>
            {hasDailyChores ? (
              <>
                <div className="kid-stat-value">{dailyDoneCount}/{dailyTotal}</div>
                <div className="kid-stat-bar-track"><div className="kid-stat-bar-fill" style={{ width: `${Math.round((dailyDoneCount / dailyTotal) * 100)}%` }} /></div>
                <div className="kid-stat-caption">{dailyRemaining > 0 ? `${dailyRemaining} more to go!` : 'All done for today! 🎉'}</div>
              </>
            ) : (
              <>
                <div className="kid-stat-value">{totalCount}</div>
                <div className="kid-stat-caption">{totalCount > 0 ? 'chores to do' : 'All clear! 🎉'}</div>
              </>
            )}
          </div>
          <div className="kid-stat-card">
            <div className="kid-stat-label">My Points</div>
            <div className="kid-stat-value points">⭐ {bal}</div>
            <div className="kid-stat-caption good">Keep earning!</div>
          </div>
        </div>

        <div className="kid-flat-card">
          <div className="kid-section-header">
            <span className="kid-section-title">My Chores</span>
            <button className="home-today-header-btn" onClick={() => onNavigate('chores')}>Today →</button>
          </div>
          {loading ? (
            <div className="loading-text">Loading...</div>
          ) : visibleItems.length === 0 ? (
            <div className="empty-text">🎉 All done for today!</div>
          ) : (
            <>
              <div className="kid-row-list">
                {visibleItems.map(entry => (
                  <TodayChoreRow
                    key={entry.kind === 'daily' ? `daily-${entry.item.id}` : entry.chore.id}
                    entry={entry} onRefresh={reload} dailyBusyId={dailyBusyId}
                    onToggleDaily={item => toggleDaily(item, onBalanceChange)}
                  />
                ))}
              </div>
              {hasMoreChores && (
                <button className="kid-expand-btn" onClick={() => setShowAllChores(v => !v)}>
                  {showAllChores ? 'Show less ▲' : `View all ${todayItemsWithDone.length} chores ▼`}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div>
        <div className="kid-flat-card">
          <div className="kid-goal-header">
            <span className="kid-section-title">🎁 My Reward Goal</span>
            {goalName && goalTarget && <span className="kid-section-tag">{goalPct}% saved</span>}
          </div>
          {goalName && goalTarget ? (
            <>
              <div className="kid-goal-row">
                <span className="kid-goal-icon">🎯</span>
                <div>
                  <div className="kid-goal-name">{goalName}</div>
                  <div className="kid-goal-amounts">{saved} / {goalTarget} points</div>
                </div>
              </div>
              <div className="kid-goal-bar-track"><div className="kid-goal-bar-fill" style={{ width: `${goalPct}%` }} /></div>
            </>
          ) : (
            <button className="kid-goal-empty-btn" onClick={() => onNavigate('wallet')}>🎯 Set a savings goal →</button>
          )}
        </div>

        <ContinueLearningCard onOpenModule={onOpenModule} />
        <ExploreQuestsCard onOpenQuests={onOpenQuests} />
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
  const learnSection = searchParams.get('section') || null
  const startModuleId = searchParams.get('module')
  const setTab = useCallback(next => {
    setSearchParams(next === 'home' ? {} : { tab: next })
  }, [setSearchParams])
  const setLearnSection = useCallback(next => {
    // next is null when going "back" to the picker -- must be omitted
    // entirely rather than passed through, since URLSearchParams would
    // otherwise stringify it to the literal text "null".
    setSearchParams(next ? { tab: 'learn', section: next } : { tab: 'learn' })
  }, [setSearchParams])
  // "Continue Learning" on the home screen always deep-links into
  // Future-Ready specifically -- Quests has no equivalent shortcut yet.
  const openModule = useCallback(moduleId => {
    setSearchParams({ tab: 'learn', section: 'futureready', module: moduleId })
  }, [setSearchParams])
  const clearStartModule = useCallback(() => {
    setSearchParams({ tab: 'learn', section: 'futureready' })
  }, [setSearchParams])
  useEffect(() => { window.scrollTo(0, 0) }, [tab])
  const [wallet, setWallet] = useState(null)

  useEffect(() => {
    api.getWallet(user.id)
      .then(data => setWallet(data))
      .catch(() => {})
  }, [user.id, tab])

  function refreshWallet() {
    api.getWallet(user.id)
      .then(data => setWallet(data))
      .catch(() => {})
  }

  return (
    <div className="app-container kid-theme">
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
        {wallet !== null && (
          <span style={{ background: '#ecfdf5', border: '1.5px solid #6ee7b7', borderRadius: 20, padding: '4px 12px', fontSize: '0.82rem', fontWeight: 700, color: '#059669' }}>
            ⭐ {wallet.balance} pts
          </span>
        )}
      </AppNavbar>

      <div className="main-content">
        {tab === 'home'     && <KidHomeScreen name={user.name} userId={user.id} wallet={wallet} onNavigate={setTab} onOpenModule={openModule} onOpenQuests={() => setLearnSection('quests')} onBalanceChange={refreshWallet} />}
        {tab === 'chores'   && <KidChoresTab userId={user.id} onBalanceChange={refreshWallet} />}
        {tab === 'shop'     && <KidShopTab userId={user.id} />}
        {tab === 'learn' && <LearnGrowTab section={learnSection} onSectionChange={setLearnSection} onBalanceChange={refreshWallet} startModuleId={startModuleId} onConsumeStart={clearStartModule} />}
        {tab === 'wallet'   && <KidWalletView kidId={user.id} onBalanceChange={refreshWallet} />}
        {tab === 'messages' && <MessagesTab />}
        {tab === 'help'     && <HelpTab role="kid" />}
        {tab === 'contact'  && <ContactUs />}
        {tab === 'settings' && <SettingsPanel />}
      </div>
      <BottomNav
        variant="kid"
        active={tab}
        onChange={setTab}
        items={[
          { key: 'home', icon: '🏠', label: 'Home' },
          { key: 'chores', icon: '✅', label: 'Chores' },
          { key: 'wallet', icon: '👛', label: 'Wallet' },
          { key: 'shop', icon: '🎁', label: 'Rewards' },
          { key: 'learn', icon: '🚀', label: 'Skills' },
        ]}
      />
    </div>
  )
}
