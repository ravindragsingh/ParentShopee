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
  const isAnyAdd          = isBonus || isBehaviour
  const isAnyDeduct       = isDeduct || isBehaviourDeduct
  const isEarned          = tx.type === 'earned' || (!isAnyAdd && !isAnyDeduct && tx.amount > 0)

  let icon = ''
  if (isBonus)           icon = '⭐ +'
  else if (isBehaviour)  icon = '🌟 +'
  else if (isAnyDeduct)  icon = '− '
  else if (isEarned)     icon = '+'

  return (
    <div className={`transaction-item${isAnyAdd ? ' bonus-tx' : isAnyDeduct ? ' deduct-tx' : ''}`}>
      <div>
        <div className="tx-desc">{tx.description || (isEarned ? 'Chore completed' : isAnyDeduct ? 'Points adjusted' : 'Purchase')}</div>
        <div className="tx-time">{formatDate(tx.timestamp || tx.createdAt)}</div>
      </div>
      <div className={`tx-amount ${isAnyAdd ? 'bonus' : isAnyDeduct ? 'deduct' : isEarned ? 'earned' : 'spent'}`}>
        {icon}{tx.amount} pts
      </div>
    </div>
  )
}

// Kid's own wallet view
export function KidWalletView({ kidId }) {
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

  return (
    <div>
      <div className="balance-display">
        <div className="balance-label">⭐ Your Balance ⭐</div>
        <div className="balance-amount">{wallet.balance} pts</div>
      </div>
    </div>
  )
}

// Modal showing a single kid's wallet for the parent
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
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 4 }}>Current Balance</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#059669' }}>{wallet.balance} pts</div>
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
