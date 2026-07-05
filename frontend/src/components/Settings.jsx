import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api.js'

export default function SettingsPanel() {
  const { user, logout } = useAuth()
  const [newPwd, setNewPwd]       = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdError, setPwdError]   = useState('')
  const [pwdSuccess, setPwdSuccess] = useState('')
  const [saving, setSaving]       = useState(false)

  const isParent = user.role === 'parent'

  async function handleChangePwd(e) {
    e.preventDefault()
    setPwdError(''); setPwdSuccess('')
    if (newPwd.length < 4) { setPwdError('Password must be at least 4 characters.'); return }
    if (newPwd !== confirmPwd) { setPwdError('Passwords do not match.'); return }
    setSaving(true)
    try {
      await api.changeOwnPassword(newPwd)
      setPwdSuccess('Password updated successfully.')
      setNewPwd(''); setConfirmPwd('')
    } catch (err) {
      setPwdError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 500 }}>
      <h2 style={{ fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>⚙️ Settings</h2>
      <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: 24 }}>Manage your account.</p>

      {/* Profile */}
      <div className="form-card" style={{ marginBottom: 16 }}>
        <div className="form-title">My Profile</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: user.email ? 14 : 0 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
            background: isParent
              ? 'linear-gradient(135deg,#f0fdfa,#ccfbf1)'
              : 'linear-gradient(135deg,#f0fdfa,#fff7ed)',
            border: `2px solid ${isParent ? '#99f6e4' : '#f9a8d4'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem',
          }}>
            {user.avatar || (isParent ? '👤' : '🐶')}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>{user.name}</div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 2 }}>@{user.username}</div>
            <div style={{ marginTop: 6 }}>
              <span className={`badge ${isParent ? 'complete' : 'open'}`}>
                {user.coParentOf ? 'Co-Parent' : isParent ? '👑 Family Admin' : '🧒 Kid'}
              </span>
            </div>
          </div>
        </div>
        {user.email && (
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 4 }}>📧 {user.email}</div>
        )}
      </div>

      {/* Change password */}
      <div className="form-card" style={{ marginBottom: 16 }}>
        <div className="form-title">Change Password</div>
        <form onSubmit={handleChangePwd}>
          {pwdError   && <div className="error-msg">{pwdError}</div>}
          {pwdSuccess && <div className="success-msg">{pwdSuccess}</div>}
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label>New Password</label>
            <input
              type="password"
              value={newPwd}
              onChange={e => setNewPwd(e.target.value)}
              placeholder="At least 4 characters"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
              placeholder="Repeat new password"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Sign out */}
      <div className="form-card">
        <div className="form-title">Sign Out</div>
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: 14 }}>
          You'll need your username and password to sign back in.
        </p>
        <button className="btn btn-red" onClick={logout} style={{ width: '100%', padding: 12 }}>
          Sign Out
        </button>
      </div>
    </div>
  )
}
