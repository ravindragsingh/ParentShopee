import { useState, useEffect } from 'react'
import { Share } from '@capacitor/share'
import { api } from '../api.js'

// The pitch a referral actually gets shared with -- a bare link reads as
// spam and gives the recipient no reason to tap it, so every share/copy
// path below sends this instead of data.referralLink on its own.
function shareMessage(referralLink) {
  return `🎁 I've been using Reward Ur Kids to turn my kids' chores into a fun points system -- no more nagging! Join me and set up your family in a couple minutes: ${referralLink}`
}

const STATUS_BADGE = {
  pending:   { label: '⏳ Pending',   bg: '#fffbeb', color: '#b45309' },
  fulfilled: { label: '✅ Fulfilled', bg: '#f0fdf4', color: '#15803d' },
  rejected:  { label: '🚫 Rejected',  bg: '#fef2f2', color: '#b91c1c' },
}

export default function ReferralsTab() {
  const [data, setData]   = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('') // 'code' | 'message' | ''
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

  // Opens the native share sheet (Messages/WhatsApp/Mail/...) with the same
  // pitch+link text as the copy button below, so a one-tap share reads just
  // as well as a pasted one. Falls back to copying that text when the share
  // sheet isn't available at all (e.g. a desktop browser) -- a cancelled
  // share (the person just closed the sheet) is left alone, not treated as
  // a failure.
  async function handleShare() {
    const text = shareMessage(data.referralLink)
    try {
      await Share.share({ title: 'Join me on Reward Ur Kids', text, dialogTitle: 'Share your referral link' })
    } catch (err) {
      if (!/cancel/i.test(err?.message || '')) {
        await copy(text, 'message')
      }
    }
  }

  async function handleCashOut() {
    setError('')
    setCashOutSuccess(null)
    setCashingOut(true)
    try {
      const payout = await api.cashOutReferrals()
      setCashOutSuccess({ symbol: payout.currencySymbol, payoutAmount: payout.payoutAmount })
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
  const sym = data.currencySymbol

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="form-card">
        <div style={{ fontWeight: 700, fontSize: '1.15rem', color: '#1e293b', marginBottom: 4 }}>🎁 Refer & Earn</div>
        <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
          Share your code with other parents. When someone signs up and activates
          their account with it, you earn <strong>{sym}{data.perReferralValue}</strong>. Once you've earned{' '}
          <strong>{sym}{data.minCashoutAmount}</strong>, cash it out for an Amazon gift card —
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
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input readOnly value={data.referralLink} style={{ flex: 1, background: '#f8fafc', color: '#64748b', fontSize: '0.8rem' }} onFocus={e => e.target.select()} />
          <button className="btn" style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '0 18px' }} onClick={() => copy(data.referralLink, 'link')}>
            {copied === 'link' ? '✅ Copied' : '🔗 Copy Link'}
          </button>
        </div>

        <button
          className="btn btn-primary"
          style={{ width: '100%', padding: '11px', fontSize: '0.92rem', fontWeight: 600, borderRadius: 10, border: 'none' }}
          onClick={handleShare}
        >
          {copied === 'message' ? '✅ Message copied — paste it anywhere' : '📤 Share the invite'}
        </button>
        <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 6, textAlign: 'center' }}>
          Opens your share sheet with a ready-to-send invite, not just the bare link.
        </div>
      </div>

      <div className="form-card">
        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1e293b' }}>{data.referralCount}</div>
            <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Lifetime referrals</div>
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0d9488' }}>{sym}{data.pendingAmount}</div>
            <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Available to cash out</div>
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#64748b' }}>{sym}{data.creditsRedeemed * data.perReferralValue}</div>
            <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Already redeemed</div>
          </div>
        </div>

        {!data.canCashOut && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ height: 8, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPct}%`, background: '#0d9488', borderRadius: 999, transition: 'width 0.3s' }} />
            </div>
            <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: 6, textAlign: 'center' }}>
              {sym}{data.pendingAmount} of {sym}{data.minCashoutAmount} needed to cash out
            </div>
          </div>
        )}

        {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}

        {cashOutSuccess && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: '0.85rem', lineHeight: 1.5 }}>
            🎉 Cash-out requested for {cashOutSuccess.symbol}{cashOutSuccess.payoutAmount}! Keep an eye on <strong>📬 My Tickets</strong> (Contact Support) — we'll send your Amazon gift card code there once it's processed.
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
          {cashingOut ? 'Submitting…' : data.canCashOut ? `🎉 Cash Out ${sym}${data.pendingAmount} (Amazon Gift Card)` : 'Not enough credits yet'}
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
                  <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.92rem' }}>{p.currencySymbol}{p.payoutAmount}</div>
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
