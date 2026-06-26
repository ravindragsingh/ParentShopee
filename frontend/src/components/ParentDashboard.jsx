import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api.js'
import { ParentChoreCard, EmojiPicker, CHORE_EMOJIS, KID_AVATARS } from './ChoreCard.jsx'
import { ParentShopItem } from './ShopItem.jsx'
import { KidWalletModal } from './WalletView.jsx'

// ─── Sample chore templates ──────────────────────────────────────────────────

const SAMPLE_CHORES = [
  // ── Age 8 & under ──────────────────────────────────────────────────────────
  { title: 'Clean up your toys',        points:  4, imageEmoji: '🧸', description: 'Put all toys back in their proper place.' },
  { title: 'Put dirty clothes in hamper',points: 3, imageEmoji: '👕', description: 'Collect all dirty clothes and put them in the laundry basket.' },
  { title: 'Pack your school bag',       points:  3, imageEmoji: '🎒', description: 'Pack your bag the night before with everything you need.' },
  { title: 'Put shoes away',             points:  2, imageEmoji: '👟', description: 'Put your shoes neatly on the shoe rack.' },
  { title: 'Clear your plate after eating',points: 3, imageEmoji: '🍽️', description: 'Take your plate, cup, and cutlery to the kitchen sink.' },
  { title: 'Feed the pet',               points:  5, imageEmoji: '🐕', description: 'Fill the food and water bowl for the family pet.' },
  { title: 'Water the plants',           points:  5, imageEmoji: '🌿', description: 'Water the indoor plants with a small watering can.' },
  { title: 'Make your bed',              points:  4, imageEmoji: '🛏️', description: 'Straighten your sheets, fluff your pillow, and tidy your bedroom.' },
  { title: 'Tidy your bedroom',          points:  5, imageEmoji: '🏠', description: 'Put things away, pick up off the floor, and make it neat.' },
  { title: 'Sort the recycling',         points:  5, imageEmoji: '♻️', description: 'Sort paper, plastic, and cans into the correct recycling bins.' },
  { title: 'Dust the furniture',         points:  5, imageEmoji: '🪣', description: 'Use a cloth to dust the shelves and tables in your room.' },
  { title: 'Help carry groceries',       points:  4, imageEmoji: '🛍️', description: 'Help carry grocery bags from the car to the kitchen.' },
  { title: 'Set the dinner table',       points:  4, imageEmoji: '🥄', description: 'Lay out plates, cutlery, and glasses for everyone.' },
  { title: 'Wipe down the bathroom sink',points: 4, imageEmoji: '🪥', description: 'Wipe the sink and tap clean with a cloth after use.' },
  { title: 'Empty small bins',           points:  3, imageEmoji: '🗑️', description: 'Empty the small bedroom and bathroom bins into the main bin.' },
  { title: 'Put books back on shelf',    points:  3, imageEmoji: '📚', description: 'Put all books and magazines neatly back on the bookshelf.' },
  // ── General household ───────────────────────────────────────────────────────
  { title: 'Wash the dishes',            points: 10, imageEmoji: '🍳', description: 'Wash and dry all dishes after dinner.' },
  { title: 'Take out the trash',         points:  5, imageEmoji: '🚮', description: 'Take all trash bags out to the bin.' },
  { title: 'Fold the laundry',           points: 12, imageEmoji: '🧺', description: 'Fold clean clothes from the dryer and put them away.' },
  { title: 'Sweep the floor',            points:  8, imageEmoji: '🧹', description: 'Sweep the floors in all rooms.' },
  { title: 'Vacuum the living room',     points: 15, imageEmoji: '🛋️', description: 'Vacuum carpets and clean under furniture.' },
  { title: 'Clean the bathroom',         points: 20, imageEmoji: '🚽', description: 'Scrub the sink, toilet, and wipe down surfaces.' },
  { title: 'Wash the car',               points: 20, imageEmoji: '🚗', description: 'Rinse, soap, and dry the family car.' },
  { title: 'Mop the floor',              points: 15, imageEmoji: '🪣', description: 'Mop the kitchen and hallway floors after sweeping.' },
  { title: 'Empty the dishwasher',       points:  6, imageEmoji: '🫙', description: 'Unpack and put away all clean dishes.' },
  { title: 'Wipe kitchen surfaces',      points:  7, imageEmoji: '🧼', description: 'Clean all kitchen surfaces with a damp cloth.' },
  { title: 'Tidy the living room',       points: 10, imageEmoji: '📦', description: 'Put things away and straighten up the room.' },
  { title: 'Sweep the porch',            points:  8, imageEmoji: '🏡', description: 'Sweep leaves and dirt off the front porch.' },
]

