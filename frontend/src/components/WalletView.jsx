import { useState, useEffect } from 'react'
import { api } from '../api.js'

function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleString()
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
        <div className="balance-label">Your Balance</div>
        <div className="balance-amount">{wallet.balance} pts</div>
      </div>

      <h3 style={{ marginBottom: 14, color: '#334155' }}>Transaction History</h3>
      {(!wallet.transactions || wallet.transactions.length === 0) ? (
        <div className="empty-text">No transactions yet.</div>
      ) : (
        <>
          <div className="transaction-list">
            {[...wallet.transactions]
              .sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt))
              .slice(0, 15)
              .map((tx, i) => {
                const isBonus = tx.type === 'bonus'
                const isEarned = tx.type === 'earned' || (!isBonus && tx.amount > 0)
                return (
                  <div key={tx.id || i} className={`transaction-item${isBonus ? ' bonus-tx' : ''}`}>
                    <div>
                      <div className="tx-desc">{tx.description || (isEarned ? 'Chore completed' : 'Purchase')}</div>
                      <div className="tx-time">{formatDate(tx.timestamp || tx.createdAt)}</div>
                    </div>
                    <div className={`tx-amount ${isBonus ? 'bonus' : isEarned ? 'earned' : 'spent'}`}>
                      {isBonus ? '⭐ +' : isEarned ? '+' : ''}{tx.amount} pts
                    </div>
                  </div>
                )
              })}
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

  function formatDate(ts) {
    if (!ts) return ''
    const d = new Date(ts)
    return d.toLocaleString()
  }

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

            {(!wallet.transactions || wallet.transactions.length === 0) ? (
              <div className="empty-text">No transactions yet.</div>
            ) : (
              <>
                <div className="transaction-list">
                  {[...wallet.transactions]
                    .sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt))
                    .slice(0, 15)
                    .map((tx, i) => {
                      const isBonus = tx.type === 'bonus'
                      const isEarned = tx.type === 'earned' || (!isBonus && tx.amount > 0)
                      return (
                        <div key={tx.id || i} className={`transaction-item${isBonus ? ' bonus-tx' : ''}`}>
                          <div>
                            <div className="tx-desc">{tx.description || (isEarned ? 'Chore completed' : 'Purchase')}</div>
                            <div className="tx-time">{formatDate(tx.timestamp || tx.createdAt)}</div>
                          </div>
                          <div className={`tx-amount ${isBonus ? 'bonus' : isEarned ? 'earned' : 'spent'}`}>
                            {isBonus ? '⭐ +' : isEarned ? '+' : ''}{tx.amount} pts
                          </div>
                        </div>
                      )
                    })}
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
