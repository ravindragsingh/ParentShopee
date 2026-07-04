import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api.js'
import { LoginHelp } from './Help.jsx'

// ── Facebook SDK loader ───────────────────────────────────────────────────────

function useFacebookSDK() {
  const [ready, setReady] = useState(!!window.FB)
  useEffect(() => {
    if (window.FB) { setReady(true); return }
    window.fbAsyncInit = () => {
      window.FB.init({
        appId: import.meta.env.VITE_FACEBOOK_APP_ID || '',
        cookie: true, xfbml: false, version: 'v19.0',
      })
      setReady(true)
    }
    if (!document.getElementById('facebook-jssdk')) {
      const s = document.createElement('script')
      s.id = 'facebook-jssdk'
      s.src = 'https://connect.facebook.net/en_US/sdk.js'
      s.async = true; s.defer = true
      document.body.appendChild(s)
    }
  }, [])
  return ready
}

// ── Social login buttons (shared between Login and Register) ──────────────────

function SocialButtons({ onSuccess, onError, loading }) {
  const fbReady = useFacebookSDK()

  function handleFacebook() {
    if (!import.meta.env.VITE_FACEBOOK_APP_ID) {
      onError('Facebook login is not configured yet.')
      return
    }
    if (!fbReady || !window.FB) {
      onError('Facebook SDK is still loading — please try again in a moment.')
      return
    }
    window.FB.login(resp => {
      if (resp.authResponse) {
        onSuccess('facebook', resp.authResponse.accessToken)
      } else {
        onError('Facebook sign-in was cancelled.')
      }
    }, { scope: 'public_profile,email' })
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 14px' }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.25)' }} />
        <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)', fontWeight: 500, whiteSpace: 'nowrap' }}>or continue with</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.25)' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Google */}
        {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
          <GoogleLogin
            onSuccess={c => onSuccess('google', c.credential)}
            onError={() => onError('Google sign-in failed. Please try again.')}
            width="100%"
            size="large"
            text="continue_with"
            theme="filled_black"
            shape="rectangular"
          />
        ) : (
          <button type="button" disabled style={socialBtnStyle('#4285F4', true)}>
            <GoogleIcon /> Google (not configured)
          </button>
        )}

        {/* Facebook */}
        <button
          type="button"
          onClick={handleFacebook}
          disabled={loading}
          style={socialBtnStyle('#1877f2')}
        >
          <FacebookIcon />
          Continue with Facebook
        </button>
      </div>

      <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
        Social sign-in creates or accesses a parent account. By continuing you agree to our User Agreement.
      </p>
    </div>
  )
}

function socialBtnStyle(bg, disabled = false) {
  return {
    width: '100%', padding: '10px 16px',
    background: disabled ? '#94a3b8' : bg,
    color: '#fff', border: 'none', borderRadius: 6,
    fontSize: '0.875rem', fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    opacity: disabled ? 0.6 : 1,
  }
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.3 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.9 6.6 29.2 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.3-.1-2.7-.4-4z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.4 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.9 6.6 29.2 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.8-1.9 13.4-5l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.6-3.5-11.2-8.2l-6.6 5.1C9.7 39.6 16.4 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.8l6.2 5.2C40.8 35.5 44 30.1 44 24c0-1.3-.1-2.7-.4-4z"/>
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
}

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
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>ParentShopee · Effective June 2026</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>✕</button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', padding: '18px 22px', fontSize: '0.82rem', color: '#334155', lineHeight: 1.65 }}>

          <Section title="1. About ParentShopee">
            ParentShopee is a family management app that allows parents to assign chores to children, award points, and let children redeem those points in a family shop. By creating an account you agree to use the app only for lawful family management purposes.
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
            You agree not to use ParentShopee to:
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
            Points awarded within the app have no monetary value and cannot be exchanged for real money. Parents retain full discretion over awarding and adjusting points. ParentShopee is not responsible for disputes arising from point adjustments made by parents.
          </Section>

          <Section title="8. Data Storage">
            Your account data (name, email, username, hashed password, and family records) is stored securely on our servers. We do not sell or share your personal data with advertisers. You may request deletion of your account and all associated data by contacting us via the Contact Us form in the app.
          </Section>

          <Section title="9. Service Availability">
            We strive for high availability but do not guarantee uninterrupted access. We reserve the right to perform maintenance, updates, or to discontinue the service with reasonable notice.
          </Section>

          <Section title="10. Changes to This Agreement">
            We may update this agreement from time to time. Continued use of ParentShopee after changes are posted constitutes acceptance of the revised agreement. We will notify you of significant changes via the email address on your account.
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
  const [socialLoading, setSocialLoading] = useState(false)

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSocialLogin(provider, token) {
    setSocialLoading(true); setError('')
    try {
      const data = provider === 'google'
        ? await api.loginWithGoogle(token)
        : await api.loginWithFacebook(token)
      login(data.user, data.token)
    } catch (err) {
      setError(err.message)
    } finally {
      setSocialLoading(false)
    }
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
      <p className="login-subtitle">Parents only · Quick sign-up with Google or Facebook</p>

      {error && <div className="error-msg">{error}</div>}

      <SocialButtons
        onSuccess={handleSocialLogin}
        onError={msg => setError(msg)}
        loading={socialLoading}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 14px' }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.25)' }} />
        <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)', fontWeight: 500, whiteSpace: 'nowrap' }}>or sign up with email</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.25)' }} />
      </div>

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
  const [socialLoading, setSocialLoading] = useState(false)
  const [sessionExpired] = useState(() => {
    const expired = localStorage.getItem('session_expired') === '1'
    if (expired) localStorage.removeItem('session_expired')
    return expired
  })

  async function handleSocialLogin(provider, token) {
    setSocialLoading(true); setError('')
    try {
      const data = provider === 'google'
        ? await api.loginWithGoogle(token)
        : await api.loginWithFacebook(token)
      login(data.user, data.token)
    } catch (err) {
      setError(err.message)
    } finally {
      setSocialLoading(false)
    }
  }

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
      <h1 className="login-title">ParentShopee</h1>
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
        <button type="submit" className="login-btn" disabled={loading || socialLoading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <SocialButtons
        onSuccess={handleSocialLogin}
        onError={msg => setError(msg)}
        loading={socialLoading}
      />

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>
          New parent?{' '}
          <button onClick={onRegister} style={{ background: 'none', border: 'none', color: '#c4b5fd', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
            Create an account
          </button>
        </p>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>
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
