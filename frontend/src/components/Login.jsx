import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api.js'

// ── Register form ─────────────────────────────────────────────────────────────

function RegisterForm({ onBack }) {
  const { login } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '', confirmPassword: '', dateOfBirth: '', gender: '' })
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
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label>Confirm Password *</label>
          <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Repeat password" />
        </div>
        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p style={{ marginTop: 16, textAlign: 'center', fontSize: '0.85rem' }}>
        Already have an account?{' '}
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontWeight: 600 }}>
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
          <button onClick={onRegister} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
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
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-logo">🛒</div>
        {mode === 'login'
          ? <LoginForm onRegister={() => setMode('register')} />
          : <RegisterForm onBack={() => setMode('login')} />
        }
      </div>
    </div>
  )
}
