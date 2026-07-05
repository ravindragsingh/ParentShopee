import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api.js'
import { LoginHelp } from './Help.jsx'

// ── User Agreement Modal ──────────────────────────────────────────────────────

function UserAgreementModal({ onClose }) {
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15,23,42,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 14, maxWidth: 560, width: '100%',
          maxHeight: '85vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1e293b' }}>📋 User Agreement</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>Reward Ur Kids · Effective June 2026</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>✕</button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', padding: '18px 22px', fontSize: '0.82rem', color: '#334155', lineHeight: 1.65 }}>

          <Section title="1. About Reward Ur Kids">
            Reward Ur Kids is a family management app that allows parents to assign chores to children, award points, and let children redeem those points in a family shop. By creating an account you agree to use the app only for lawful family management purposes.
          </Section>

          <Section title="2. Eligibility">
            Account holders (parents) must be at least 25 years of age. By registering you confirm that the date of birth you provide is accurate. Children added to the family account do not create their own accounts; their profiles are managed entirely by the parent.
          </Section>

          <Section title="3. Children's Privacy">
            We take children's privacy seriously. Children's names, avatars, and point balances are stored solely to operate the app for your family. We do not share, sell, or disclose children's data to third parties. Parents are responsible for keeping their login credentials secure.
          </Section>

          <Section title="4. Account Responsibilities">
            You are responsible for all activity that occurs under your account. Keep your password confidential and notify us immediately if you suspect unauthorised access. You may not share your account with individuals outside your immediate family.
          </Section>

          <Section title="5. Acceptable Use">
            You agree not to use Reward Ur Kids to:
            <ul style={{ marginTop: 6, paddingLeft: 18 }}>
              <li>Post content that is offensive, hateful, or inappropriate for children</li>
              <li>Circumvent the age-appropriate content filters built into the app</li>
              <li>Attempt to gain unauthorised access to other accounts or backend systems</li>
              <li>Use the app for any commercial or non-personal purpose</li>
            </ul>
          </Section>

          <Section title="6. Content Standards">
            Chore names, shop item names, and messages must use age-appropriate language. The app automatically filters restricted words. Content that bypasses or attempts to bypass these filters may result in account suspension.
          </Section>

          <Section title="7. Points & Rewards">
            Points awarded within the app have no monetary value and cannot be exchanged for real money. Parents retain full discretion over awarding and adjusting points. Reward Ur Kids is not responsible for disputes arising from point adjustments made by parents.
          </Section>

          <Section title="8. Data Storage">
            Your account data (name, email, username, hashed password, and family records) is stored securely on our servers. We do not sell or share your personal data with advertisers. You may request deletion of your account and all associated data by contacting us via the Contact Us form in the app.
          </Section>

          <Section title="9. Service Availability">
            We strive for high availability but do not guarantee uninterrupted access. We reserve the right to perform maintenance, updates, or to discontinue the service with reasonable notice.
          </Section>

          <Section title="10. Changes to This Agreement">
            We may update this agreement from time to time. Continued use of Reward Ur Kids after changes are posted constitutes acceptance of the revised agreement. We will notify you of significant changes via the email address on your account.
          </Section>

          <Section title="11. Contact">
            If you have questions about this agreement, please use the Contact Us feature within the app after logging in, or email us directly at ravindragsingh@gmail.com.
          </Section>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{title}</div>
      <div>{children}</div>
    </div>
  )
}

// ── Register form ─────────────────────────────────────────────────────────────

