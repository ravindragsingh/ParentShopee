import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api.js'
import { ParentChoreCard, EmojiPicker, CHORE_EMOJIS, KID_AVATARS } from './ChoreCard.jsx'
import { ParentShopItem } from './ShopItem.jsx'
import { KidWalletModal } from './WalletView.jsx'
import MessagesTab from './Messages.jsx'
import { HelpTab } from './Help.jsx'
import HamburgerMenu from './HamburgerMenu.jsx'
import SettingsPanel from './Settings.jsx'
import { checkFields } from '../utils/wordFilter.js'
import ContactUs from './ContactUs.jsx'

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

// ─── Collapsible section header ──────────────────────────────────────────────

function CollapsibleSection({ icon, title, count, colorClass, defaultOpen = false, emptyText, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <div style={{ marginTop: 8 }}>
      <div
        role="button"
        tabIndex={0}
        className={`section-header ${colorClass}`}
        onClick={() => setIsOpen(v => !v)}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setIsOpen(v => !v)}
        style={{ display: 'flex', width: '100%', cursor: 'pointer', userSelect: 'none', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' }}
      >
        <span>{icon} {title}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: 'rgba(0,0,0,0.12)', borderRadius: 10, padding: '1px 8px', fontSize: '0.8rem', fontWeight: 700 }}>
            {count}
          </span>
          <span style={{ fontSize: '0.75rem', opacity: 0.65 }}>{isOpen ? '▲' : '▼'}</span>
        </span>
      </div>
      {isOpen && (
        count === 0
          ? <div className="empty-text">{emptyText}</div>
          : <div className="chore-grid">{children}</div>
      )}
    </div>
  )
}

// ─── Chores Tab ─────────────────────────────────────────────────────────────

