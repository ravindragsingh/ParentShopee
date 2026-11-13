import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api.js'

// Mirrors Stripe's own subscription.status values (see backend/helpers.py's
// is_family_subscribed) -- "active"/"trialing" are the only ones treated as
// premium access; everything else renders as the same "not subscribed" card.
const ACTIVE_STATUSES = ['active', 'trialing']

export default function PremiumTab() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const checkoutResult = searchParams.get('checkout') // 'success' | 'cancel' | null

  useEffect(() => { load() }, [])

  // Right after a successful Stripe Checkout, the webhook that actually
  // flips subscription_status may land a few seconds after Stripe redirects
  // the guardian back here -- poll briefly instead of leaving them staring
  // at a stale "not subscribed" card.
  useEffect(() => {
    if (checkoutResult !== 'success') return
    let attempts = 0
    const interval = setInterval(async () => {
      attempts += 1
      const fresh = await api.getBillingStatus().catch(() => null)
      if (fresh) setStatus(fresh)
      if ((fresh && fresh.isPremium) || attempts >= 6) clearInterval(interval)
    }, 2000)
    return () => clearInterval(interval)
  }, [checkoutResult])

  async function load() {
    setError('')
    try {
      setStatus(await api.getBillingStatus())
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleSubscribe() {
    setError('')
    setBusy(true)
    try {
      const { url } = await api.createCheckoutSession()
      window.location.href = url
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  async function handleManage() {
    setError('')
    setBusy(true)
    try {
      const { url } = await api.createBillingPortalSession()
      window.location.href = url
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  function dismissCheckoutBanner() {
    searchParams.delete('checkout')
    setSearchParams(searchParams, { replace: true })
  }

  if (!status && !error) return <div style={{ textAlign: 'center', color: '#94a3b8', padding: 48, fontSize: '0.9rem' }}>Loading…</div>

  const isPremium = status && ACTIVE_STATUSES.includes(status.status)

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="form-card">
        <div style={{ fontWeight: 700, fontSize: '1.15rem', color: '#1e293b', marginBottom: 4 }}>💎 Premium</div>
        <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
          Unlock premium Future-Ready lessons and Quests for everyone in your family —
          extra topics beyond the free catalog, picked out and added regularly.
        </div>
      </div>

      {checkoutResult === 'success' && !isPremium && (
        <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', color: '#0f766e', borderRadius: 10, padding: '10px 14px', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <span>✅ Payment received — activating your subscription, just a moment…</span>
          <button onClick={dismissCheckoutBanner} style={{ background: 'none', border: 'none', color: '#0f766e', cursor: 'pointer', fontWeight: 700, flexShrink: 0 }}>✕</button>
        </div>
      )}
      {checkoutResult === 'cancel' && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', borderRadius: 10, padding: '10px 14px', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <span>Checkout was canceled — no charge was made.</span>
          <button onClick={dismissCheckoutBanner} style={{ background: 'none', border: 'none', color: '#b45309', cursor: 'pointer', fontWeight: 700, flexShrink: 0 }}>✕</button>
        </div>
      )}
      {error && <div className="error-msg">{error}</div>}

      <div className="form-card">
        {isPremium ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: '1.6rem' }}>✅</span>
              <div>
                <div style={{ fontWeight: 700, color: '#166534', fontSize: '1rem' }}>You're subscribed</div>
                {status.currentPeriodEnd && (
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    Renews {new Date(status.currentPeriodEnd).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
            <button
              className="btn"
              disabled={busy}
              onClick={handleManage}
              style={{ width: '100%', padding: '12px', fontSize: '0.92rem', fontWeight: 600, borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', color: '#334155' }}
            >
              {busy ? 'Opening…' : 'Manage subscription'}
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Not subscribed yet
            </div>
            <button
              className="btn btn-primary"
              disabled={busy}
              onClick={handleSubscribe}
              style={{
                width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: 600, borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg,#0f766e,#0d9488)', color: 'white', cursor: busy ? 'not-allowed' : 'pointer',
              }}
            >
              {busy ? 'Redirecting…' : '💎 Subscribe to Premium'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
