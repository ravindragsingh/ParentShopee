import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Login from './components/Login.jsx'
import ParentDashboard from './components/ParentDashboard.jsx'
import KidDashboard from './components/KidDashboard.jsx'
import AdminDashboard from './components/AdminDashboard.jsx'

function AppInner() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading-text" style={{ marginTop: '20vh', fontSize: '1.2rem' }}>Loading...</div>
  }

  if (!user) return <Login />
  if (user.role === 'admin')  return <AdminDashboard />
  if (user.role === 'parent') return <ParentDashboard />
  if (user.role === 'kid')    return <KidDashboard />
  return <div className="loading-text">Unknown role: {user.role}</div>
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
