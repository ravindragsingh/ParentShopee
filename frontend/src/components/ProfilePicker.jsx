import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api.js'
import { EmojiPicker, KID_AVATARS } from './ChoreCard.jsx'
import { checkPinComplexity, PIN_REQUIREMENTS_HINT } from '../utils/pinValidator.js'
import { DEMO_PROFILE_PINS } from '../utils/demoAccount.js'
import PasswordField from './PasswordField.jsx'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const CURRENT_YEAR = new Date().getFullYear()
const BIRTH_YEAR_OPTIONS = Array.from({ length: 21 }, (_, i) => CURRENT_YEAR - i)
const COGUARDIAN_AVATARS = ['🧑', '👨', '👩', '🧔', '👱', '👨‍🦱', '👩‍🦱', '👨‍🦳', '👩‍🦳', '🧓']

function ProfileTile({ profile, busy, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        background: 'none', border: 'none', cursor: busy ? 'default' : 'pointer',
        padding: '10px 6px', width: 108, opacity: busy ? 0.6 : 1,
      }}
    >
      <div style={{
        position: 'relative', width: 76, height: 76, borderRadius: '50%',
        background: 'linear-gradient(135deg, #f0fdfa, #fff7ed)', border: '3px solid #f9a8d4',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.1rem',
        boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
      }}>
        {profile.avatar || (profile.role === 'kid' ? '🐶' : '🧑')}
        {profile.requiresPin && (
          <span style={{
            position: 'absolute', bottom: -2, right: -2, background: '#1e293b', color: '#fff',
            borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '0.75rem', border: '2px solid #fff',
          }}>🔒</span>
        )}
      </div>
      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b', textAlign: 'center' }}>{profile.name}</div>
    </button>
  )
}

