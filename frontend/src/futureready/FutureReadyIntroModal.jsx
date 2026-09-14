import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const seenKey = userId => `frIntroSeen_${userId}`

// Shown once per guardian, the first time they open the Future-Ready tab --
// explains the enable/disable + points model and nudges toward a sane
// number of active topics, since a kid facing 10+ options at once tends to
// just ignore all of them. Same one-time-dismissal shape as
// TipOfTheDayModal, but simpler: no daily re-trigger, no opt-out toggle,
// just "Got it" once.
export default function FutureReadyIntroModal({ userId }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!userId) return
    if (localStorage.getItem(seenKey(userId)) === '1') return
    setVisible(true)
  }, [userId])

  function dismiss() {
    localStorage.setItem(seenKey(userId), '1')
    setVisible(false)
  }

  if (!visible) return null

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
          background: '#fff', borderRadius: 14, maxWidth: 440, width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden',
        }}
      >
        <div style={{
          background: 'linear-gradient(135deg, #0d9488 0%, #0891b2 100%)',
          padding: '16px 20px', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '1.02rem' }}>
            🚀 Welcome to Future-Ready
          </span>
          <button
            onClick={dismiss}
            aria-label="Close"
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', lineHeight: 1, opacity: 0.85 }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: '20px 22px 8px', fontSize: '0.92rem', color: '#334155', lineHeight: 1.65 }}>
          <p style={{ margin: '0 0 12px' }}>
            Each topic here has short, interactive lessons your kids can complete to earn points. You're in control: turn any age band on or off, and set how many points it's worth.
          </p>
          <p style={{ margin: 0 }}>
            💡 <strong>A tip:</strong> it's best to not enable more than <strong>5 topics</strong> at once — a shorter, focused list is much more likely to actually get used than a huge one.
          </p>
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