function RegisterForm({ onBack }) {
  const { login } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '', confirmPassword: '', dateOfBirth: '', gender: '' })
  const [agreed, setAgreed] = useState(false)
  const [showAgreement, setShowAgreement] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || !form.email.trim() || !form.username.trim() || !form.password || !form.dateOfBirth) {
      setError('All fields are required.')
      return
    }
    if (!form.gender) {
      setError('Please select your gender.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (!agreed) {
      setError('You must read and agree to the User Agreement to create an account.')
      return
    }
    setLoading(true)
    try {
      const data = await api.register({
        name: form.name.trim(),
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
      })
      login(data.user, data.token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {showAgreement && <UserAgreementModal onClose={() => setShowAgreement(false)} />}

      <h1 className="login-title">Create Account</h1>
      <p className="login-subtitle">Parents only · Must be 25 or older</p>

      {error && <div className="error-msg">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label>Full Name *</label>
          <input value={form.name} onChange={set('name')} placeholder="e.g. Jane Smith" />
        </div>
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label>Email Address *</label>
          <input type="email" value={form.email} onChange={set('email')} placeholder="jane@example.com" />
        </div>
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label>Date of Birth * <span style={{ fontWeight: 400, color: '#94a3b8' }}>(must be 25+)</span></label>
          <input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
        </div>
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label>Gender *</label>
          <select value={form.gender} onChange={set('gender')}>
            <option value="">Select gender</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Prefer not to say</option>
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label>Username *</label>
          <input value={form.username} onChange={set('username')} placeholder="Choose a username" />
        </div>
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label>Password *</label>
          <input type="password" value={form.password} onChange={set('password')} placeholder="At least 4 characters" />
        </div>
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label>Confirm Password *</label>
          <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Repeat password" />
        </div>

        {/* User Agreement checkbox */}
        <div
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: agreed ? '#f5f3ff' : '#fafafa',
            border: `1.5px solid ${agreed ? '#a855f7' : '#e2e8f0'}`,
            borderRadius: 10, padding: '12px 14px', marginBottom: 20,
            transition: 'all 0.2s', cursor: 'pointer',
          }}
          onClick={() => setAgreed(v => !v)}
        >
          <div
            role="checkbox"
            aria-checked={agreed}
            tabIndex={0}
            onKeyDown={e => (e.key === ' ' || e.key === 'Enter') && setAgreed(v => !v)}
            style={{
              flexShrink: 0, width: 20, height: 20, borderRadius: 5, marginTop: 1,
              border: `2px solid ${agreed ? '#7c3aed' : '#cbd5e1'}`,
              background: agreed ? '#7c3aed' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          >
            {agreed && <span style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 900, lineHeight: 1 }}>✓</span>}
          </div>
          <div style={{ fontSize: '0.83rem', color: '#334155', lineHeight: 1.5, userSelect: 'none' }}>
            I have read and agree to the{' '}
            <span
              onClick={e => { e.stopPropagation(); setShowAgreement(true) }}
              style={{ color: '#7c3aed', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}
            >
              User Agreement
            </span>
            . I confirm I am 25 years of age or older and accept responsibility for managing my family's account.
          </div>
        </div>

        <button type="submit" className="login-btn" disabled={loading || !agreed} style={{ opacity: !agreed ? 0.55 : 1 }}>
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p style={{ marginTop: 16, textAlign: 'center', fontSize: '0.85rem' }}>
        Already have an account?{' '}
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer', fontWeight: 600 }}>
          Sign In
        </button>
      </p>
    </>
  )
}

// ── Login form ────────────────────────────────────────────────────────────────

function LoginForm({ onRegister }) {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionExpired] = useState(() => {
    const expired = localStorage.getItem('session_expired') === '1'
    if (expired) localStorage.removeItem('session_expired')
    return expired
  })

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password.trim()) {
      setError('Please enter username and password.')
      return
    }
    setLoading(true)
    try {
      const data = await api.login(username.trim(), password.trim())
      login(data.user, data.token)
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1 className="login-title">Reward Ur Kids</h1>
      <p className="login-subtitle">Chores &amp; Rewards for Families</p>

      {sessionExpired && (
        <div style={{ background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: '0.85rem', color: '#92400e', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span>⚠️</span>
          <span>Your session expired — the server restarted. Please sign in again.</span>
        </div>
      )}

      {error && <div className="error-msg">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="e.g. parent1 or kid1"
            autoFocus
          />
        </div>
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
          />
        </div>
        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 8 }}>
          New parent?{' '}
          <button onClick={onRegister} style={{ background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
            Create an account
          </button>
        </p>
        <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
          Demo: parent1/pass1 &middot; kid1/pass1
        </p>
      </div>
    </>
  )
}

// ── Shell ─────────────────────────────────────────────────────────────────────

export default function Login() {
  const [mode, setMode] = useState('login')

  return (
    <div className="login-wrapper" style={{ flexDirection: 'column', gap: 0, padding: '24px 16px' }}>
      <div className="login-card">
        <div className="login-logo">🛒</div>
        {mode === 'login'
          ? <LoginForm onRegister={() => setMode('register')} />
          : <RegisterForm onBack={() => setMode('login')} />
        }
      </div>
      <LoginHelp />
    </div>
  )
}
