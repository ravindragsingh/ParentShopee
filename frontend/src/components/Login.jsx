import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api.js'
import { LOGIN_HELP_CARDS } from './Help.jsx'
import { checkPasswordComplexity, PASSWORD_REQUIREMENTS_HINT } from '../utils/passwordValidator.js'

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
            style={{ background: 'linear-gradient(135deg,#0f766e,#0d9488)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}
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
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '', confirmPassword: '', dateOfBirth: '', gender: '' })
  const [agreed, setAgreed] = useState(false)
  const [showAgreement, setShowAgreement] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(null) // { email, message } once registration succeeds

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
    const pwCheck = checkPasswordComplexity(form.password)
    if (!pwCheck.ok) {
      setError(pwCheck.message)
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
      setRegistered({ email: data.email, message: data.message })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (registered) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📧</div>
        <h1 className="login-title">Check Your Email</h1>
        <p className="login-subtitle" style={{ marginBottom: 8 }}>{registered.message}</p>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 22 }}>
          We sent an activation link to <strong>{registered.email}</strong>. Click it to activate your account, then sign in.
        </p>
        <button onClick={onBack} className="login-btn-outline">
          Back to Sign In <span aria-hidden="true">→</span>
        </button>
      </div>
    )
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
          <input type="password" value={form.password} onChange={set('password')} placeholder="e.g. Sunshine24!" />
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>{PASSWORD_REQUIREMENTS_HINT}</div>
        </div>
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label>Confirm Password *</label>
          <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Repeat password" />
        </div>

        {/* User Agreement checkbox */}
        <div
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: agreed ? '#f0fdfa' : '#fafafa',
            border: `1.5px solid ${agreed ? '#2dd4bf' : '#e2e8f0'}`,
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
              border: `2px solid ${agreed ? '#0d9488' : '#cbd5e1'}`,
              background: agreed ? '#0d9488' : '#fff',
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
              style={{ color: '#0d9488', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}
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
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#0d9488', cursor: 'pointer', fontWeight: 600 }}>
          Sign In
        </button>
      </p>
    </>
  )
}

// ── Activation-needed modal ─────────────────────────────────────────────────────

function ActivationNeededModal({ username, onClose }) {
  const [resending, setResending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleResend() {
    setResending(true)
    setError('')
    setMessage('')
    try {
      const data = await api.resendActivation(username)
      setMessage(data.message)
    } catch (err) {
      setError(err.message)
    } finally {
      setResending(false)
    }
  }

  return createPortal(
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 16, maxWidth: 400, width: '100%', padding: '28px 24px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', textAlign: 'center' }}
      >
        <div style={{ fontSize: '2.2rem', marginBottom: 10 }}>📧</div>
        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e293b', marginBottom: 8 }}>Activate your account</div>
        <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6, marginBottom: 18 }}>
          You need to activate your account before signing in. Click the link we emailed you when you signed up —
          or resend it below if it's gone or expired.
        </p>
        {message && <div className="success-msg">{message}</div>}
        {error && <div className="error-msg">{error}</div>}
        <button className="login-btn" onClick={handleResend} disabled={resending} style={{ marginBottom: 10 }}>
          {resending ? 'Sending...' : 'Resend Activation Email'}
        </button>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}>
          Close
        </button>
      </div>
    </div>,
    document.body
  )
}

// ── Forgot password / username panels ───────────────────────────────────────────

