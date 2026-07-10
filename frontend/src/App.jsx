import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Login, { ActivatePage } from './components/Login.jsx'
import ParentDashboard from './components/ParentDashboard.jsx'
import KidDashboard from './components/KidDashboard.jsx'
import AdminDashboard from './components/AdminDashboard.jsx'
import Blogs from './components/Blogs.jsx'

function LoginRoute() {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-text" style={{ marginTop: '20vh', fontSize: '1.2rem' }}>Loading...</div>
  if (user) return <Navigate to="/dashboard" replace />
  return <Login />
}

function DashboardRoute() {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-text" style={{ marginTop: '20vh', fontSize: '1.2rem' }}>Loading...</div>
  if (!user) return <Navigate to="/" replace />
  if (user.role === 'admin')  return <AdminDashboard />
  if (user.role === 'parent') return <ParentDashboard />
  if (user.role === 'kid')    return <KidDashboard />
  return <div className="loading-text">Unknown role: {user.role}</div>
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/"           element={<LoginRoute />} />
          <Route path="/blog"       element={<Blogs />} />
          <Route path="/blog/:slug" element={<Blogs />} />
          <Route path="/activate"   element={<ActivatePage />} />
          <Route path="/dashboard"  element={<DashboardRoute />} />
          <Route path="*"           element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
