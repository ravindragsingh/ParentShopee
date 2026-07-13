import { useState } from 'react'
import { api } from '../api.js'

// Parent view of shop item with edit/delete
export function ParentShopItem({ item, onRefresh }) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(item.name)
  const [editDesc, setEditDesc] = useState(item.description || '')
  const [editCost, setEditCost] = useState(item.cost)
  const [editEmoji, setEditEmoji] = useState(item.imageEmoji || '🎁')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!editName.trim() || !editCost) return
    setSaving(true)
    setError('')
    try {
      await api.updateShopItem(item.id, {
        name: editName.trim(),
        description: editDesc.trim(),
        cost: Number(editCost),
        imageEmoji: editEmoji
      })
      setEditing(false)
      onRefresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Remove "${item.name}" from the shop?`)) return
    setDeleting(true)
    try {
      await api.deleteShopItem(item.id)
      onRefresh()
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  if (editing) {
    return (
      <div className="shop-item-card">
        <input
          value={editEmoji}
          onChange={e => setEditEmoji(e.target.value)}
          style={{ width: '60px', fontSize: '1.5rem', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px' }}
          maxLength={4}
        />
        <input
          value={editName}
          onChange={e => setEditName(e.target.value)}
          placeholder="Item name"
          style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem' }}
        />
        <input
          value={editDesc}
          onChange={e => setEditDesc(e.target.value)}
          placeholder="Description"
          style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem' }}
        />
        <input
          type="number"
          value={editCost}
          onChange={e => setEditCost(e.target.value)}
          placeholder="Cost (pts)"
          style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem' }}
        />
        {error && <div style={{ color: '#dc2626', fontSize: '0.78rem' }}>{error}</div>}
        <div className="shop-actions">
          <button className="btn btn-green btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => { setEditing(false); setError('') }}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="shop-item-card">
      <div className="shop-emoji">{item.imageEmoji || '🎁'}</div>
      <div className="shop-name">{item.name}</div>
      {item.description && <div className="shop-desc">{item.description}</div>}
      <div className="shop-cost">{item.cost} pts</div>
      {error && <div style={{ color: '#dc2626', fontSize: '0.78rem' }}>{error}</div>}
      <div className="shop-actions">
        <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>Edit</button>
        <button className="btn btn-red btn-sm" onClick={handleDelete} disabled={deleting}>
          {deleting ? '...' : 'Delete'}
        </button>
      </div>
    </div>
  )
}

// Kid view of shop item with buy button
export function KidShopItem({ item, balance, isPending, onRefresh }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const canAfford = balance >= item.cost

  async function handleBuy() {
    if (!canAfford || isPending) return
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await api.buyShopItem(item.id)
      setSuccess(res.pending ? 'Submitted for approval!' : 'Purchased!')
      onRefresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="shop-item-card">
      <div className="shop-emoji">{item.imageEmoji || '🎁'}</div>
      <div className="shop-name">{item.name}</div>
      {item.description && <div className="shop-desc">{item.description}</div>}
      <div className="shop-cost">{item.cost} pts</div>
      {error && <div style={{ color: '#dc2626', fontSize: '0.78rem' }}>{error}</div>}
      {success && <div style={{ color: '#059669', fontSize: '0.78rem' }}>{success}</div>}
      <button
        className={`btn btn-sm ${isPending ? 'btn-outline' : canAfford ? 'btn-green' : 'btn-gray'}`}
        onClick={handleBuy}
        disabled={loading || !canAfford || isPending}
        title={isPending ? 'Waiting for parent approval' : canAfford ? 'Buy this item' : 'Not enough points'}
      >
        {loading ? 'Buying...' : isPending ? '⏳ Awaiting approval' : canAfford ? 'Buy' : 'Not enough pts'}
      </button>
    </div>
  )
}
