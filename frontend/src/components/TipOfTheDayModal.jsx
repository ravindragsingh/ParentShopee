import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const GUARDIAN_TIPS = [
  "Set up recurring chores (daily, weekly, or monthly) once and they'll auto-generate from then on — no need to re-add the same chore every day.",
  "Turn on Shop Approval (Admin Panel) so a kid's reward purchase needs your OK before their points are spent.",
  "Award Bonus Points for good behavior that isn't tied to a specific chore — it's a quick way to encourage extra effort.",
  "Add a co-guardian from the Admin Panel so both parents can manage chores and approvals from their own login.",
  "Check each kid's report (Kids tab) to see their earning and spending trends over time, not just their current balance.",
  "A rejected chore goes back to Open so the kid can redo it — deleting a chore removes it for good, so reject instead if it just needs another try.",
  "Message your kids directly from the Messages tab to remind them about a chore or celebrate a win.",
  "Pick a distinct emoji for each chore and shop item — kids recognize icons faster than reading titles.",
]

const KID_TIPS = [
  "Finish chores before their due date — check the due date badge on each chore card so you don't miss out.",
  "Save up points for a bigger reward instead of spending right away — check the Shop tab to see what's worth waiting for.",
  "Your guardian has to approve a chore before you get your points, so mark it complete as soon as you finish it.",
  "Check your Wallet tab to see your full points history — everything you've earned and every reward you've bought.",
  "Message your guardian if you have a question about a chore — no need to wait until you see them in person.",
  "Daily chores reset every day, so make checking them first thing part of your routine.",
]

function pickRandomTip(role) {
  const pool = role === 'kid' ? KID_TIPS : GUARDIAN_TIPS
  return pool[Math.floor(Math.random() * pool.length)]
}

const disabledKey = userId => `tipsDisabled_${userId}`

// Shared with Settings.jsx / GuardianDashboard's Admin Panel, which expose the
// "show tips again" toggle -- both read/write through these so there's one
// source of truth for the opt-out flag.
export function areTipsDisabled(userId) {
  return localStorage.getItem(disabledKey(userId)) === '1'
}

export function setTipsEnabled(userId, enabled) {
  if (enabled) localStorage.removeItem(disabledKey(userId))
  else localStorage.setItem(disabledKey(userId), '1')
}

// Shows a random usage tip once per calendar day, the first time a guardian
// or kid reaches their dashboard that day -- not on every login, just the
// first one. Tracked per-profile (not per-device) in localStorage, since a
// shared device's profiles shouldn't all get suppressed by one kid's tip.
// A "don't show this again" checkbox lets the user opt out permanently,
// re-enabled from Settings / Admin Panel.
export default function TipOfTheDayModal({ user }) {
  const [tip, setTip] = useState(null)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  useEffect(() => {
    if (!user?.id || (user.role !== 'guardian' && user.role !== 'kid')) return
    if (areTipsDisabled(user.id)) return
    const today = new Date().toISOString().slice(0, 10)
    const key = `tipLastShown_${user.id}`
    if (localStorage.getItem(key) === today) return
    localStorage.setItem(key, today)
    setTip(pickRandomTip(user.role))
  }, [user?.id, user?.role])

  function dismiss() {
    if (dontShowAgain) setTipsEnabled(user.id, false)
    setTip(null)
  }

  if (!tip) return null

  return createPortal(
    <div
      onClick={dismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15,23,42,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 14, maxWidth: 420, width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden',
        }}
      >
        <div style={{
          background: 'linear-gradient(135deg, #f97316 0%, #ec4899 50%, #0d9488 100%)',
          padding: '16px 20px', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '1.02rem' }}>
            💡 Tip of the Day
          </span>
          <button
            onClick={dismiss}
            aria-label="Close"
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', lineHeight: 1, opacity: 0.85 }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: '20px 22px 8px', fontSize: '0.92rem', color: '#334155', lineHeight: 1.6 }}>
          {tip}
        </div>
        <div style={{ padding: '10px 22px 0' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#64748b', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={e => setDontShowAgain(e.target.checked)}
            />
            Don't show tips again
          </label>
        </div>
        <div style={{ padding: '14px 22px 20px', textAlign: 'right' }}>
          <button
            onClick={dismiss}
            style={{
              background: 'linear-gradient(135deg,#0f766e,#0d9488)', color: '#fff', border: 'none',
              borderRadius: 8, padding: '9px 22px', fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem',
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