function ForgotPasswordPanel() {
  const [fpUsername, setFpUsername] = useState('')
  const [fpEmail, setFpEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit() {
    setError('')
    setMessage('')
    if (!fpUsername.trim() || !fpEmail.trim()) {
      setError('Please enter your username and email.')
      return
    }
    setLoading(true)
    try {
      const data = await api.forgotPassword(fpUsername.trim(), fpEmail.trim())
      setMessage(data.message)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
      <div style={{ fontSize: '0.82rem', color: '#166534', marginBottom: 10, fontWeight: 600 }}>
        Enter your username and the email on your account — we'll send a password reset link.
      </div>
      {message && <div className="success-msg" style={{ marginBottom: 0 }}>{message}</div>}
      {error && <div className="error-msg" style={{ marginBottom: 8 }}>{error}</div>}
      {!message && (
        <>
          <input
            type="text"
            value={fpUsername}
            onChange={e => setFpUsername(e.target.value)}
            placeholder="Username"
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #bbf7d0', borderRadius: 7, fontSize: '0.85rem', marginBottom: 8, boxSizing: 'border-box' }}
          />
          <input
            type="email"
            value={fpEmail}
            onChange={e => setFpEmail(e.target.value)}
            placeholder="Email on your account"
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #bbf7d0', borderRadius: 7, fontSize: '0.85rem', marginBottom: 10, boxSizing: 'border-box' }}
          />
          <button type="button" onClick={handleSubmit} disabled={loading} className="btn btn-sm btn-green" style={{ width: '100%' }}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </>
      )}
    </div>
  )
}

function ForgotUsernamePanel() {
  const [fuEmail, setFuEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit() {
    setError('')
    setMessage('')
    if (!fuEmail.trim()) {
      setError('Please enter your email.')
      return
    }
    setLoading(true)
    try {
      const data = await api.forgotUsername(fuEmail.trim())
      setMessage(data.message)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
      <div style={{ fontSize: '0.82rem', color: '#1e40af', marginBottom: 10, fontWeight: 600 }}>
        Enter the email on your account — we'll send you your username.
      </div>
      {message && <div className="success-msg" style={{ marginBottom: 0 }}>{message}</div>}
      {error && <div className="error-msg" style={{ marginBottom: 8 }}>{error}</div>}
      {!message && (
        <>
          <input
            type="email"
            value={fuEmail}
            onChange={e => setFuEmail(e.target.value)}
            placeholder="Email on your account"
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #bfdbfe', borderRadius: 7, fontSize: '0.85rem', marginBottom: 10, boxSizing: 'border-box' }}
          />
          <button type="button" onClick={handleSubmit} disabled={loading} className="btn btn-sm btn-primary" style={{ width: '100%' }}>
            {loading ? 'Sending...' : 'Send My Username'}
          </button>
        </>
      )}
    </div>
  )
}

// ── Login form ────────────────────────────────────────────────────────────────

function LoginForm({ onRegister }) {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [showForgotUsername, setShowForgotUsername] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showActivationModal, setShowActivationModal] = useState(false)
  const [sessionExpired] = useState(() => {
    const expired = localStorage.getItem('session_expired') === '1'
    if (expired) localStorage.removeItem('session_expired')
    return expired
  })

  useEffect(() => {
    const saved = localStorage.getItem('remembered_username')
    if (saved) {
      setUsername(saved)
      setRemember(true)
    }
  }, [])

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
      if (remember) localStorage.setItem('remembered_username', username.trim())
      else localStorage.removeItem('remembered_username')
      login(data.user, data.token)
    } catch (err) {
      if (err.code === 'account_not_activated') {
        setShowActivationModal(true)
      } else {
        setError(err.message || 'Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {showActivationModal && (
        <ActivationNeededModal username={username.trim()} onClose={() => setShowActivationModal(false)} />
      )}

      {sessionExpired && (
        <div style={{ background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: '0.85rem', color: '#92400e', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span>⚠️</span>
          <span>Your session expired — the server restarted. Please sign in again.</span>
        </div>
      )}

      {error && <div className="error-msg">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="input-icon-group">
          <label>Username</label>
          <div className="input-icon-wrap">
            <span className="field-icon">👤</span>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. parent1 or kid1"
              autoFocus
            />
          </div>
        </div>

        <div className="input-icon-group">
          <label>Password</label>
          <div className="input-icon-wrap">
            <span className="field-icon">🔒</span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
            />
            <button
              type="button"
              className="toggle-visibility"
              onClick={() => setShowPassword(v => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>
        </div>

        <div className="login-options-row">
          <label className="remember-me">
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ display: 'none' }} />
            <span className={`checkbox-box${remember ? ' checked' : ''}`}>{remember && '✓'}</span>
            Remember me
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="forgot-link"
              onClick={() => { setShowForgotPassword(v => !v); setShowForgotUsername(false) }}
            >
              Forgot password?
            </button>
            <button
              type="button"
              className="forgot-link"
              onClick={() => { setShowForgotUsername(v => !v); setShowForgotPassword(false) }}
            >
              Forgot username?
            </button>
          </div>
        </div>

        {showForgotPassword && <ForgotPasswordPanel />}
        {showForgotUsername && <ForgotUsernamePanel />}

        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? 'Signing in...' : <>Sign In <span aria-hidden="true">→</span></>}
        </button>
      </form>

      <div className="login-divider">New here?</div>

      <button type="button" className="login-btn-outline" onClick={onRegister}>
        Create your free account <span aria-hidden="true">→</span>
      </button>
    </>
  )
}

// ── Demo box ──────────────────────────────────────────────────────────────────

const DEMO_ACCOUNTS = {
  parent: { label: 'Parent', avatar: '🧑', username: 'parent1', password: 'pass1' },
  kid:    { label: 'Kid',    avatar: '🧒', username: 'kid1',    password: 'pass1' },
}

function DemoBox() {
  const { login } = useAuth()
  const [selected, setSelected] = useState('parent')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLaunch() {
    setError('')
    setLoading(true)
    try {
      const acc = DEMO_ACCOUNTS[selected]
      const data = await api.login(acc.username, acc.password)
      login(data.user, data.token)
    } catch (err) {
      setError(err.message || 'Could not start the demo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="demo-box">
      <div className="demo-box-title">🎮 Try Demo</div>
      {error && <div className="error-msg" style={{ marginBottom: 10 }}>{error}</div>}
      <div className="demo-options">
        {Object.entries(DEMO_ACCOUNTS).map(([key, acc]) => (
          <div
            key={key}
            className={`demo-option${selected === key ? ' selected' : ''}`}
            onClick={() => setSelected(key)}
          >
            <div className="demo-avatar">{acc.avatar}</div>
            <div className="demo-option-text">
              <div className="demo-option-name">{acc.label}</div>
              <div className="demo-option-cred">{acc.username} / {acc.password}</div>
            </div>
          </div>
        ))}
      </div>
      <button className="launch-demo-btn" onClick={handleLaunch} disabled={loading}>
        {loading ? 'Launching...' : <>🚀 Launch Demo</>}
      </button>
    </div>
  )
}

// ── How It Works modal ───────────────────────────────────────────────────────

function HowItWorksModal({ onClose }) {
  return createPortal(
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 20, maxWidth: 480, width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}
      >
        {/* Header */}
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f766e' }}>🏆 How It Works</div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>A chore &amp; reward app for the whole family</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>✕</button>
        </div>

        {/* Cards */}
        <div style={{ overflowY: 'auto', padding: '18px 22px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {LOGIN_HELP_CARDS.map(c => (
            <div key={c.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg,#f0fdfa,#ccfbf1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                {c.icon}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', marginBottom: 3 }}>{c.title}</div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.55 }}>{c.text}</div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 6, padding: '10px 14px', background: '#f0fdfa', borderRadius: 10, fontSize: '0.8rem', color: '#115e59' }}>
            👑 <strong>Parents</strong> register an account · 🧒 <strong>Kids</strong> log in with credentials the parent creates for them
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Account activation page (/activate?token=...) ──────────────────────────────

export function ActivatePage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading | success | error
  const [message, setMessage] = useState('')
  const requested = useRef(false)

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token')
    if (!token) {
      setStatus('error')
      setMessage('This activation link is missing its token.')
      return
    }
    // Guard against firing twice — React StrictMode double-invokes effects in dev,
    // and the token is single-use, so a second call would wrongly report failure.
    if (requested.current) return
    requested.current = true
    api.activateAccount(token)
      .then(data => {
        setStatus('success')
        setMessage(data.message)
      })
      .catch(err => {
        setStatus('error')
        setMessage(err.message)
      })
  }, [])

  return (
    <div className="login-wrapper" style={{ flexDirection: 'column', gap: 0, padding: '24px 16px' }}>
      <div className="login-shell">
        <div className="login-card" style={{ textAlign: 'center' }}>
          {status === 'loading' && (
            <p style={{ fontSize: '0.95rem', color: '#64748b' }}>Activating your account…</p>
          )}
          {status === 'success' && (
            <>
              <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>✅</div>
              <h1 className="login-title">Account Activated!</h1>
              <p className="login-subtitle">{message}</p>
              <button className="login-btn" onClick={() => navigate('/')}>
                Go to Sign In <span aria-hidden="true">→</span>
              </button>
            </>
          )}
          {status === 'error' && (
            <>
              <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>⚠️</div>
              <h1 className="login-title">Activation Failed</h1>
              <p className="login-subtitle">{message}</p>
              <button className="login-btn" onClick={() => navigate('/')}>
                Go to Sign In <span aria-hidden="true">→</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Password reset page (/reset-password?token=...) ────────────────────────────

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const token = new URLSearchParams(window.location.search).get('token')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState(token ? 'form' : 'error') // form | success | error
  const [message, setMessage] = useState(token ? '' : 'This password reset link is missing its token.')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const pwCheck = checkPasswordComplexity(password)
    if (!pwCheck.ok) {
      setError(pwCheck.message)
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const data = await api.resetPassword(token, password)
      setStatus('success')
      setMessage(data.message)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrapper" style={{ flexDirection: 'column', gap: 0, padding: '24px 16px' }}>
      <div className="login-shell">
        <div className="login-card" style={{ textAlign: status === 'form' ? 'left' : 'center' }}>
          {status === 'form' && (
            <>
              <h1 className="login-title">Reset Password</h1>
              <p className="login-subtitle">Choose a new password for your account.</p>
              {error && <div className="error-msg">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label>New Password *</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="e.g. Sunshine24!" />
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>{PASSWORD_REQUIREMENTS_HINT}</div>
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label>Confirm Password *</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password" />
                </div>
                <button type="submit" className="login-btn" disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}
          {status === 'success' && (
            <>
              <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>✅</div>
              <h1 className="login-title">Password Reset!</h1>
              <p className="login-subtitle">{message}</p>
              <button className="login-btn" onClick={() => navigate('/')}>
                Go to Sign In <span aria-hidden="true">→</span>
              </button>
            </>
          )}
          {status === 'error' && (
            <>
              <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>⚠️</div>
              <h1 className="login-title">Something Went Wrong</h1>
              <p className="login-subtitle">{message}</p>
              <button className="login-btn" onClick={() => navigate('/')}>
                Go to Sign In <span aria-hidden="true">→</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Shell ─────────────────────────────────────────────────────────────────────

export default function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [showHelp, setShowHelp] = useState(false)
  const [showLegal, setShowLegal] = useState(false)

  const fixedBtnStyle = {
    background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(8px)',
    border: '1px solid rgba(15,23,42,0.08)', color: '#166534',
    borderRadius: 8, padding: '7px 16px', cursor: 'pointer',
    fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6,
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
  }

  return (
    <div className="login-wrapper" style={{ flexDirection: 'column', gap: 0, padding: '24px 16px' }}>
      {/* Fixed top-right nav buttons */}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 999, display: 'flex', gap: 8 }}>
        <button onClick={() => setShowHelp(true)} style={fixedBtnStyle}>❓ How It Works</button>
        <button onClick={() => navigate('/blog')} style={fixedBtnStyle}>📖 Blog</button>
      </div>

      {showHelp && <HowItWorksModal onClose={() => setShowHelp(false)} />}
      {showLegal && <UserAgreementModal onClose={() => setShowLegal(false)} />}

      <div className="login-shell">
        {mode === 'login' ? (
          <>
            <div className="login-hero">
              <span className="hero-decor star">⭐</span>
              <span className="hero-decor check">✅</span>
              <span className="hero-decor heart">❤️</span>
              <span className="hero-decor gift">🎁</span>
              <span className="hero-decor coin">🪙</span>
              <div className="hero-family">
                <span className="hero-parent left">👨</span>
                <span className="hero-parent right">👩</span>
                <span className="hero-kid left">👦</span>
                <span className="hero-kid right">👧</span>
                <span className="hero-trophy">🏆</span>
              </div>
            </div>
            <h1 className="brand-wordmark">
              <span className="brand-reward">Reward</span><span className="brand-ur">Ur</span><span className="brand-kids">Kids</span>
            </h1>
            <p className="brand-tagline">Turn chores into rewards kids love.</p>
          </>
        ) : (
          <div style={{ textAlign: 'center', fontSize: '1.4rem', fontWeight: 800, marginBottom: 18 }}>
            🏆 <span className="brand-reward">Reward</span><span className="brand-ur">Ur</span><span className="brand-kids">Kids</span>
          </div>
        )}

        <div className="login-card">
          {mode === 'login'
            ? <LoginForm onRegister={() => setMode('register')} />
            : <RegisterForm onBack={() => setMode('login')} />
          }
        </div>

        {mode === 'login' && (
          <>
            <DemoBox />
            <div className="login-stars">⭐⭐⭐⭐⭐</div>
            <div className="login-footer-links">
              <button onClick={() => setShowLegal(true)}>Privacy Policy</button>
              {' · '}
              <button onClick={() => setShowLegal(true)}>Terms of Use</button>
              {' · '}
              <button onClick={() => { window.location.href = 'mailto:ravindragsingh@gmail.com' }}>Contact Us</button>
              {' · '}
              <button onClick={() => setShowHelp(true)}>Help</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