// Shown in place of the easy-to-miss dashed "+" tile only while the family
// has no kids yet -- the single moment a brand-new guardian genuinely needs
// pointing at "add a child" / "invite a co-parent" rather than just quietly
// offered it. Disappears for good the moment the first kid profile exists.
function FirstFamilySetupCard({ hasCoGuardian, onAddKid, onAddCoGuardian }) {
  return (
    <div style={{
      background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 16,
      padding: '18px 20px', marginBottom: 18, textAlign: 'center',
    }}>
      <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>👪</div>
      <div style={{ fontWeight: 800, color: '#9a3412', fontSize: '1rem', marginBottom: 4 }}>
        Let's set up your family
      </div>
      <div style={{ fontSize: '0.85rem', color: '#78716c', marginBottom: 14 }}>
        Add your first child so they can start earning points, or invite your co-parent to help manage everything together.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={onAddKid}
          style={{ background: '#ea580c', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 16px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
        >
          🧒 Add Your First Child
        </button>
        {!hasCoGuardian && (
          <button
            onClick={onAddCoGuardian}
            style={{ background: '#fff', color: '#9a3412', border: '1.5px solid #fdba74', borderRadius: 10, padding: '11px 16px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
          >
            🧑 Invite Co-Parent
          </button>
        )}
      </div>
    </div>
  )
}

function AddProfileTile({ onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={disabled ? 'Limit reached' : 'Add a profile'}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        background: 'none', border: 'none', cursor: disabled ? 'default' : 'pointer',
        padding: '10px 6px', width: 108, opacity: disabled ? 0.4 : 1,
      }}
    >
      <div style={{
        width: 76, height: 76, borderRadius: '50%', background: '#f8fafc',
        border: '3px dashed #cbd5e1', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '2rem', color: '#94a3b8',
      }}>+</div>
      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#64748b' }}>Add Profile</div>
    </button>
  )
}

export default function ProfilePicker() {
  const { enterProfile, logout } = useAuth()
  const navigate = useNavigate()

  const [profiles, setProfiles] = useState(null)
  const [kidsCount, setKidsCount] = useState(0)
  const [hasCoGuardian, setHasCoGuardian] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [pinFor, setPinFor] = useState(null)      // profile id currently entering a PIN
  const [pinValue, setPinValue] = useState('')
  const [pinError, setPinError] = useState('')
  const [entering, setEntering] = useState(false)

  // Forgotten-PIN recovery — primary guardian's own profile only. Re-proving the
  // account password stands in for the PIN, then they choose a new one.
  const [recoverMode, setRecoverMode] = useState(false)
  const [recoverPassword, setRecoverPassword] = useState('')
  const [recoverNewPin, setRecoverNewPin] = useState('')
  const [recoverConfirmPin, setRecoverConfirmPin] = useState('')
  const [recoverError, setRecoverError] = useState('')

  const [addMode, setAddMode] = useState(null)    // null | 'choose' | 'kid' | 'coguardian'
  const [dismissedNotice, setDismissedNotice] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true); setError('')
    try {
      const data = await api.getFamilyProfiles()
      setProfiles(data.profiles)
      setKidsCount(data.kidsCount)
      setHasCoGuardian(data.hasCoGuardian)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleTileClick(profile) {
    // Every profile — including the guardian's own — is PIN-gated, so picking
    // any tile normally opens the PIN entry form; that's what makes "Switch
    // Profile" actually lock the device instead of leaving one profile open.
    // The public demo family is the one exception: a visitor exploring the
    // demo shouldn't need to know a PIN to look around as a different profile,
    // so known demo profiles auto-enter silently instead. profile.id is safe
    // to match directly -- these three seeded ids ("parent1"/"kid1"/"kid2")
    // can never belong to a real family, since every real account's id is a
    // freshly generated UUID, not a short literal string like this.
    if (DEMO_PROFILE_PINS[profile.id]) {
      setEntering(true)
      setError('')
      try {
        const data = await api.enterProfile(profile.id, DEMO_PROFILE_PINS[profile.id])
        enterProfile(data.user, data.token)
        navigate('/dashboard')
      } catch (err) {
        setError(err.message)
      } finally {
        setEntering(false)
      }
      return
    }

    setPinFor(profile.id)
    setPinValue('')
    setPinError('')
    setRecoverMode(false)
    setRecoverPassword('')
    setRecoverNewPin('')
    setRecoverConfirmPin('')
    setRecoverError('')
  }

  async function handlePinSubmit(e) {
    e.preventDefault()
    if (!/^\d{6}$/.test(pinValue)) {
      setPinError('Enter the 6-digit PIN.')
      return
    }
    setEntering(true); setPinError('')
    try {
      const data = await api.enterProfile(pinFor, pinValue)
      enterProfile(data.user, data.token)
      navigate('/dashboard')
    } catch (err) {
      setPinError(err.message)
      setPinValue('')
    } finally {
      setEntering(false)
    }
  }

  async function handleRecoverSubmit(e) {
    e.preventDefault()
    setRecoverError('')
    const pinCheck = checkPinComplexity(recoverNewPin)
    if (!pinCheck.ok) { setRecoverError(pinCheck.message); return }
    if (recoverNewPin !== recoverConfirmPin) { setRecoverError('PINs do not match.'); return }
    setEntering(true)
    try {
      const data = await api.recoverPin(recoverPassword, recoverNewPin)
      enterProfile(data.user, data.token)
      navigate('/dashboard')
    } catch (err) {
      setRecoverError(err.message)
    } finally {
      setEntering(false)
    }
  }

  function handleSignOut() {
    logout()
    navigate('/')
  }

  const needsSetup = (profiles || []).filter(p => p.needsPinSetup)
  // The primary guardian is always first in the list the backend returns.
  const familyName = profiles?.[0]?.name
  const primaryGuardianId = profiles?.[0]?.id

  return (
    <div className="login-wrapper">
      <div className="login-shell" style={{ maxWidth: 560 }}>
        <div className="brand-wordmark">
          <span className="brand-reward">Reward</span><span className="brand-ur">Ur</span><span className="brand-kids">Kids</span>
        </div>
        <p className="brand-tagline">Who's this for{familyName ? `, ${familyName}` : ''}?</p>

        <div className="login-card">
          {loading && <div className="loading-text">Loading profiles...</div>}
          {error && <div className="error-msg">{error}</div>}

          {!loading && !error && needsSetup.length > 0 && !dismissedNotice && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 16px', marginBottom: 18, fontSize: '0.85rem', color: '#92400e' }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>🔒 Your profile has its own PIN</div>
              <div style={{ marginBottom: 8 }}>
                Signing in gets you into your family's account — but since this device may be shared, each profile (including yours) is also locked behind its own 6-digit PIN. Here's your temporary one for now; change it anytime from the Admin Panel:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                {needsSetup.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', background: '#fff', borderRadius: 6, padding: '4px 10px' }}>
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                    <span style={{ fontFamily: 'monospace', letterSpacing: 2 }}>{p.tempPin}</span>
                  </div>
                ))}
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setDismissedNotice(true)}>Got it</button>
            </div>
          )}

          {!loading && !error && !addMode && (
            <>
              {kidsCount === 0 && (
                <FirstFamilySetupCard
                  hasCoGuardian={hasCoGuardian}
                  onAddKid={() => setAddMode('kid')}
                  onAddCoGuardian={() => setAddMode('coguardian')}
                />
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 4 }}>
                {profiles.map(p => (
                  <ProfileTile key={p.id} profile={p} busy={entering} onClick={() => handleTileClick(p)} />
                ))}
                {kidsCount > 0 && (
                  <AddProfileTile onClick={() => setAddMode('choose')} disabled={kidsCount >= 10 && hasCoGuardian} />
                )}
              </div>

              {pinFor && !recoverMode && (
                <form onSubmit={handlePinSubmit} style={{ marginTop: 20, borderTop: '1px solid #e5e7eb', paddingTop: 18 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 8, textAlign: 'center' }}>
                    Enter 6-digit PIN
                  </label>
                  {pinError && <div className="error-msg">{pinError}</div>}
                  <input
                    autoFocus
                    inputMode="numeric"
                    maxLength={6}
                    value={pinValue}
                    onChange={e => setPinValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    style={{ width: '100%', textAlign: 'center', fontSize: '1.4rem', letterSpacing: 8, padding: '12px', border: '1.5px solid #e5e7eb', borderRadius: 12, boxSizing: 'border-box' }}
                  />
                  <button type="submit" className="login-btn" disabled={entering} style={{ marginTop: 14 }}>
                    {entering ? 'Checking...' : 'Unlock'}
                  </button>
                  {pinFor === primaryGuardianId && (
                    <div style={{ textAlign: 'center', marginTop: 10 }}>
                      <button type="button" className="forgot-link" onClick={() => setRecoverMode(true)}>
                        Forgot PIN?
                      </button>
                    </div>
                  )}
                  <button type="button" className="login-btn-outline" style={{ marginTop: 8 }} onClick={() => setPinFor(null)}>
                    Cancel
                  </button>
                </form>
              )}

              {pinFor && recoverMode && (
                <form onSubmit={handleRecoverSubmit} style={{ marginTop: 20, borderTop: '1px solid #e5e7eb', paddingTop: 18 }}>
                  <div className="login-title" style={{ fontSize: '1.05rem', textAlign: 'center' }}>Reset Your PIN</div>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', textAlign: 'center', marginBottom: 14 }}>
                    Enter your account password to confirm it's you, then choose a new PIN.
                  </p>
                  {recoverError && <div className="error-msg">{recoverError}</div>}
                  <div className="form-group" style={{ marginBottom: 10 }}>
                    <label>Account Password</label>
                    <PasswordField
                      autoFocus
                      value={recoverPassword}
                      onChange={e => setRecoverPassword(e.target.value)}
                      placeholder="Your sign-in password"
                    />
                  </div>
                  <div className="form-row" style={{ marginBottom: 6 }}>
                    <div className="form-group">
                      <label>New 6-digit PIN</label>
                      <input inputMode="numeric" maxLength={6} value={recoverNewPin} onChange={e => setRecoverNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="e.g. 482910" />
                    </div>
                    <div className="form-group">
                      <label>Confirm PIN</label>
                      <input inputMode="numeric" maxLength={6} value={recoverConfirmPin} onChange={e => setRecoverConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Repeat PIN" />
                    </div>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: 14 }}>{PIN_REQUIREMENTS_HINT}</div>
                  <button type="submit" className="login-btn" disabled={entering}>
                    {entering ? 'Resetting...' : 'Reset PIN & Sign In'}
                  </button>
                  <button type="button" className="login-btn-outline" style={{ marginTop: 8 }} onClick={() => { setRecoverMode(false); setRecoverError('') }}>
                    Back
                  </button>
                </form>
              )}
            </>
          )}

          {addMode === 'choose' && (
            <div>
              <div className="login-title" style={{ fontSize: '1.1rem' }}>Add a profile</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
                {kidsCount < 10 && (
                  <button className="login-btn-outline" onClick={() => setAddMode('kid')}>🧒 Add Child</button>
                )}
                {!hasCoGuardian && (
                  <button className="login-btn-outline" onClick={() => setAddMode('coguardian')}>🧑 Add Co-Guardian</button>
                )}
                <button className="login-btn-outline" onClick={() => setAddMode(null)}>Cancel</button>
              </div>
            </div>
          )}

          {addMode === 'kid' && (
            <AddKidForm onDone={() => { setAddMode(null); load() }} onCancel={() => setAddMode(null)} />
          )}

          {addMode === 'coguardian' && (
            <AddCoGuardianForm onDone={() => { setAddMode(null); load() }} onCancel={() => setAddMode(null)} />
          )}

          {!addMode && !pinFor && (
            <div style={{ textAlign: 'center', marginTop: 18 }}>
              <button className="forgot-link" onClick={handleSignOut}>Sign out</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AddKidForm({ onDone, onCancel }) {
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('🐶')
  const [birthMonth, setBirthMonth] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError("Child's name is required."); return }
    if (!birthMonth || !birthYear) { setError("Birth month and year are required."); return }
    const pinCheck = checkPinComplexity(pin)
    if (!pinCheck.ok) { setError(pinCheck.message); return }
    if (pin !== confirmPin) { setError('PINs do not match.'); return }
    setSaving(true)
    try {
      await api.addKid({ name: name.trim(), avatar, birthMonth: Number(birthMonth), birthYear: Number(birthYear), pin })
      onDone()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="login-title" style={{ fontSize: '1.1rem' }}>Add Child</div>
      {error && <div className="error-msg">{error}</div>}
      <div className="form-group" style={{ marginBottom: 10 }}>
        <label>Child's Name *</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Emma" />
      </div>
      <div className="form-row" style={{ marginBottom: 10 }}>
        <div className="form-group">
          <label>Birth Month *</label>
          <select value={birthMonth} onChange={e => setBirthMonth(e.target.value)}>
            <option value="">Select month</option>
            {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Birth Year *</label>
          <select value={birthYear} onChange={e => setBirthYear(e.target.value)}>
            <option value="">Select year</option>
            {BIRTH_YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group" style={{ marginBottom: 10 }}>
        <label>Avatar <span style={{ fontWeight: 400, color: '#94a3b8' }}>— selected: {avatar}</span></label>
        <EmojiPicker emojis={KID_AVATARS} value={avatar} onChange={setAvatar} />
      </div>
      <div className="form-row" style={{ marginBottom: 6 }}>
        <div className="form-group">
          <label>6-digit PIN *</label>
          <input inputMode="numeric" maxLength={6} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="e.g. 482910" />
        </div>
        <div className="form-group">
          <label>Confirm PIN *</label>
          <input inputMode="numeric" maxLength={6} value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Repeat PIN" />
        </div>
      </div>
      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: 14 }}>{PIN_REQUIREMENTS_HINT}</div>
      <button type="submit" className="login-btn" disabled={saving}>{saving ? 'Adding...' : 'Add Child'}</button>
      <button type="button" className="login-btn-outline" style={{ marginTop: 8 }} onClick={onCancel}>Cancel</button>
    </form>
  )
}

function AddCoGuardianForm({ onDone, onCancel }) {
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('🧑')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Mutually exclusive with the direct form below -- same pending-invite
  // check the Admin Panel's "Invite by Email" option uses, so this screen
  // (reached from the profile picker's own "Add Profile" tile, separately
  // from the Admin Panel) stays consistent with it.
  const [invite, setInvite] = useState(null)
  const [inviteLoaded, setInviteLoaded] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [sendingInvite, setSendingInvite] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  // Which of the two add methods is showing -- presented as a clear
  // either/or pick rather than one long scroll with a faint "OR" in the
  // middle of it (same pattern as the Admin Panel's own Add Co-Guardian).
  const [addMode, setAddMode] = useState('choose')

  const loadInvite = () => {
    api.getCoGuardianInvite()
      .then(data => setInvite(data.pending))
      .catch(() => setInvite(null))
      .finally(() => setInviteLoaded(true))
  }
  useEffect(() => { loadInvite() }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Name is required.'); return }
    const pinCheck = checkPinComplexity(pin)
    if (!pinCheck.ok) { setError(pinCheck.message); return }
    if (pin !== confirmPin) { setError('PINs do not match.'); return }
    setSaving(true)
    try {
      await api.addCoGuardian({ name: name.trim(), avatar, pin })
      onDone()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSendInvite(e) {
    e.preventDefault()
    setInviteError('')
    if (!inviteEmail.trim()) { setInviteError('Email is required.'); return }
    setSendingInvite(true)
    try {
      await api.sendCoGuardianInvite(inviteEmail.trim())
      setInviteEmail('')
      loadInvite()
    } catch (err) {
      setInviteError(err.message)
    } finally {
      setSendingInvite(false)
    }
  }

  async function handleCancelInvite() {
    setCancelling(true)
    try { await api.cancelCoGuardianInvite(); loadInvite() }
    catch (err) { setInviteError(err.message) }
    finally { setCancelling(false) }
  }

  if (!inviteLoaded) return <div className="loading-text">Loading…</div>

  if (invite) {
    return (
      <div>
        <div className="login-title" style={{ fontSize: '1.1rem' }}>Invite Pending</div>
        {inviteError && <div className="error-msg">{inviteError}</div>}
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 16 }}>
          Waiting on <strong>{invite.email}</strong> to accept — expires{' '}
          {new Date(invite.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}.
        </p>
        <button className="login-btn-outline" disabled={cancelling} onClick={handleCancelInvite}>
          {cancelling ? 'Cancelling...' : 'Cancel Invite'}
        </button>
        <button type="button" className="login-btn-outline" style={{ marginTop: 8 }} onClick={onCancel}>Back</button>
      </div>
    )
  }

  if (addMode === 'choose') {
    return (
      <div>
        <div className="login-title" style={{ fontSize: '1.1rem' }}>Add Co-Guardian</div>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 16 }}>
          Add a profile for another guardian (partner, spouse, etc.) to your family. They get the same access as you.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          <button
            type="button"
            onClick={() => setAddMode('direct')}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
              background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12,
              padding: '14px 16px', cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>➕</span>
            <span>
              <span style={{ display: 'block', fontWeight: 700, color: '#1e293b', fontSize: '0.92rem' }}>Add Directly</span>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>You set their name and PIN right now, on this device.</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setAddMode('invite')}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
              background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12,
              padding: '14px 16px', cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>📧</span>
            <span>
              <span style={{ display: 'block', fontWeight: 700, color: '#1e293b', fontSize: '0.92rem' }}>Invite by Email</span>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>Not at the same device? They set up their own name and PIN from their own phone.</span>
            </span>
          </button>
        </div>
        <button type="button" className="login-btn-outline" onClick={onCancel}>Cancel</button>
      </div>
    )
  }

  if (addMode === 'direct') {
    return (
      <form onSubmit={handleSubmit}>
        <button type="button" onClick={() => setAddMode('choose')} style={{ background: 'none', border: 'none', color: '#0d9488', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', padding: 0, marginBottom: 14 }}>
          ← Back
        </button>
        <div className="login-title" style={{ fontSize: '1.1rem' }}>Add Directly</div>
        {error && <div className="error-msg">{error}</div>}
        <div className="form-group" style={{ marginBottom: 10 }}>
          <label>Full Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. John Smith" />
        </div>
        <div className="form-group" style={{ marginBottom: 10 }}>
          <label>Avatar <span style={{ fontWeight: 400, color: '#94a3b8' }}>— selected: {avatar}</span></label>
          <EmojiPicker emojis={COGUARDIAN_AVATARS} value={avatar} onChange={setAvatar} />
        </div>
        <div className="form-row" style={{ marginBottom: 6 }}>
          <div className="form-group">
            <label>6-digit PIN *</label>
            <input inputMode="numeric" maxLength={6} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="e.g. 482910" />
          </div>
          <div className="form-group">
            <label>Confirm PIN *</label>
            <input inputMode="numeric" maxLength={6} value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Repeat PIN" />
          </div>
        </div>
        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: 14 }}>{PIN_REQUIREMENTS_HINT}</div>
        <button type="submit" className="login-btn" disabled={saving}>{saving ? 'Creating...' : 'Create Co-Guardian'}</button>
      </form>
    )
  }

  return (
    <div>
      <button type="button" onClick={() => setAddMode('choose')} style={{ background: 'none', border: 'none', color: '#0d9488', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', padding: 0, marginBottom: 14 }}>
        ← Back
      </button>
      <div className="login-title" style={{ fontSize: '1.1rem' }}>Invite by Email</div>
      <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 12 }}>
        Send an invite — they'll set up their own name and PIN from their own phone, with the same access as you.
      </p>
      {inviteError && <div className="error-msg">{inviteError}</div>}
      <form onSubmit={handleSendInvite} style={{ marginBottom: 14 }}>
        <div className="form-group" style={{ marginBottom: 10 }}>
          <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="co-parent@example.com" />
        </div>
        <button type="submit" className="login-btn-outline" disabled={sendingInvite}>
          {sendingInvite ? 'Sending...' : 'Send Invite'}
        </button>
      </form>
    </div>
  )
}
