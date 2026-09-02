import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'

const AuthContext = createContext(null)

const INACTIVITY_LIMIT_MS = 30 * 60 * 1000  // 30 minutes
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart']

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [deviceToken, setDeviceToken] = useState(null)
  // Unlike `user` (which is replaced by whichever profile is currently active,
  // and cleared entirely by switchProfile), this stays put for the whole
  // device session -- it's how the profile picker recognizes "this is still
  // the same family" after switching away from a profile.
  const [deviceUsername, setDeviceUsername] = useState(null)
  const [profileEntered, setProfileEntered] = useState(false)
  const [loading, setLoading] = useState(true)
  const lastActivityRef = useRef(Date.now())

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    const savedDeviceToken = localStorage.getItem('device_token')
    const savedDeviceUsername = localStorage.getItem('device_username')
    const savedProfileEntered = localStorage.getItem('profile_entered') === '1'
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    if (savedDeviceToken) setDeviceToken(savedDeviceToken)
    if (savedDeviceUsername) setDeviceUsername(savedDeviceUsername)
    setProfileEntered(savedProfileEntered)
    setLoading(false)

    function handleExpired() {
      setUser(null)
      setToken(null)
      setDeviceToken(null)
      setDeviceUsername(null)
      setProfileEntered(false)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('device_token')
      localStorage.removeItem('device_username')
      localStorage.removeItem('profile_entered')
      localStorage.setItem('session_expired', '1')
    }

    window.addEventListener('auth:expired', handleExpired)
    return () => window.removeEventListener('auth:expired', handleExpired)
  }, [])

  // Step 1: the family's real username+password login. Establishes the
  // "device" session (used only to list/enter profiles) and, until a profile
  // is explicitly chosen, also acts as the provisional active identity.
  function login(userData, authToken) {
    setUser(userData)
    setToken(authToken)
    setDeviceToken(authToken)
    setDeviceUsername(userData.username)
    setProfileEntered(false)
    localStorage.setItem('token', authToken)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('device_token', authToken)
    localStorage.setItem('device_username', userData.username)
    localStorage.removeItem('profile_entered')
  }

  // Step 2: a profile was picked from the Netflix-style picker — either the
  // guardian's own ("continue as me", no PIN) or a kid/co-guardian after a
  // correct PIN. Replaces the active identity; deviceToken is untouched so
  // "Switch Profile" can come back here without re-entering the password.
  function enterProfile(userData, authToken) {
    setUser(userData)
    setToken(authToken)
    setProfileEntered(true)
    localStorage.setItem('token', authToken)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('profile_entered', '1')
  }

  // Return to the profile picker without a full sign-out — the device stays
  // authenticated to the family, only the active profile is cleared.
  const switchProfile = useCallback(() => {
    setUser(null)
    setToken(null)
    setProfileEntered(false)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('profile_entered')
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    setDeviceToken(null)
    setDeviceUsername(null)
    setProfileEntered(false)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('device_token')
    localStorage.removeItem('device_username')
    localStorage.removeItem('profile_entered')
  }, [])

  // Auto-logout after INACTIVITY_LIMIT_MS with no mouse/keyboard/scroll/touch activity.
  useEffect(() => {
    if (!deviceToken) return
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
  }, [deviceToken, logout])

  return (
    <AuthContext.Provider value={{
      user, token, deviceToken, deviceUsername, profileEntered, loading,
      login, enterProfile, switchProfile, logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
