import { useState, useEffect } from 'react'
import { api } from '../api.js'

const STATUS_BADGE = {
  pending:   { label: '⏳ Pending',   bg: '#fffbeb', color: '#b45309' },
  fulfilled: { label: '✅ Fulfilled', bg: '#f0fdf4', color: '#15803d' },
  rejected:  { label: '🚫 Rejected',  bg: '#fef2f2', color: '#b91c1c' },
}

export default function ReferralsTab() {
  const [data, setData]   = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('') // 'code' | 'link' | ''
  const [cashingOut, setCashingOut] = useState(false)
  const [cashOutSuccess, setCashOutSuccess] = useState(null) // { amount } | null

  useEffect(() => { load() }, [])

  async function load() {
    setError('')
    try {
      setData(await api.getMyReferrals())
    } catch (err) {
      setError(err.message)
    }
  }

  async function copy(text, which) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(which)
      setTimeout(() => setCopied(''), 2000)
    } catch {
      // Clipboard access can be denied (older WebViews, insecure context) --
      // nothing useful to do beyond leaving the text selectable, so just no-op.
    }
  }

  async function handleCashOut() {
    setError('')
    setCashOutSuccess(null)
    setCashingOut(true)
    try {
      const payout = await api.cashOutReferrals()
      setCashOutSuccess({ amount: payout.amount })
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setCashingOut(false)
    }
  }

  if (error && !data) return <div className="error-msg">{error}</div>
  if (!data) return <div style={{ textAlign: 'center', color: '#94a3b8', padding: 48, fontSize: '0.9rem' }}>Loading…</div>

  const progressPct = Math.min(100, (data.pendingCredits / data.minCashoutCredits) * 100)

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="form-card">
        <div style={{ fontWeight: 700, fontSize: '1.15rem', color: '#1e293b', marginBottom: 4 }}>🎁 Refer & Earn</div>
        <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
          Share your code with other parents. When someone signs up and activates
          their account with it, you earn <strong>$1</strong>. Once you've earned{' '}
          <strong>${data.minCashoutCredits}</strong>, cash it out for an Amazon gift card —
          and it keeps adding up for every referral after that too.
        </div>
      </div>

      <div className="form-card">
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Your referral code
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <div style={{
            flex: 1, fontFamily: 'monospace', fontSize: '1.3rem', fontWeight: 700, letterSpacing: '0.08em',
            color: '#0d9488', background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 10,
            padding: '10px 16px', textAlign: 'center',
          }}>
            {data.referralCode}
          </div>
          <button className="btn" style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '0 18px' }} onClick={() => copy(data.referralCode, 'code')}>
            {copied === 'code' ? '✅ Copied' : '📋 Copy'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input readOnly value={data.referralLink} style={{ flex: 1, background: '#f8fafc', color: '#64748b', fontSize: '0.8rem' }} onFocus={e => e.target.select()} />
          <button className="btn" style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '0 18px' }} onClick={() => copy(data.referralLink, 'link')}>
            {copied === 'link' ? '✅ Copied' : '🔗 Copy Link'}
          </button>
        </div>
      </div>

      <div className="form-card">
        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1e293b' }}>{data.referralCount}</div>
            <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Lifetime referrals</div>
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0d9488' }}>${data.pendingCredits}</div>
            <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Available to cash out</div>
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#64748b' }}>${data.creditsRedeemed}</div>
            <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Already redeemed</div>
          </div>
        </div>

        {!data.canCashOut && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ height: 8, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPct}%`, background: '#0d9488', borderRadius: 999, transition: 'width 0.3s' }} />
            </div>
            <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: 6, textAlign: 'center' }}>
              ${data.pendingCredits} of ${data.minCashoutCredits} needed to cash out
            </div>
          </div>
        )}

        {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}

        {cashOutSuccess && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: '0.85rem', lineHeight: 1.5 }}>
            🎉 Cash-out requested for ${cashOutSuccess.amount}! Keep an eye on <strong>📬 My Tickets</strong> (Contact Support) — we'll send your Amazon gift card code there once it's processed.
          </div>
        )}

        <button
          className="btn btn-primary"
          disabled={!data.canCashOut || cashingOut}
          onClick={handleCashOut}
          style={{
            width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: 600, borderRadius: 10, border: 'none',
            background: data.canCashOut ? 'linear-gradient(135deg,#0f766e,#0d9488)' : '#e2e8f0',
            color: data.canCashOut ? 'white' : '#94a3b8', cursor: data.canCashOut && !cashingOut ? 'pointer' : 'not-allowed',
          }}
        >
          {cashingOut ? 'Submitting…' : data.canCashOut ? `🎉 Cash Out $${data.pendingCredits} (Amazon Gift Card)` : 'Not enough credits yet'}
        </button>
      </div>

      {data.payouts.length > 0 && (
        <div className="form-card">
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Cash-out history
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.payouts.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.92rem' }}>${p.amount}</div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>{new Date(p.createdAt).toLocaleDateString()}</div>
                  {p.adminNote && <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: 2 }}>{p.adminNote}</div>}
                </div>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, borderRadius: 6, padding: '3px 10px', background: STATUS_BADGE[p.status].bg, color: STATUS_BADGE[p.status].color }}>
                  {STATUS_BADGE[p.status].label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