function ChoresTab({ kids }) {
  const [chores, setChores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Add chore form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [points, setPoints] = useState('')
  const [assignedKidIds, setAssignedKidIds] = useState(new Set())
  const [dueDate, setDueDate] = useState('')
  const [choreEmoji, setChoreEmoji] = useState('📋')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [addChoreOpen, setAddChoreOpen] = useState(false)
  const [limits, setLimits] = useState(null)
  const formRef = useRef(null)

  const loadLimits = useCallback(async () => {
    try {
      const data = await api.getLimits()
      setLimits(data)
    } catch (e) {}
  }, [])

  useEffect(() => { loadLimits() }, [loadLimits])
  const choresAtLimit = limits && limits.choresUsed >= limits.choresLimit

  // Recurring chore state
  const [recurring, setRecurring] = useState(false)
  const [recurrenceType, setRecurrenceType] = useState('daily')
  const [recurrenceDays, setRecurrenceDays] = useState(new Set())
  const [recurrenceDom, setRecurrenceDom] = useState(1)

  // Recurring templates list
  const [recurringTemplates, setRecurringTemplates] = useState([])

  const loadRecurring = useCallback(async () => {
    try {
      const data = await api.getRecurring()
      setRecurringTemplates(Array.isArray(data) ? data : [])
    } catch (e) {}
  }, [])

  useEffect(() => { loadRecurring() }, [loadRecurring])

  function fillFromSample(sample) {
    setTitle(sample.title)
    setDescription(sample.description)
    setPoints(String(sample.points))
    setChoreEmoji(sample.imageEmoji)
    setAssignedKidIds(new Set())
    setShowEmojiPicker(false)
    setAddError('')
    setRecurring(false)
    setRecurrenceType('daily')
    setRecurrenceDays(new Set())
    setRecurrenceDom(1)
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

  function resetForm() {
    setTitle(''); setDescription(''); setPoints(''); setAssignedKidIds(new Set())
    setDueDate(''); setChoreEmoji('📋'); setShowEmojiPicker(false)
    setRecurring(false); setRecurrenceType('daily'); setRecurrenceDays(new Set()); setRecurrenceDom(1)
  }

  async function handleAddChore(e) {
    e.preventDefault()
    if (!title.trim() || !points) {
      setAddError('Title and points are required.')
      return
    }
    const wordCheck = checkFields(title, description)
    if (!wordCheck.ok) {
      setAddError(wordCheck.message)
      return
    }
    if (recurring && recurrenceType === 'weekly' && recurrenceDays.size === 0) {
      setAddError('Select at least one day for weekly recurring chores.')
      return
    }
    setAdding(true)
    setAddError('')
    try {
      if (recurring) {
        const kidId = assignedKidIds.size >= 1 ? [...assignedKidIds][0] : null
        await api.createRecurring({
          title: title.trim(),
          description: description.trim(),
          points: Number(points),
          imageEmoji: choreEmoji,
          assignedKidId: kidId,
          recurrenceType,
          recurrenceDays: recurrenceType === 'weekly' ? [...recurrenceDays] : [],
          recurrenceDom: recurrenceType === 'monthly' ? recurrenceDom : null,
        })
        loadRecurring()
      } else {
        await api.createChore({
          title: title.trim(),
          description: description.trim(),
          points: Number(points),
          assignedKidIds: [...assignedKidIds],
          dueDate: dueDate || null,
          imageEmoji: choreEmoji,
        })
      }
      resetForm()
      loadChores()
      loadLimits()
    } catch (err) {
      setAddError(err.message)
    } finally {
      setAdding(false)
    }
  }

  // Kid filter
  const [filterKidId, setFilterKidId] = useState('')

  // Recurring section expand state
  const [recurringExpanded, setRecurringExpanded] = useState(false)

  function filterByKid(list) {
    if (!filterKidId) return list
    return list.filter(c =>
      c.assignedKidId === filterKidId ||
      c.completedByKidId === filterKidId
    )
  }

  const open     = filterByKid(chores.filter(c => c.status === 'open'))
  const pending  = filterByKid(chores.filter(c => c.status === 'pending'))
  const complete = filterByKid(chores.filter(c => c.status === 'complete'))
  const expired  = filterByKid(chores.filter(c => c.status === 'expired'))

  return (
    <div>
      {/* Kid filter strip — only shown when there are 2+ kids */}
      {kids.length > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => setFilterKidId('')}
            style={{
              padding: '5px 14px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
              border: `1.5px solid ${!filterKidId ? '#0d9488' : '#e2e8f0'}`,
              background: !filterKidId ? '#f0fdfa' : '#fff',
              color: !filterKidId ? '#0d9488' : '#64748b',
              transition: 'all 0.15s',
            }}
          >
            All kids
          </button>
          {kids.map(kid => (
            <button
              key={kid.id}
              onClick={() => setFilterKidId(kid.id === filterKidId ? '' : kid.id)}
              style={{
                padding: '5px 14px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                border: `1.5px solid ${filterKidId === kid.id ? '#0d9488' : '#e2e8f0'}`,
                background: filterKidId === kid.id ? '#f0fdfa' : '#fff',
                color: filterKidId === kid.id ? '#0d9488' : '#64748b',
                transition: 'all 0.15s',
              }}
            >
              {kid.avatar} {kid.name}
            </button>
          ))}
        </div>
      )}

      {loading && <div className="loading-text">Loading chores...</div>}
      {error && <div className="error-msg">{error}</div>}

      {/* Pending Approval — shown first so parents see what needs action */}
      {!loading && (
        <CollapsibleSection icon="⏳" title="Pending Approval" count={pending.length} colorClass="pending" defaultOpen emptyText="No chores awaiting approval.">
          {pending.map(chore => <ParentChoreCard key={chore.id} chore={chore} kids={kids} onRefresh={loadChores} />)}
        </CollapsibleSection>
      )}

      {/* Add Chore Form — minimized by default */}
      <div className="form-card" ref={formRef}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setAddChoreOpen(v => !v)}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setAddChoreOpen(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', userSelect: 'none',
            marginBottom: addChoreOpen ? 16 : 0,
          }}
        >
          <span className="form-title" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            ➕ Add New Chore
            {limits && (
              <span style={{
                fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                background: choresAtLimit ? '#fee2e2' : '#f0fdfa',
                color: choresAtLimit ? '#dc2626' : '#0d9488',
              }}>
                {limits.choresUsed}/{limits.choresLimit} custom used
              </span>
            )}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{addChoreOpen ? '▲' : '▼'}</span>
        </div>
        {addChoreOpen && (
        <>
        {addError && <div className="error-msg">{addError}</div>}
        {choresAtLimit && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 14px', marginBottom: 14, color: '#92400e', fontSize: '0.82rem', lineHeight: 1.6 }}>
            You've used all {limits.choresLimit} custom chore slots for your family. You can still add as many chores
            as you like by picking one from "Start from a template" below without changing its title. For more
            custom chores, contact support at <strong>{limits.supportEmail}</strong>.
          </div>
        )}
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
            <div className="form-group" style={{ flex: '100%' }}>
              <label>Assign To <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '0.8rem' }}>(optional — select one or more)</span></label>
              {kids.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 4 }}>No children added yet</div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                  {kids.map(k => {
                    const checked = assignedKidIds.has(k.id)
                    return (
                      <div
                        key={k.id}
                        role="checkbox"
                        aria-checked={checked}
                        tabIndex={0}
                        onClick={() => setAssignedKidIds(prev => {
                          const next = new Set(prev)
                          next.has(k.id) ? next.delete(k.id) : next.add(k.id)
                          return next
                        })}
                        onKeyDown={e => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault()
                            setAssignedKidIds(prev => {
                              const next = new Set(prev)
                              next.has(k.id) ? next.delete(k.id) : next.add(k.id)
                              return next
                            })
                          }
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          cursor: 'pointer', userSelect: 'none',
                          padding: '7px 14px', borderRadius: 999,
                          background: checked ? '#f0fdfa' : '#f8fafc',
                          border: `2px solid ${checked ? '#2dd4bf' : '#e2e8f0'}`,
                          fontSize: '0.875rem',
                          fontWeight: checked ? 700 : 400,
                          color: checked ? '#0f766e' : '#475569',
                          transition: 'all 0.15s',
                        }}
                      >
                        <span>{k.avatar || '🐶'}</span>
                        {k.name}
                        {checked && <span style={{ fontSize: '0.75rem' }}>✓</span>}
                      </div>
                    )
                  })}
                </div>
              )}
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 6 }}>
                {assignedKidIds.size === 0
                  ? 'No one selected — any child can claim it'
                  : assignedKidIds.size === 1
                  ? '1 child selected'
                  : `${assignedKidIds.size} children selected — one copy per child will be created`}
              </div>
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
            {!recurring && (
              <div className="form-group" style={{ flex: 1, minWidth: '160px', maxWidth: '200px' }}>
                <label>Due Date (optional)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Recurring toggle */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={recurring}
                onChange={e => setRecurring(e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>🔁 Make this a recurring chore</span>
            </label>
          </div>

          {recurring && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: 8 }}>Repeat frequency</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {['daily', 'weekly', 'monthly'].map(rt => (
                  <button
                    key={rt}
                    type="button"
                    className={`btn btn-sm ${recurrenceType === rt ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setRecurrenceType(rt)}
                  >
                    {rt === 'daily' ? 'Daily' : rt === 'weekly' ? 'Weekly' : 'Monthly'}
                  </button>
                ))}
              </div>

              {recurrenceType === 'weekly' && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 6 }}>Select days:</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, i) => {
                      const checked = recurrenceDays.has(i)
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setRecurrenceDays(prev => {
                            const next = new Set(prev)
                            next.has(i) ? next.delete(i) : next.add(i)
                            return next
                          })}
                          style={{
                            padding: '4px 10px', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer',
                            background: checked ? '#0d9488' : '#fff',
                            color: checked ? '#fff' : '#475569',
                            border: `1px solid ${checked ? '#0d9488' : '#e2e8f0'}`,
                            fontWeight: checked ? 700 : 400,
                          }}
                        >
                          {day}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {recurrenceType === 'monthly' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Day of month:</label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={recurrenceDom}
                    onChange={e => setRecurrenceDom(Number(e.target.value))}
                    style={{ width: 64, padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.85rem' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Use 1–28 so it works every month</span>
                </div>
              )}

              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 8 }}>
                Chore instances will be auto-created for upcoming dates. Due dates are managed automatically.
                {assignedKidIds.size > 1 && ' With recurring chores, only the first selected kid will be assigned.'}
              </div>
            </div>
          )}

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
        </>
        )}
      </div>

      {/* Remaining chore lists */}
      {!loading && (
        <>
          <CollapsibleSection icon="✨" title="Open" count={open.length} colorClass="open" defaultOpen emptyText="No open chores.">
            {open.map(chore => <ParentChoreCard key={chore.id} chore={chore} kids={kids} onRefresh={loadChores} />)}
          </CollapsibleSection>

          <CollapsibleSection icon="🏆" title="Complete" count={complete.length} colorClass="complete" emptyText="No completed chores yet.">
            {complete.map(chore => <ParentChoreCard key={chore.id} chore={chore} kids={kids} onRefresh={loadChores} />)}
          </CollapsibleSection>

          <CollapsibleSection icon="⌛" title="Expired" count={expired.length} colorClass="expired" emptyText="No expired chores.">
            {expired.map(chore => <ParentChoreCard key={chore.id} chore={chore} kids={kids} onRefresh={loadChores} />)}
          </CollapsibleSection>
        </>
      )}

      {/* Recurring templates */}
      {recurringTemplates.length > 0 && (
        <div style={{ marginTop: 24, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px' }}>
          <div
            role="button"
            onClick={() => setRecurringExpanded(v => !v)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none', marginBottom: recurringExpanded ? 10 : 0 }}
          >
            <span style={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem' }}>
              🔁 Active Recurring Chores
              <span style={{ marginLeft: 6, fontSize: '0.8rem', color: '#94a3b8', fontWeight: 400 }}>({recurringTemplates.length})</span>
            </span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{recurringExpanded ? '▲' : '▼'}</span>
          </div>
          {recurringExpanded && recurringTemplates.map(t => {
            const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
            const scheduleText = t.recurrenceType === 'daily'
              ? 'Every day'
              : t.recurrenceType === 'weekly'
              ? `Every ${t.recurrenceDays.map(d => DAY_LABELS[d]).join(', ')}`
              : `Monthly on day ${t.recurrenceDom}`
            const assignedKid = kids.find(k => k.id === t.assignedKidId)
            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{t.imageEmoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1e293b' }}>{t.title}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {scheduleText} · {t.points} pts
                    {assignedKid && <> · {assignedKid.avatar} {assignedKid.name}</>}
                  </div>
                </div>
                <button
                  className="btn btn-red btn-sm"
                  onClick={async () => {
                    if (!window.confirm(`Stop "${t.title}" recurring? Future open instances will be removed.`)) return
                    try {
                      await api.deleteRecurring(t.id)
                      loadRecurring()
                      loadChores()
                    } catch (err) { alert(err.message) }
                  }}
                >
                  Stop
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Sample shop item templates ───────────────────────────────────────────────

const SAMPLE_SHOP_ITEMS = [
  // ── Screen & tech ──────────────────────────────────────────────────────────
  { name: 'Extra Screen Time (30 min)',  cost: 10, imageEmoji: '📱', description: 'Get 30 extra minutes of screen time today.' },
  { name: 'Extra Screen Time (1 hour)', cost: 18, imageEmoji: '💻', description: 'Get 1 hour of extra screen time today.' },
  { name: 'Video Game Session',          cost: 15, imageEmoji: '🎮', description: 'Play video games for an extra session.' },
  { name: 'Download a New App or Game', cost: 25, imageEmoji: '📲', description: 'Choose one new app or game to download.' },
  { name: 'YouTube / Streaming Hour',   cost: 12, imageEmoji: '▶️', description: 'Watch one hour of YouTube or streaming.' },
  // ── Food & treats ──────────────────────────────────────────────────────────
  { name: 'Choose Dinner Tonight',       cost: 25, imageEmoji: '🍕', description: 'Pick what the whole family eats for dinner.' },
  { name: 'Dessert of Your Choice',      cost: 10, imageEmoji: '🍦', description: 'Pick any dessert after dinner.' },
  { name: 'Ice Cream Trip',              cost: 20, imageEmoji: '🍧', description: 'A trip to the ice cream shop to pick your flavour.' },
  { name: 'Skip Vegetables at Dinner',  cost: 15, imageEmoji: '🥦', description: 'One free pass to skip vegetables at a meal.' },
  { name: 'Breakfast in Bed',            cost: 20, imageEmoji: '🥞', description: 'Wake up to breakfast brought to your room.' },
  // ── Bedtime & routine ──────────────────────────────────────────────────────
  { name: 'Stay Up 30 Minutes Later',   cost: 12, imageEmoji: '🌙', description: 'Extend bedtime by 30 minutes on any night.' },
  { name: 'Stay Up 1 Hour Later',        cost: 20, imageEmoji: '⭐', description: 'Extend bedtime by one hour on a weekend.' },
  { name: 'Skip One Chore (one-time)',   cost: 20, imageEmoji: '🙈', description: 'Get out of one chore free — one time only!' },
  // ── Fun & activities ───────────────────────────────────────────────────────
  { name: 'Movie Night Pick',            cost: 15, imageEmoji: '🎬', description: 'Choose the movie for family movie night.' },
  { name: 'Friend Can Come Over',        cost: 25, imageEmoji: '👫', description: 'Invite a friend over for a playdate.' },
  { name: 'Sleepover with a Friend',     cost: 40, imageEmoji: '🛌', description: 'Have a friend sleep over on a weekend.' },
  { name: 'Trip to the Park',            cost: 15, imageEmoji: '🌳', description: 'A special trip to your favourite park or playground.' },
  { name: 'Bowling / Mini Golf Trip',    cost: 50, imageEmoji: '🎳', description: 'A fun outing to bowling or mini golf.' },
  { name: 'Choose Weekend Activity',     cost: 30, imageEmoji: '🏄', description: 'Pick the family activity for one weekend.' },
  // ── Rewards & extras ───────────────────────────────────────────────────────
  { name: 'New Book of Your Choice',     cost: 20, imageEmoji: '📖', description: 'Pick any one book to add to your collection.' },
  { name: 'New Toy or Small Gift',       cost: 60, imageEmoji: '🎁', description: 'Choose a small toy or gift up to an agreed amount.' },
  { name: 'Extra Pocket Money',          cost: 30, imageEmoji: '💰', description: 'Earn a small bonus in real pocket money.' },
  { name: 'No Chores Day',               cost: 50, imageEmoji: '🏖️', description: 'A full day off from all chores.' },
]

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
  const [sortOrder, setSortOrder] = useState('')  // '' | 'asc' | 'desc'
  const [limits, setLimits] = useState(null)

  const loadLimits = useCallback(async () => {
    try {
      const data = await api.getLimits()
      setLimits(data)
    } catch (e) {}
  }, [])

  useEffect(() => { loadLimits() }, [loadLimits])
  const shopAtLimit = limits && limits.shopItemsUsed >= limits.shopItemsLimit

  function fillShopFromSample(sample) {
    setName(sample.name)
    setDescription(sample.description)
    setCost(String(sample.cost))
    setEmoji(sample.imageEmoji)
    setAddError('')
  }

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
    const wordCheck = checkFields(name, description)
    if (!wordCheck.ok) {
      setAddError(wordCheck.message)
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
      loadLimits()
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
        <div className="form-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          Add Shop Item
          {limits && (
            <span style={{
              fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999,
              background: shopAtLimit ? '#fee2e2' : '#f0fdfa',
              color: shopAtLimit ? '#dc2626' : '#0d9488',
            }}>
              {limits.shopItemsUsed}/{limits.shopItemsLimit} custom used
            </span>
          )}
        </div>
        {addError && <div className="error-msg">{addError}</div>}
        {shopAtLimit && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 14px', marginBottom: 14, color: '#92400e', fontSize: '0.82rem', lineHeight: 1.6 }}>
            You've used all {limits.shopItemsLimit} custom shop item slots for your family. You can still add as many
            items as you like by picking one from "Start from a template" below without changing its name. For more
            custom items, contact support at <strong>{limits.supportEmail}</strong>.
          </div>
        )}
        <form onSubmit={handleAddItem}>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label>Start from a template <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '0.8rem' }}>(optional)</span></label>
            <select
              value=""
              onChange={e => {
                const s = SAMPLE_SHOP_ITEMS.find(i => i.name === e.target.value)
                if (s) fillShopFromSample(s)
              }}
            >
              <option value="">— Pick a sample reward to pre-fill the form —</option>
              {SAMPLE_SHOP_ITEMS.map(s => (
                <option key={s.name} value={s.name}>
                  {s.imageEmoji} {s.name} ({s.cost} pts)
                </option>
              ))}
            </select>
          </div>
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
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Sort by points:</span>
            <button
              className={`btn btn-sm ${sortOrder === 'asc' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setSortOrder(v => v === 'asc' ? '' : 'asc')}
            >↑ Low → High</button>
            <button
              className={`btn btn-sm ${sortOrder === 'desc' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setSortOrder(v => v === 'desc' ? '' : 'desc')}
            >↓ High → Low</button>
          </div>
          <div className="shop-grid">
            {[...items]
              .sort((a, b) => sortOrder === 'asc' ? a.cost - b.cost : sortOrder === 'desc' ? b.cost - a.cost : 0)
              .map(item => (
                <ParentShopItem key={item.id} item={item} onRefresh={loadItems} />
              ))}
          </div>
        </>
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
      <div className="form-card" style={{ borderLeft: '4px solid #0d9488' }}>
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
              background: 'linear-gradient(135deg,#0f766e,#0d9488)',
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

  // View transactions inline
  const [viewingTxFor, setViewingTxFor] = useState(null)
  const [txData, setTxData] = useState(null)
  const [txLoading, setTxLoading] = useState(false)
  const [txError, setTxError] = useState('')

  // Good behaviour
  const [behaviourFor, setBehaviourFor] = useState(null)
  const [behaviourPts, setBehaviourPts] = useState('')
  const [behaviourLoading, setBehaviourLoading] = useState(false)
  const [behaviourError, setBehaviourError] = useState('')
  const [behaviourSuccess, setBehaviourSuccess] = useState('')

  async function loadKidTx(kidId) {
    setTxLoading(true); setTxError(''); setTxData(null)
    try {
      const data = await api.getWallet(kidId)
      setTxData(data)
    } catch (err) {
      setTxError(err.message)
    } finally {
      setTxLoading(false)
    }
  }

  function toggleTransactions(kid) {
    if (viewingTxFor === kid.id) {
      setViewingTxFor(null)
    } else {
      setViewingTxFor(kid.id)
      setChangingPwdFor(null); setBehaviourFor(null)
      loadKidTx(kid.id)
    }
  }

  async function handleBehaviour(kid, sign) {
    setBehaviourError('')
    setBehaviourSuccess('')
    const pts = Number(behaviourPts)
    if (!pts || isNaN(pts) || pts <= 0) { setBehaviourError('Enter a positive number of points.'); return }
    const signedPts = sign * pts
    if (sign < 0 && getBalance(kid.id) + signedPts < 0) {
      setBehaviourError(`Cannot remove more than current balance (${getBalance(kid.id)} pts).`)
      return
    }
    setBehaviourLoading(true)
    try {
      const res = await api.awardBehaviour(kid.id, signedPts)
      const label = sign > 0 ? 'awarded to' : 'removed from'
      setBehaviourSuccess(`${pts} pts ${label} ${res.kidName}. New balance: ${res.newBalance} pts`)
      setBehaviourPts('')
      loadData()
    } catch (err) {
      setBehaviourError(err.message)
    } finally {
      setBehaviourLoading(false)
    }
  }

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
                <tr key={kid.id} style={{ cursor: 'pointer' }} onClick={() => toggleTransactions(kid)}>
                  <td style={{ textAlign: 'center' }}>
                    <span className="kid-avatar">{kid.avatar || '🐶'}</span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{kid.name}</td>
                  <td style={{ color: '#64748b' }}>{kid.username}</td>
                  <td>
                    <span className="balance-chip" style={{ cursor: 'pointer' }} onClick={e => { e.stopPropagation(); setSelectedKid(kid) }}>
                      {getBalance(kid.id)} pts 👁
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        setChangingPwdFor(changingPwdFor === kid.id ? null : kid.id)
                        setViewingTxFor(null); setBehaviourFor(null); setNewPwd(''); setPwdError('')
                      }}
                    >
                      {changingPwdFor === kid.id ? 'Cancel' : '🔑 Password'}
                    </button>
                    <button
                      className={`btn btn-sm ${behaviourFor === kid.id ? 'btn-outline' : ''}`}
                      style={behaviourFor === kid.id ? {} : { background: 'linear-gradient(135deg,#f59e0b,#f97316)', border: 'none', color: '#fff' }}
                      onClick={() => {
                        setBehaviourFor(behaviourFor === kid.id ? null : kid.id)
                        setChangingPwdFor(null); setViewingTxFor(null)
                        setBehaviourPts(''); setBehaviourError(''); setBehaviourSuccess('')
                      }}
                    >
                      {behaviourFor === kid.id ? 'Cancel' : '🌟 Behaviour'}
                    </button>
                    <button
                      className={`btn btn-sm ${viewingTxFor === kid.id ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => toggleTransactions(kid)}
                    >
                      {viewingTxFor === kid.id ? '📋 Hide' : '📋 Transactions'}
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
                {behaviourFor === kid.id && (() => {
                  const currentBal = getBalance(kid.id)
                  const pts = Number(behaviourPts)
                  const validPts = !isNaN(pts) && pts > 0
                  return (
                    <tr key={`${kid.id}-behaviour`}>
                      <td colSpan={5} style={{ background: '#fffbf0', padding: '14px 16px', borderTop: '2px solid #fde68a' }}>
                        <div style={{ fontWeight: 600, color: '#92400e', marginBottom: 10, fontSize: '0.9rem' }}>
                          🌟 Good Behaviour — {kid.name}
                        </div>
                        {behaviourError && <div className="error-msg" style={{ marginBottom: 8 }}>{behaviourError}</div>}
                        {behaviourSuccess && <div style={{ color: '#059669', fontSize: '0.85rem', marginBottom: 8 }}>{behaviourSuccess}</div>}
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 10 }}>
                          Current balance: <strong>{currentBal} pts</strong>
                        </div>
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 5 }}>Quick select:</div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {[5, 10, 15, 20, 50].map(n => (
                              <button
                                key={n}
                                className="btn btn-sm"
                                style={{
                                  background: behaviourPts === String(n) ? '#f59e0b' : '#fef3c7',
                                  color: behaviourPts === String(n) ? '#fff' : '#92400e',
                                  border: '1px solid #fde68a', fontWeight: 600,
                                }}
                                onClick={() => setBehaviourPts(String(n))}
                              >
                                {n} pts
                              </button>
                            ))}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                          <input
                            type="number"
                            min="1"
                            value={behaviourPts}
                            onChange={e => setBehaviourPts(e.target.value)}
                            placeholder="Custom pts"
                            style={{ padding: '7px 12px', border: '1px solid #fbbf24', borderRadius: 7, fontSize: '0.9rem', width: 120 }}
                          />
                          <button
                            className="btn btn-sm btn-green"
                            onClick={() => handleBehaviour(kid, 1)}
                            disabled={behaviourLoading || !validPts}
                          >
                            {behaviourLoading ? 'Saving...' : '🌟 Award Good Behaviour'}
                          </button>
                          <button
                            className="btn btn-sm"
                            style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}
                            onClick={() => handleBehaviour(kid, -1)}
                            disabled={behaviourLoading || !validPts || currentBal < pts}
                          >
                            {behaviourLoading ? 'Saving...' : '❌ Remove Points'}
                          </button>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 8 }}>
                          Recorded as "Bonus received for good behaviour" in {kid.name}'s wallet.
                        </div>
                      </td>
                    </tr>
                  )
                })()}
                {viewingTxFor === kid.id && (
                  <tr key={`${kid.id}-tx`}>
                    <td colSpan={5} style={{ background: '#f0f9ff', padding: '14px 16px', borderTop: '2px solid #bae6fd' }}>
                      <div style={{ fontWeight: 600, color: '#0369a1', marginBottom: 10, fontSize: '0.9rem' }}>
                        📋 Last 15 Transactions — {kid.name}
                      </div>
                      {txLoading && <div className="loading-text" style={{ fontSize: '0.85rem' }}>Loading...</div>}
                      {txError && <div className="error-msg">{txError}</div>}
                      {txData && (
                        !txData.transactions || txData.transactions.length === 0 ? (
                          <div className="empty-text" style={{ fontSize: '0.85rem' }}>No transactions yet.</div>
                        ) : (
                          <>
                            <div className="transaction-list" style={{ maxHeight: 300, overflowY: 'auto' }}>
                              {[...txData.transactions]
                                .sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt))
                                .slice(0, 15)
                                .map((tx, i) => {
                                  const isBonus           = tx.type === 'bonus'
                                  const isDeduct          = tx.type === 'deduct'
                                  const isBehaviour       = tx.type === 'behaviour'
                                  const isBehaviourDeduct = tx.type === 'behaviour_deduct'
                                  const isAnyAdd          = isBonus || isBehaviour
                                  const isAnyDeduct       = isDeduct || isBehaviourDeduct
                                  const isEarned          = tx.type === 'earned' || (!isAnyAdd && !isAnyDeduct && tx.amount > 0)
                                  const icon = isBonus ? '⭐ +' : isBehaviour ? '🌟 +' : isAnyDeduct ? '− ' : isEarned ? '+' : ''
                                  return (
                                    <div key={tx.id || i} className={`transaction-item${isAnyAdd ? ' bonus-tx' : isAnyDeduct ? ' deduct-tx' : ''}`} style={{ fontSize: '0.85rem' }}>
                                      <div>
                                        <div className="tx-desc">{tx.description || (isEarned ? 'Chore completed' : isAnyDeduct ? 'Points adjusted' : 'Purchase')}</div>
                                        <div className="tx-time">{new Date(tx.timestamp || tx.createdAt).toLocaleString()}</div>
                                      </div>
                                      <div className={`tx-amount ${isAnyAdd ? 'bonus' : isAnyDeduct ? 'deduct' : isEarned ? 'earned' : 'spent'}`} style={{ fontSize: '0.9rem' }}>
                                        {icon}{tx.amount} pts
                                      </div>
                                    </div>
                                  )
                                })}
                            </div>
                            {txData.transactions.length > 15 && (
                              <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', marginTop: 6 }}>
                                Showing 15 most recent of {txData.transactions.length} transactions
              </div>
                            )}
                          </>
                        )
                      )}
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
  const [wallets, setWallets] = useState([])

  function getKidBalance(kidId) {
    const w = wallets.find(w => w.kidId === kidId)
    return w ? w.balance : 0
  }

  function refreshWallets() {
    api.getAllWallets()
      .then(data => setWallets(Array.isArray(data) ? data : []))
      .catch(() => {})
  }

  useEffect(() => {
    api.getKids()
      .then(data => setKids(Array.isArray(data) ? data : []))
      .catch(() => {})
    refreshWallets()
  }, [])

  return (
    <div className="app-container">
      <nav className="navbar parent">
        <div className="navbar-brand">🏆 Reward Ur Kids</div>
        <div className="navbar-user">
          <span>Hi, {user.name}!</span>
          <button className="logout-btn" onClick={logout}>Sign Out</button>
        </div>
      </nav>

      <div className="main-content">
        <div className="tabs">
          {['chores', 'shop', 'kids'].map(t => (
            <button
              key={t}
              className={`tab-btn${tab === t ? ' active parent' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'chores' ? 'Chores' : t === 'shop' ? 'Shop' : 'Kids'}
            </button>
          ))}
          <HamburgerMenu tab={tab} setTab={setTab} role="parent" />
        </div>

        {kids.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14, padding: '10px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginRight: 2 }}>⭐ Points:</span>
            {kids.map(kid => (
              <span key={kid.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: '4px 12px', fontSize: '0.82rem' }}>
                <span>{kid.avatar || '🐶'}</span>
                <span style={{ color: '#334155' }}>{kid.name}</span>
                <strong style={{ color: '#0d9488' }}>{getKidBalance(kid.id)} pts</strong>
              </span>
            ))}
            <button
              onClick={refreshWallets}
              title="Refresh balances"
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.8rem', padding: '2px 6px' }}
            >
              ↻
            </button>
          </div>
        )}

        {kids.length === 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #f0fdfa, #f0fdf4)',
            border: '1px solid #99f6e4',
            borderRadius: 12,
            padding: '16px 20px',
            marginBottom: 16,
            display: 'flex',
            gap: 14,
            alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>👑</span>
            <div>
              <div style={{ fontWeight: 700, color: '#1e40af', fontSize: '0.95rem', marginBottom: 4 }}>
                You are the Family Admin
              </div>
              <div style={{ color: '#334155', fontSize: '0.875rem', lineHeight: 1.5 }}>
                Welcome to Reward Ur Kids! To get started, head to the{' '}
                <button
                  onClick={() => setTab('kids')}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
                >
                  Kids
                </button>{' '}
                tab to add your children, and the{' '}
                <button
                  onClick={() => setTab('co-parent')}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
                >
                  Co-Parent
                </button>{' '}
                tab to invite a co-parent. Only you (the family admin) can manage family members.
              </div>
            </div>
          </div>
        )}

        {tab === 'chores'    && <ChoresTab kids={kids} />}
        {tab === 'shop'      && <ShopTab />}
        {tab === 'kids'      && <KidsTab />}
        {tab === 'co-parent' && <CoParentTab />}
        {tab === 'messages'  && <MessagesTab />}
        {tab === 'help'      && <HelpTab role="parent" />}
        {tab === 'contact'   && <ContactUs />}
        {tab === 'settings'  && <SettingsPanel />}
      </div>
    </div>
  )
}
