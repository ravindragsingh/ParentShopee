import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTour } from './TourContext.jsx'
import { hasSeenPrompt, isTourDisabled, markPromptSeen } from './tourStorage.js'

// Asked once, ever, per profile -- on whichever dashboard visit is the
// user's first since this shipped (or since they signed up). Answering
// either way (yes or no thanks) marks it seen so it never asks again;
// the tour stays reachable afterward via "Replay Tour" in the Admin Panel.
export default function FirstRunPrompt({ userId, tourId }) {
  const { startTour } = useTour()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!userId) return
    if (hasSeenPrompt(userId) || isTourDisabled(userId)) return
    setShow(true)
  }, [userId])

  function dismiss() {
    markPromptSeen(userId)
    setShow(false)
  }

  function accept() {
    markPromptSeen(userId)
    setShow(false)
    startTour(tourId)
  }

  if (!show) return null

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, maxWidth: 380, width: '100%', padding: '26px 24px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ fontSize: '2.2rem', marginBottom: 10 }}>🧭</div>
        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e293b', marginBottom: 8 }}>Want a quick guided tour?</div>
        <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6, marginBottom: 20 }}>
          We'll walk you through setting up your family, adding chores, and a few other handy features — takes about two minutes.
        </p>
        <button onClick={accept} className="login-btn" style={{ marginBottom: 10 }}>
          Yes, show me →
        </button>
        <button onClick={dismiss} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}>
          No thanks
        </button>
      </div>
    </div>,
    document.body
  )
}
