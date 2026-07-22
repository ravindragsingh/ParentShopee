import { useAuth } from '../context/AuthContext.jsx'

// Kid Dashboard only now — the parent's equivalent lives in ParentDashboard's
// Admin Panel tab, which also covers the password/PIN they actually have.
export default function SettingsPanel() {
  const { user, logout } = useAuth()

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
          Your profile is unlocked with a 6-digit PIN instead of a password. Forgot it? Ask your parent —
          they can set you a new one from the Kids tab.
        </p>
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
