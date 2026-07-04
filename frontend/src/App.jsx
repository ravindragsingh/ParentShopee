import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Login from './components/Login.jsx'
import ParentDashboard from './components/ParentDashboard.jsx'
import KidDashboard from './components/KidDashboard.jsx'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function AppInner() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading-text" style={{ marginTop: '20vh', fontSize: '1.2rem' }}>Loading...</div>
  }

  if (!user) return <Login />
  if (user.role === 'parent') return <ParentDashboard />
  if (user.role === 'kid') return <KidDashboard />
  return <div className="loading-text">Unknown role: {user.role}</div>
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </GoogleOAuthProvider>
  )
}
