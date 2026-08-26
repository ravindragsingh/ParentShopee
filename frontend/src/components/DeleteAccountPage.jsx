import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'

// Public, unauthenticated page for requesting account deletion -- needed as
// a standalone URL for app store submissions (Google Play requires a way to
// request deletion that doesn't depend on having the app installed or being
// logged in already). Signs the guardian in with their own credentials right
// here, then immediately deletes -- the same cascading delete_family /
// delete_lone_user logic the in-app Admin Panel danger zone already uses.
export default function DeleteAccountPage() {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [doneMessage, setDoneMessage] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password) {
      setError('Enter your username and password.')
      return
    }
    if (confirmText.trim().toUpperCase() !== 'DELETE') {
      setError('Type DELETE (in capital letters) to confirm.')
      return
    }
    setLoading(true)
    try {
      const loginData = await api.login(username.trim(), password)
      const result = await api.deleteOwnAccount(loginData.token)
      setDoneMessage(result.message)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const headerBar = (
    <div style={{ background: 'linear-gradient(135deg,#0f766e,#0d9488)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 10px rgba(0,0,0,0.12)' }}>
      <div style={{ background: '#fff', borderRadius: 10, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
        <img src="/branding/RewardURKids_Website_Compact_Logo.png" alt="Reward Ur Kids" style={{ height: 24, display: 'block' }} />
      </div>
      <button
        onClick={() => navigate('/')}
        style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)', color: '#fff', borderRadius: 8, padding: '6px 16px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
      >
        Sign In
      </button>
    </div>
  )

  if (doneMessage) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        {headerBar}
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', marginBottom: 10 }}>Account Deleted</h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6 }}>{doneMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {headerBar}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '40px 24px 60px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b', marginBottom: 10 }}>🗑️ Delete Your Account</h1>
        <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>
          Use this page to permanently delete your Reward Ur Kids account and all associated
          data, without needing to install the app or already be signed in. This applies to
          the guardian account you registered with a username and password.
        </p>

        <div style={{ background: '#fff5f5', border: '1.5px solid #fecaca', borderRadius: 12, padding: '16px 20px', marginBottom: 24, fontSize: '0.85rem', color: '#7f1d1d', lineHeight: 1.6 }}>
          <strong>This is permanent and cannot be undone.</strong> If you're the primary
          guardian, this deletes your entire family — every kid profile, your co-guardian
          (if any), and all chores, shop items, wallet history, and messages. If you're a
          co-guardian, only your own access is removed; the rest of the family stays intact.
        </div>

        {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit} className="form-card">
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label>Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Your sign-in username" autoComplete="username" />
          </div>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your sign-in password" autoComplete="current-password" />
          </div>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label>Type DELETE to confirm</label>
            <input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="DELETE" />
          </div>
          <button type="submit" className="btn btn-red" disabled={loading} style={{ width: '100%', padding: 12 }}>
            {loading ? 'Deleting…' : 'Permanently Delete My Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
