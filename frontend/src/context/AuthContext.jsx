import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'

const AuthContext = createContext(null)

const INACTIVITY_LIMIT_MS = 30 * 60 * 1000  // 30 minutes
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart']

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const lastActivityRef = useRef(Date.now())

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)

    function handleExpired() {
      setUser(null)
      setToken(null)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.setItem('session_expired', '1')
    }

    window.addEventListener('auth:expired', handleExpired)
    return () => window.removeEventListener('auth:expired', handleExpired)
  }, [])

  function login(userData, authToken) {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem('token', authToken)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }, [])

  // Auto-logout after INACTIVITY_LIMIT_MS with no mouse/keyboard/scroll/touch activity.
  useEffect(() => {
    if (!token) return
    lastActivityRef.current = Date.now()
    function markActive() { lastActivityRef.current = Date.now() }
    ACTIVITY_EVENTS.forEach(evt => window.addEventListener(evt, markActive))
    const interval = setInterval(() => {
      if (Date.now() - lastActivityRef.current > INACTIVITY_LIMIT_MS) {
        localStorage.setItem('logged_out_inactivity', '1')
        logout()
      }
    }, 30000)
    return () => {
      ACTIVITY_EVENTS.forEach(evt => window.removeEventListener(evt, markActive))
      clearInterval(interval)
    }
  }, [token, logout])

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