// ─── Chores Tab ─────────────────────────────────────────────────────────────

function ChoresTab({ kids }) {
  const [chores, setChores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Add chore form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [points, setPoints] = useState('')
  const [assignedKidId, setAssignedKidId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [choreEmoji, setChoreEmoji] = useState('📋')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const formRef = useRef(null)

  function fillFromSample(sample) {
    setTitle(sample.title)
    setDescription(sample.description)
    setPoints(String(sample.points))
    setChoreEmoji(sample.imageEmoji)
    setAssignedKidId('')
    setShowEmojiPicker(false)
    setAddError('')
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const loadChores = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getChores()
      setChores(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadChores() }, [loadChores])

  async function handleAddChore(e) {
    e.preventDefault()
    if (!title.trim() || !points) {
      setAddError('Title and points are required.')
      return
    }
    setAdding(true)
    setAddError('')
    try {
      await api.createChore({
        title: title.trim(),
        description: description.trim(),
        points: Number(points),
        assignedKidId: assignedKidId || null,
        dueDate: dueDate || null,
        imageEmoji: choreEmoji,
      })
      setTitle('')
      setDescription('')
      setPoints('')
      setAssignedKidId('')
      setDueDate('')
      setChoreEmoji('📋')
      setShowEmojiPicker(false)
      loadChores()
    } catch (err) {
      setAddError(err.message)
    } finally {
      setAdding(false)
    }
  }

  const open = chores.filter(c => c.status === 'open')
  const pending = chores.filter(c => c.status === 'pending')
  const complete = chores.filter(c => c.status === 'complete')
  const expired = chores.filter(c => c.status === 'expired')

  return (
    <div>
      {/* Add Chore Form */}
      <div className="form-card" ref={formRef}>
        <div className="form-title">Add New Chore</div>
        {addError && <div className="error-msg">{addError}</div>}
        <form onSubmit={handleAddChore}>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label>Start from a template <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '0.8rem' }}>(optional)</span></label>
            <select
              value=""
              onChange={e => {
                const s = SAMPLE_CHORES.find(c => c.title === e.target.value)
                if (s) fillFromSample(s)
              }}
            >
              <option value="">— Pick a sample chore to pre-fill the form —</option>
              {SAMPLE_CHORES.map(s => (
                <option key={s.title} value={s.title}>
                  {s.imageEmoji} {s.title} ({s.points} pts)
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Title *</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Wash the dishes"
              />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: '100px', maxWidth: '120px' }}>
              <label>Points *</label>
              <input
                type="number"
                min="1"
                value={points}
                onChange={e => setPoints(e.target.value)}
                placeholder="10"
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Assign To <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '0.8rem' }}>(optional)</span></label>
              <select value={assignedKidId} onChange={e => setAssignedKidId(e.target.value)}>
                <option value="">— Any child can do it —</option>
                {kids.map(k => (
                  <option key={k.id} value={k.id}>{k.avatar || '🐶'} {k.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Description</label>
              <input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Optional details..."
              />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: '160px', maxWidth: '200px' }}>
              <label>Due Date (optional)</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <button
              type="button"
              className="chore-emoji-btn"
              title="Choose chore image"
              onClick={() => setShowEmojiPicker(v => !v)}
            >
              {choreEmoji}
            </button>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              {showEmojiPicker ? 'Click an image to select, or click the icon again to close' : 'Click the icon to choose a chore image'}
            </span>
            <button type="submit" className="btn btn-primary" disabled={adding} style={{ marginLeft: 'auto' }}>
              {adding ? 'Adding...' : 'Add Chore'}
            </button>
          </div>
          {showEmojiPicker && (
            <div style={{ marginBottom: 14 }}>
              <EmojiPicker emojis={CHORE_EMOJIS} value={choreEmoji} onChange={e => { setChoreEmoji(e); setShowEmojiPicker(false) }} />
            </div>
          )}
        </form>
      </div>

      {/* Chore Lists */}
      {loading && <div className="loading-text">Loading chores...</div>}
      {error && <div className="error-msg">{error}</div>}

      {!loading && (
        <>
          {/* Open */}
          <div className="section-header open">Open ({open.length})</div>
          {open.length === 0 ? (
            <div className="empty-text">No open chores.</div>
          ) : (
            open.map(chore => (
              <ParentChoreCard key={chore.id} chore={chore} kids={kids} onRefresh={loadChores} />
            ))
          )}

          {/* Pending */}
          <div className="section-header pending" style={{ marginTop: 8 }}>Pending ({pending.length})</div>
          {pending.length === 0 ? (
            <div className="empty-text">No chores awaiting approval.</div>
          ) : (
            pending.map(chore => (
              <ParentChoreCard key={chore.id} chore={chore} kids={kids} onRefresh={loadChores} />
            ))
          )}

          {/* Complete */}
          <div className="section-header complete" style={{ marginTop: 8 }}>Complete ({complete.length})</div>
          {complete.length === 0 ? (
            <div className="empty-text">No completed chores yet.</div>
          ) : (
            complete.map(chore => (
              <ParentChoreCard key={chore.id} chore={chore} kids={kids} onRefresh={loadChores} />
            ))
          )}

          {/* Expired */}
          {expired.length > 0 && (
            <>
              <div className="section-header expired" style={{ marginTop: 8 }}>Expired ({expired.length})</div>
              {expired.map(chore => (
                <ParentChoreCard key={chore.id} chore={chore} kids={kids} onRefresh={loadChores} />
              ))}
            </>
          )}
        </>
      )}
    </div>
  )
}

// ─── Shop Tab ────────────────────────────────────────────────────────────────

function ShopTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [cost, setCost] = useState('')
  const [emoji, setEmoji] = useState('🎁')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  const loadItems = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getShopItems()
      setItems(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadItems() }, [loadItems])

  async function handleAddItem(e) {
    e.preventDefault()
    if (!name.trim() || !cost) {
      setAddError('Name and cost are required.')
      return
    }
    setAdding(true)
    setAddError('')
    try {
      await api.createShopItem({
        name: name.trim(),
        description: description.trim(),
        cost: Number(cost),
        imageEmoji: emoji || '🎁'
      })
      setName('')
      setDescription('')
      setCost('')
      setEmoji('🎁')
      loadItems()
    } catch (err) {
      setAddError(err.message)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div>
      {/* Add Item Form */}
      <div className="form-card">
        <div className="form-title">Add Shop Item</div>
        {addError && <div className="error-msg">{addError}</div>}
        <form onSubmit={handleAddItem}>
          <div className="form-row">
            <div className="form-group" style={{ maxWidth: '80px' }}>
              <label>Emoji</label>
              <input
                value={emoji}
                onChange={e => setEmoji(e.target.value)}
                maxLength={4}
                style={{ textAlign: 'center', fontSize: '1.2rem' }}
              />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label>Item Name *</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Extra Screen Time"
              />
            </div>
            <div className="form-group" style={{ maxWidth: '110px' }}>
              <label>Cost (pts) *</label>
              <input
                type="number"
                min="1"
                value={cost}
                onChange={e => setCost(e.target.value)}
                placeholder="50"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Description</label>
              <input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Optional details..."
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={adding}>
                {adding ? 'Adding...' : 'Add Item'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {loading && <div className="loading-text">Loading shop...</div>}
      {error && <div className="error-msg">{error}</div>}

      {!loading && items.length === 0 && (
        <div className="empty-text">No items in the shop yet. Add some above!</div>
      )}

      {!loading && items.length > 0 && (
        <div className="shop-grid">
          {items.map(item => (
            <ParentShopItem key={item.id} item={item} onRefresh={loadItems} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Co-Parent Tab ────────────────────────────────────────────────────────────

function CoParentTab() {
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Create form
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  // Change password
  const [showPwdForm, setShowPwdForm] = useState(false)
  const [newPwd, setNewPwd] = useState('')
  const [pwdError, setPwdError] = useState('')
  const [savingPwd, setSavingPwd] = useState(false)

  // Revoke
  const [revoking, setRevoking] = useState(false)

  useEffect(() => { loadInfo() }, [])

  async function loadInfo() {
    setLoading(true); setError('')
    try { setInfo(await api.getCoParent()) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function handleAdd(e) {
    e.preventDefault()
    setAddError('')
    if (!name.trim() || !username.trim() || !password) {
      setAddError('All fields are required.')
      return
    }
    setAdding(true)
    try {
      await api.addCoParent({ name: name.trim(), username: username.trim(), password })
      setName(''); setUsername(''); setPassword('')
      loadInfo()
    } catch (err) {
      setAddError(err.message)
    } finally {
      setAdding(false)
    }
  }

  async function handleChangePassword() {
    setPwdError('')
    if (!newPwd || newPwd.length < 4) { setPwdError('Password must be at least 4 characters.'); return }
    setSavingPwd(true)
    try {
      await api.updateCoParentPassword(newPwd)
      setNewPwd(''); setShowPwdForm(false)
    } catch (err) {
      setPwdError(err.message)
    } finally {
      setSavingPwd(false)
    }
  }

  async function handleRevoke() {
    if (!window.confirm(`Remove co-parent "${info.coParent?.name}"? They will lose access immediately.`)) return
    setRevoking(true)
    try { await api.removeCoParent(); loadInfo() }
    catch (err) { setError(err.message) }
    finally { setRevoking(false) }
  }

  // Co-parents see a notice — they cannot manage this tab
  if (info?.isCoParent) {
    return (
      <div className="form-card" style={{ borderLeft: '4px solid #4f46e5' }}>
        <div className="form-title" style={{ marginBottom: 6 }}>Co-Parent Access</div>
        <p style={{ fontSize: '0.9rem', color: '#475569' }}>
          You have co-parent access to <strong>{info.primaryParent?.name || 'this family'}</strong>'s account.
          You can manage their children's chores, passwords and wallet — same as the primary parent.
        </p>
      </div>
    )
  }

  if (loading) return <div className="loading-text">Loading...</div>
  if (error) return <div className="error-msg">{error}</div>

  return (
    <div>
      {/* Add co-parent form */}
      {!info?.coParent && (
        <div className="form-card">
          <div className="form-title">Add Co-Parent</div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 16 }}>
            Create an account for another parent (partner, spouse, etc.). They get the same access as you —
            they can manage children, chores, shop and wallets. Only one co-parent per family.
          </p>
          {addError && <div className="error-msg">{addError}</div>}
          <form onSubmit={handleAdd}>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. John Smith" />
              </div>
              <div className="form-group">
                <label>Username *</label>
                <input value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. john_parent" />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 4 characters" />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" disabled={adding}>
                  {adding ? 'Creating...' : 'Create Co-Parent'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Existing co-parent details */}
      {info?.coParent && (
        <div className="form-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div className="form-title" style={{ marginBottom: 0 }}>Co-Parent</div>
            <span className="badge complete">Active</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
              color: 'white', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '1.4rem', fontWeight: 700, flexShrink: 0
            }}>
              {info.coParent.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1e293b' }}>{info.coParent.name}</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>@{info.coParent.username}</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>Full parent access to all children</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => { setShowPwdForm(v => !v); setNewPwd(''); setPwdError('') }}
            >
              {showPwdForm ? 'Cancel' : '🔑 Change Password'}
            </button>
            <button className="btn btn-red btn-sm" onClick={handleRevoke} disabled={revoking}>
              {revoking ? 'Removing...' : 'Remove Co-Parent'}
            </button>
          </div>

          {showPwdForm && (
            <div style={{ marginTop: 14, padding: '12px 16px', background: '#f8fafc', borderRadius: 8 }}>
              {pwdError && <div className="error-msg" style={{ marginBottom: 8 }}>{pwdError}</div>}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input
                  type="password"
                  value={newPwd}
                  onChange={e => setNewPwd(e.target.value)}
                  placeholder="New password (min 4 chars)"
                  style={{ padding: '7px 12px', border: '1px solid #cbd5e1', borderRadius: 7, fontSize: '0.9rem', width: 240 }}
                />
                <button className="btn btn-green btn-sm" onClick={handleChangePassword} disabled={savingPwd}>
                  {savingPwd ? 'Saving...' : 'Save Password'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Kids Tab ────────────────────────────────────────────────────────────────

function KidsTab() {
  const [wallets, setWallets] = useState([])
  const [kids, setKids] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedKid, setSelectedKid] = useState(null)

  // Add child form
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newAvatar, setNewAvatar] = useState('🐶')
  const [addError, setAddError] = useState('')
  const [adding, setAdding] = useState(false)

  // Change password
  const [changingPwdFor, setChangingPwdFor] = useState(null)
  const [newPwd, setNewPwd] = useState('')
  const [pwdError, setPwdError] = useState('')
  const [savingPwd, setSavingPwd] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true); setError('')
    try {
      const [kidsData, walletsData] = await Promise.all([api.getKids(), api.getAllWallets()])
      setKids(Array.isArray(kidsData) ? kidsData : [])
      setWallets(Array.isArray(walletsData) ? walletsData : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function getBalance(kidId) {
    const w = wallets.find(w => w.kidId === kidId)
    return w?.balance ?? 0
  }

  async function handleAddKid(e) {
    e.preventDefault()
    setAddError('')
    if (!newName.trim() || !newUsername.trim() || !newPassword) {
      setAddError('Name, username and password are required.')
      return
    }
    setAdding(true)
    try {
      await api.addKid({ name: newName.trim(), username: newUsername.trim(), password: newPassword, avatar: newAvatar })
      setNewName(''); setNewUsername(''); setNewPassword(''); setNewAvatar('🐶')
      setShowAddForm(false)
      loadData()
    } catch (err) {
      setAddError(err.message)
    } finally {
      setAdding(false)
    }
  }

  async function handleChangePassword(kid) {
    setPwdError('')
    if (!newPwd || newPwd.length < 4) { setPwdError('Password must be at least 4 characters.'); return }
    setSavingPwd(true)
    try {
      await api.updateKidPassword(kid.id, newPwd)
      setChangingPwdFor(null); setNewPwd('')
    } catch (err) {
      setPwdError(err.message)
    } finally {
      setSavingPwd(false)
    }
  }

  if (loading) return <div className="loading-text">Loading kids...</div>
  if (error) return <div className="error-msg">{error}</div>

  return (
    <div>
      {/* Add child form */}
      <div className="form-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showAddForm ? 16 : 0 }}>
          <div className="form-title" style={{ marginBottom: 0 }}>
            My Children <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 400 }}>({kids.length}/10)</span>
          </div>
          {kids.length < 10 && (
            <button className="btn btn-primary btn-sm" onClick={() => { setShowAddForm(v => !v); setAddError('') }}>
              {showAddForm ? 'Cancel' : '+ Add Child'}
            </button>
          )}
        </div>

        {showAddForm && (
          <form onSubmit={handleAddKid}>
            {addError && <div className="error-msg" style={{ marginBottom: 10 }}>{addError}</div>}
            <div className="form-row" style={{ marginTop: 12 }}>
              <div className="form-group">
                <label>Child's Name *</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Emma" />
              </div>
              <div className="form-group">
                <label>Username *</label>
                <input value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="e.g. emma2015" />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 4 characters" />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label>Avatar <span style={{ fontWeight: 400, color: '#94a3b8' }}>— selected: {newAvatar}</span></label>
              <EmojiPicker emojis={KID_AVATARS} value={newAvatar} onChange={setNewAvatar} />
            </div>
            <button type="submit" className="btn btn-green" disabled={adding}>
              {adding ? 'Adding...' : 'Add Child'}
            </button>
          </form>
        )}
      </div>

      {/* Kids table */}
      {kids.length === 0 ? (
        <div className="empty-text">No children added yet. Use "+ Add Child" above to get started.</div>
      ) : (
        <table className="kids-table">
          <thead>
            <tr>
              <th style={{ width: 52 }}></th>
              <th>Name</th>
              <th>Username</th>
              <th>Balance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {kids.map(kid => (
              <>
                <tr key={kid.id}>
                  <td style={{ textAlign: 'center' }}>
                    <span className="kid-avatar">{kid.avatar || '🐶'}</span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{kid.name}</td>
                  <td style={{ color: '#64748b' }}>{kid.username}</td>
                  <td>
                    <span className="balance-chip" style={{ cursor: 'pointer' }} onClick={() => setSelectedKid(kid)}>
                      {getBalance(kid.id)} pts 👁
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => { setChangingPwdFor(changingPwdFor === kid.id ? null : kid.id); setNewPwd(''); setPwdError('') }}
                    >
                      {changingPwdFor === kid.id ? 'Cancel' : '🔑 Change Password'}
                    </button>
                  </td>
                </tr>
                {changingPwdFor === kid.id && (
                  <tr key={`${kid.id}-pwd`}>
                    <td colSpan={5} style={{ background: '#f8fafc', padding: '12px 16px' }}>
                      {pwdError && <div className="error-msg" style={{ marginBottom: 8 }}>{pwdError}</div>}
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <input
                          type="password"
                          value={newPwd}
                          onChange={e => setNewPwd(e.target.value)}
                          placeholder="New password (min 4 chars)"
                          style={{ padding: '7px 12px', border: '1px solid #cbd5e1', borderRadius: 7, fontSize: '0.9rem', width: 240 }}
                        />
                        <button className="btn btn-green btn-sm" onClick={() => handleChangePassword(kid)} disabled={savingPwd}>
                          {savingPwd ? 'Saving...' : 'Save Password'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      )}

      {selectedKid && (
        <KidWalletModal kid={selectedKid} onClose={() => setSelectedKid(null)} />
      )}
    </div>
  )
}

// ─── Parent Dashboard Shell ──────────────────────────────────────────────────

export default function ParentDashboard() {
  const { user, logout } = useAuth()
  const [tab, setTab] = useState('chores')
  const [kids, setKids] = useState([])

  useEffect(() => {
    api.getKids()
      .then(data => setKids(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  return (
    <div className="app-container">
      <nav className="navbar parent">
        <div className="navbar-brand">🛒 ParentShopee</div>
        <div className="navbar-user">
          <span>Hi, {user.name}!</span>
          <button className="logout-btn" onClick={logout}>Sign Out</button>
        </div>
      </nav>

      <div className="main-content">
        <div className="tabs">
          {['chores', 'shop', 'kids', 'co-parent'].map(t => (
            <button
              key={t}
              className={`tab-btn${tab === t ? ' active parent' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'chores' ? 'Chores' : t === 'shop' ? 'Shop' : t === 'kids' ? 'Kids' : 'Co-Parent'}
            </button>
          ))}
        </div>

        {tab === 'chores' && <ChoresTab kids={kids} />}
        {tab === 'shop' && <ShopTab />}
        {tab === 'kids' && <KidsTab />}
        {tab === 'co-parent' && <CoParentTab />}
      </div>
    </div>
  )
}
