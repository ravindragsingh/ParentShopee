import { useState, useEffect } from 'react'
import { api } from '../api.js'

function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleString()
}

function TxItem({ tx, i }) {
  const isBonus           = tx.type === 'bonus'
  const isDeduct          = tx.type === 'deduct'
  const isBehaviour       = tx.type === 'behaviour'
  const isBehaviourDeduct = tx.type === 'behaviour_deduct'
  const isSaved           = tx.type === 'saved'      // moved balance -> savings
  const isWithdrawn       = tx.type === 'withdrawn'  // moved savings -> balance
  const isAnyAdd          = isBonus || isBehaviour || isWithdrawn
  const isAnyDeduct       = isDeduct || isBehaviourDeduct || isSaved
  const isEarned          = tx.type === 'earned' || (!isAnyAdd && !isAnyDeduct && tx.amount > 0)

  let icon = ''
  if (isBonus)           icon = '⭐ +'
  else if (isBehaviour)  icon = '🌟 +'
  else if (isWithdrawn)  icon = '🏦 +'
  else if (isSaved)      icon = '🏦 − '
  else if (isAnyDeduct)  icon = '− '
  else if (isEarned)     icon = '+'

  return (
    <div className={`transaction-item${isAnyAdd ? ' bonus-tx' : isAnyDeduct ? ' deduct-tx' : ''}`}>
      <div>
        <div className="tx-desc">{tx.description || (isEarned ? 'Chore completed' : isSaved ? 'Moved to savings' : isWithdrawn ? 'Moved from savings' : isAnyDeduct ? 'Points adjusted' : 'Purchase')}</div>
        <div className="tx-time">{formatDate(tx.timestamp || tx.createdAt)}</div>
      </div>
      <div className={`tx-amount ${isAnyAdd ? 'bonus' : isAnyDeduct ? 'deduct' : isEarned ? 'earned' : 'spent'}`}>
        {icon}{tx.amount} pts
      </div>
    </div>
  )
}

// One half of the spendable/savings pair — a big friendly circular icon over
// a bold number, on a soft tinted tile.
function BalanceTile({ icon, label, amount, iconBg, tileBg }) {
  return (
    <div style={{
      flex: 1, minWidth: 130, textAlign: 'center', borderRadius: 16, padding: '16px 10px',
      background: tileBg,
    }}>
      <div style={{
        width: 46, height: 46, borderRadius: '50%', margin: '0 auto 8px', background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
        boxShadow: '0 3px 8px rgba(0,0,0,0.12)',
      }}>
        {icon}
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.15 }}>{amount}</div>
      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.02em', marginTop: 2 }}>{label}</div>
    </div>
  )
}

