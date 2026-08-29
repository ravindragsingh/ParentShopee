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
    <div className="form-card">
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 120, textAlign: 'center' }}>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700 }}>SPENDABLE</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669' }}>{wallet.balance} pts</div>
        </div>
        <div style={{ flex: 1, minWidth: 120, textAlign: 'center' }}>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700 }}>🏦 SAVINGS</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7c3aed' }}>{savingsBalance} pts</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <button
          type="button"
          className={`btn btn-sm ${direction === 'save' ? 'btn-primary' : 'btn-outline'}`}
          style={{ flex: 1 }}
          onClick={() => { setDirection('save'); setError('') }}
        >
          Move to Savings
        </button>
        <button
          type="button"
          className={`btn btn-sm ${direction === 'withdraw' ? 'btn-primary' : 'btn-outline'}`}
          style={{ flex: 1 }}
          onClick={() => { setDirection('withdraw'); setError('') }}
        >
          Move to Wallet
        </button>
      </div>

      <form onSubmit={handleTransfer} style={{ display: 'flex', gap: 8 }}>
        <input
          type="number" min="1" step="1" value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder={`Up to ${maxAmount} pts`}
          style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.9rem' }}
        />
        <button type="submit" className="btn btn-green btn-sm" disabled={busy || maxAmount <= 0}>
          {busy ? 'Moving...' : direction === 'save' ? 'Save' : 'Withdraw'}
        </button>
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
