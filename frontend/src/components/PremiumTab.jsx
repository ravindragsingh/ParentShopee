import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api.js'

// Mirrors Stripe's own subscription.status values (see backend/helpers.py's
// is_family_subscribed) -- "active"/"trialing" are the only ones treated as
// premium access; everything else renders as the same "not subscribed" card.
const ACTIVE_STATUSES = ['active', 'trialing']

const INTERVAL_LABEL = { month: 'month', year: 'year' }
const CURRENCY_SYMBOL = { USD: '$', INR: '₹', CAD: 'C$', EUR: '€', GBP: '£' }

function formatPrice(plan) {
  const symbol = CURRENCY_SYMBOL[plan.currency] || plan.currency + ' '
  const amount = plan.amount % 1 === 0 ? plan.amount.toFixed(0) : plan.amount.toFixed(2)
  return `${symbol}${amount}`
}

export default function PremiumTab() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [status, setStatus] = useState(null)
  const [plans, setPlans] = useState([])
  const [selectedPlan, setSelectedPlan] = useState('monthly')
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
      const [statusData, plansData] = await Promise.all([api.getBillingStatus(), api.getBillingPlans().catch(() => [])])
      setStatus(statusData)
      const list = Array.isArray(plansData) ? plansData : []
      setPlans(list)
      if (list.length && !list.some(p => p.id === 'monthly')) setSelectedPlan(list[0].id)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleSubscribe() {
    setError('')
    setBusy(true)
    try {
      const { url } = await api.createCheckoutSession(selectedPlan)
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
  const activePlan = plans.find(p => p.id === selectedPlan) || plans[0]
  const subscribeLabel = activePlan
    ? `💎 Subscribe for ${formatPrice(activePlan)}/${INTERVAL_LABEL[activePlan.interval] || activePlan.interval}`
    : '💎 Subscribe to Premium'

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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {['Premium activity packs', 'Parent-controlled activities', 'Custom points'].map(line => (
                <div key={line} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#334155' }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%', background: '#0d9488', color: '#fff',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', flexShrink: 0,
                  }}>✓</span>
                  {line}
                </div>
              ))}
            </div>

            {plans.length > 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {plans.map(plan => {
                  const picked = selectedPlan === plan.id
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan.id)}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%',
                        padding: '12px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                        border: `2px solid ${picked ? '#0d9488' : '#e2e8f0'}`,
                        background: picked ? '#f0fdfa' : '#fff',
                      }}
                    >
                      <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem', textTransform: 'capitalize' }}>
                        {plan.id}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        {formatPrice(plan)}/{INTERVAL_LABEL[plan.interval] || plan.interval}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            <button
              className="btn btn-primary"
              disabled={busy}
              onClick={handleSubscribe}
              style={{
                width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: 600, borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg,#0f766e,#0d9488)', color: 'white', cursor: busy ? 'not-allowed' : 'pointer',
              }}
            >
              {busy ? 'Redirecting…' : subscribeLabel}
            </button>
            <div style={{ fontSize: '0.74rem', color: '#94a3b8', textAlign: 'center', marginTop: 8 }}>
              Renews automatically until canceled.
            </div>
          </>
        )}
      </div>
    </div>
  )
}