// Move points between a kid's spendable balance and their savings. Shopping
// only ever spends `balance` -- savings is just points set aside, not usable
// for purchases until moved back.
function SavingsCard({ wallet, onChanged }) {
  const [direction, setDirection] = useState('save') // 'save' | 'withdraw'
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const savingsBalance = wallet.savingsBalance ?? 0
  const maxAmount = direction === 'save' ? wallet.balance : savingsBalance
  const quickAmounts = [...new Set(
    [Math.floor(maxAmount * 0.25), Math.floor(maxAmount * 0.5), maxAmount].filter(v => v > 0)
  )]

  async function handleTransfer(e) {
    e.preventDefault()
    const value = Number(amount)
    if (!value || value <= 0) { setError('Enter an amount greater than zero.'); return }
    if (value > maxAmount) { setError(`You only have ${maxAmount} pts there.`); return }
    setBusy(true)
    setError('')
    try {
      if (direction === 'save') await api.depositToSavings(value)
      else await api.withdrawFromSavings(value)
      setAmount('')
      onChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="form-card" style={{ background: 'linear-gradient(135deg, #f5f3ff, #f0fdfa)', border: '1px solid #ede9fe' }}>
      <div style={{ fontWeight: 800, fontSize: '1.02rem', color: '#1e293b', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
        🐷 Your Piggy Bank
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <BalanceTile
          icon="⭐" label="SPENDABLE" amount={`${wallet.balance} pts`}
          iconBg="linear-gradient(135deg, #34d399, #059669)" tileBg="rgba(255,255,255,0.7)"
        />
        <BalanceTile
          icon="🐷" label="SAVINGS" amount={`${savingsBalance} pts`}
          iconBg="linear-gradient(135deg, #c4b5fd, #7c3aed)" tileBg="rgba(255,255,255,0.7)"
        />
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 14, background: '#e2e8f0', borderRadius: 12, padding: 4 }}>
        <button
          type="button"
          onClick={() => { setDirection('save'); setAmount(''); setError('') }}
          style={{
            flex: 1, padding: '8px 10px', borderRadius: 9, border: 'none', cursor: 'pointer',
            fontSize: '0.84rem', fontWeight: 700, transition: 'all 0.15s',
            background: direction === 'save' ? '#fff' : 'transparent',
            color: direction === 'save' ? '#059669' : '#64748b',
            boxShadow: direction === 'save' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
          }}
        >
          ⭐ → 🐷 Save
        </button>
        <button
          type="button"
          onClick={() => { setDirection('withdraw'); setAmount(''); setError('') }}
          style={{
            flex: 1, padding: '8px 10px', borderRadius: 9, border: 'none', cursor: 'pointer',
            fontSize: '0.84rem', fontWeight: 700, transition: 'all 0.15s',
            background: direction === 'withdraw' ? '#fff' : 'transparent',
            color: direction === 'withdraw' ? '#7c3aed' : '#64748b',
            boxShadow: direction === 'withdraw' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
          }}
        >
          🐷 → ⭐ Withdraw
        </button>
      </div>

      <form onSubmit={handleTransfer}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            type="number" min="1" step="1" value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder={`Up to ${maxAmount} pts`}
            style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #ddd6fe', borderRadius: 10, fontSize: '0.95rem', background: '#fff' }}
          />
          <button
            type="submit"
            disabled={busy || maxAmount <= 0}
            style={{
              padding: '10px 18px', borderRadius: 10, border: 'none', cursor: busy || maxAmount <= 0 ? 'default' : 'pointer',
              fontWeight: 700, fontSize: '0.9rem', color: '#fff', whiteSpace: 'nowrap',
              background: maxAmount <= 0 ? '#cbd5e1' : direction === 'save' ? 'linear-gradient(135deg, #34d399, #059669)' : 'linear-gradient(135deg, #c4b5fd, #7c3aed)',
            }}
          >
            {busy ? 'Moving...' : direction === 'save' ? 'Save it! 🐷' : 'Withdraw ⭐'}
          </button>
        </div>

        {quickAmounts.length > 0 && (
          <div style={{ display: 'flex', gap: 6 }}>
            {quickAmounts.map(v => (
              <button
                type="button" key={v} onClick={() => setAmount(String(v))}
                style={{
                  padding: '3px 12px', borderRadius: 999, fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer',
                  border: '1px solid #ddd6fe', background: '#fff', color: '#7c3aed',
                }}
              >
                {v === maxAmount ? 'All' : v} pts
              </button>
            ))}
          </div>
        )}
      </form>
      {error && <div className="error-msg" style={{ marginTop: 8 }}>{error}</div>}
      {maxAmount <= 0 && (
        <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 8 }}>
          {direction === 'save' ? "You don't have any spendable points to save right now." : "You don't have any savings to move back yet."}
        </div>
      )}
    </div>
  )
}

// Kid's own wallet view
export function KidWalletView({ kidId, onBalanceChange }) {
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadWallet()
  }, [kidId])

  async function loadWallet() {
    setLoading(true)
    setError('')
    try {
      const data = await api.getWallet(kidId)
      setWallet(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading-text">Loading wallet...</div>
  if (error) return <div className="error-msg">{error}</div>
  if (!wallet) return null

  const sorted = [...(wallet.transactions || [])]
    .sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt))
    .slice(0, 15)

  return (
    <div>
      <div className="balance-display">
        <div className="balance-label">⭐ Your Balance ⭐</div>
        <div className="balance-amount">{wallet.balance} pts</div>
      </div>

      <SavingsCard wallet={wallet} onChanged={() => { loadWallet(); onBalanceChange && onBalanceChange() }} />

      <h3 style={{ marginBottom: 14, color: '#334155' }}>📋 Transaction History</h3>
      {sorted.length === 0 ? (
        <div className="empty-text">No transactions yet.</div>
      ) : (
        <>
          <div className="transaction-list">
            {sorted.map((tx, i) => <TxItem key={tx.id || i} tx={tx} i={i} />)}
          </div>
          {wallet.transactions.length > 15 && (
            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8', marginTop: 8 }}>
              Showing 15 most recent of {wallet.transactions.length} transactions
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Modal showing a single kid's wallet for the guardian
export function KidWalletModal({ kid, onClose }) {
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadWallet()
  }, [kid.id])

  async function loadWallet() {
    setLoading(true)
    setError('')
    try {
      const data = await api.getWallet(kid.id)
      setWallet(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const sorted = [...(wallet?.transactions || [])]
    .sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt))
    .slice(0, 15)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{kid.name}'s Wallet</div>
          <button className="btn btn-outline btn-sm" onClick={onClose}>Close</button>
        </div>

        {loading && <div className="loading-text">Loading...</div>}
        {error && <div className="error-msg">{error}</div>}

        {wallet && (
          <>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 4 }}>Current Balance</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#059669' }}>{wallet.balance} pts</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 4 }}>🏦 Savings</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#7c3aed' }}>{wallet.savingsBalance ?? 0} pts</div>
              </div>
            </div>

            {sorted.length === 0 ? (
              <div className="empty-text">No transactions yet.</div>
            ) : (
              <>
                <div className="transaction-list">
                  {sorted.map((tx, i) => <TxItem key={tx.id || i} tx={tx} i={i} />)}
                </div>
                {wallet.transactions.length > 15 && (
                  <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8', marginTop: 8 }}>
                    Showing 15 most recent of {wallet.transactions.length} transactions
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
