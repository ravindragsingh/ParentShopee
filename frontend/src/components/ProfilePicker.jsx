import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api.js'
import { EmojiPicker, KID_AVATARS } from './ChoreCard.jsx'
import { checkPinComplexity, PIN_REQUIREMENTS_HINT } from '../utils/pinValidator.js'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const CURRENT_YEAR = new Date().getFullYear()
const BIRTH_YEAR_OPTIONS = Array.from({ length: 21 }, (_, i) => CURRENT_YEAR - i)
const COPARENT_AVATARS = ['🧑', '👨', '👩', '🧔', '👱', '👨‍🦱', '👩‍🦱', '👨‍🦳', '👩‍🦳', '🧓']

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
  const [hasCoParent, setHasCoParent] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [pinFor, setPinFor] = useState(null)      // profile id currently entering a PIN
  const [pinValue, setPinValue] = useState('')
  const [pinError, setPinError] = useState('')
  const [entering, setEntering] = useState(false)

  // Forgotten-PIN recovery — primary parent's own profile only. Re-proving the
  // account password stands in for the PIN, then they choose a new one.
  const [recoverMode, setRecoverMode] = useState(false)
  const [recoverPassword, setRecoverPassword] = useState('')
  const [recoverNewPin, setRecoverNewPin] = useState('')
  const [recoverConfirmPin, setRecoverConfirmPin] = useState('')
  const [recoverError, setRecoverError] = useState('')

  const [addMode, setAddMode] = useState(null)    // null | 'choose' | 'kid' | 'coparent'
  const [dismissedNotice, setDismissedNotice] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true); setError('')
    try {
      const data = await api.getFamilyProfiles()
      setProfiles(data.profiles)
      setKidsCount(data.kidsCount)
      setHasCoParent(data.hasCoParent)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleTileClick(profile) {
    // Every profile — including the parent's own — is PIN-gated, so picking
    // any tile always opens the PIN entry form. This is what makes "Switch
    // Profile" actually lock the device instead of leaving one profile open.
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
  // The primary parent is always first in the list the backend returns.
  const familyName = profiles?.[0]?.name
  const primaryParentId = profiles?.[0]?.id

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
              <div style={{ fontWeight: 700, marginBottom: 6 }}>⚠️ New PINs were set up for your family</div>
              <div style={{ marginBottom: 8 }}>We generated a temporary PIN for each profile below. Note these down (or change them anytime from the Admin Panel / Kids tab):</div>
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
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 4 }}>
                {profiles.map(p => (
                  <ProfileTile key={p.id} profile={p} busy={entering} onClick={() => handleTileClick(p)} />
                ))}
                <AddProfileTile onClick={() => setAddMode('choose')} disabled={kidsCount >= 10 && hasCoParent} />
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
                  {pinFor === primaryParentId && (
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
                    <input
                      autoFocus
                      type="password"
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
                {!hasCoParent && (
                  <button className="login-btn-outline" onClick={() => setAddMode('coparent')}>🧑 Add Co-Parent</button>
                )}
                <button className="login-btn-outline" onClick={() => setAddMode(null)}>Cancel</button>
              </div>
            </div>
          )}

          {addMode === 'kid' && (
            <AddKidForm onDone={() => { setAddMode(null); load() }} onCancel={() => setAddMode(null)} />
          )}

          {addMode === 'coparent' && (
            <AddCoParentForm onDone={() => { setAddMode(null); load() }} onCancel={() => setAddMode(null)} />
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

function AddCoParentForm({ onDone, onCancel }) {
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('🧑')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Name is required.'); return }
    const pinCheck = checkPinComplexity(pin)
    if (!pinCheck.ok) { setError(pinCheck.message); return }
    if (pin !== confirmPin) { setError('PINs do not match.'); return }
    setSaving(true)
    try {
      await api.addCoParent({ name: name.trim(), avatar, pin })
      onDone()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="login-title" style={{ fontSize: '1.1rem' }}>Add Co-Parent</div>
      {error && <div className="error-msg">{error}</div>}
      <div className="form-group" style={{ marginBottom: 10 }}>
        <label>Full Name *</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. John Smith" />
      </div>
      <div className="form-group" style={{ marginBottom: 10 }}>
        <label>Avatar <span style={{ fontWeight: 400, color: '#94a3b8' }}>— selected: {avatar}</span></label>
        <EmojiPicker emojis={COPARENT_AVATARS} value={avatar} onChange={setAvatar} />
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
      <button type="submit" className="login-btn" disabled={saving}>{saving ? 'Creating...' : 'Create Co-Parent'}</button>
      <button type="button" className="login-btn-outline" style={{ marginTop: 8 }} onClick={onCancel}>Cancel</button>
    </form>
  )
}
