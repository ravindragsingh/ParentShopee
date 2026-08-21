import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { areTipsDisabled, setTipsEnabled } from './TipOfTheDayModal.jsx'

// Kid Dashboard only now — the guardian's equivalent lives in GuardianDashboard's
// Admin Panel tab, which also covers the password/PIN they actually have.
export default function SettingsPanel() {
  const { user, logout } = useAuth()
  const [tipsEnabled, setTipsEnabledState] = useState(() => !areTipsDisabled(user.id))

  function handleToggleTips(e) {
    const enabled = e.target.checked
    setTipsEnabled(user.id, enabled)
    setTipsEnabledState(enabled)
  }

  return (
    <div style={{ maxWidth: 500 }}>
      <h2 style={{ fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>⚙️ Settings</h2>
      <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: 24 }}>Manage your account.</p>

      {/* Profile */}
      <div className="form-card" style={{ marginBottom: 16 }}>
        <div className="form-title">My Profile</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg,#f0fdfa,#fff7ed)',
            border: '2px solid #f9a8d4',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem',
          }}>
            {user.avatar || '🐶'}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>{user.name}</div>
            <div style={{ marginTop: 6 }}>
              <span className="badge open">🧒 Kid</span>
            </div>
          </div>
        </div>
      </div>

      {/* PIN */}
      <div className="form-card" style={{ marginBottom: 16 }}>
        <div className="form-title">Your PIN</div>
        <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
          Your profile is unlocked with a 6-digit PIN instead of a password. Forgot it? Ask your guardian —
          they can set you a new one from the Kids tab.
        </p>
      </div>

      {/* Tip of the Day */}
      <div className="form-card" style={{ marginBottom: 16 }}>
        <div className="form-title">💡 Tip of the Day</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.875rem', color: '#334155', cursor: 'pointer' }}>
          <input type="checkbox" checked={tipsEnabled} onChange={handleToggleTips} />
          Show a daily tip when I open my dashboard
        </label>
      </div>

      {/* Sign out */}
      <div className="form-card">
        <div className="form-title">Sign Out</div>
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: 14 }}>
          You'll need to pick your profile and enter your PIN again to sign back in.
        </p>
        <button className="btn btn-red" onClick={logout} style={{ width: '100%', padding: 12 }}>
          Sign Out
        </button>
      </div>
    </div>
  )
}
