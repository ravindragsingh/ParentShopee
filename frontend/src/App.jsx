import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Login, { ActivatePage, ResetPasswordPage } from './components/Login.jsx'
import ProfilePicker from './components/ProfilePicker.jsx'
import ParentDashboard from './components/ParentDashboard.jsx'
import KidDashboard from './components/KidDashboard.jsx'
import AdminDashboard from './components/AdminDashboard.jsx'
import Blogs from './components/Blogs.jsx'

function Loading() {
  return <div className="loading-text" style={{ marginTop: '20vh', fontSize: '1.2rem' }}>Loading...</div>
}

function LoginRoute() {
  const { user, deviceToken, loading } = useAuth()
  if (loading) return <Loading />
  if (user) return <Navigate to={user.role === 'admin' ? '/dashboard' : '/profiles'} replace />
  // Mid "Switch Profile" (device still authenticated, no active profile yet)
  // should never fall back to the password form.
  if (deviceToken) return <Navigate to="/profiles" replace />
  return <Login />
}

function ProfilePickerRoute() {
  const { user, deviceToken, loading } = useAuth()
  if (loading) return <Loading />
  if (!deviceToken) return <Navigate to="/" replace />
  if (user?.role === 'admin') return <Navigate to="/dashboard" replace />
  return <ProfilePicker />
}

function DashboardRoute() {
  const { user, loading, profileEntered } = useAuth()
  if (loading) return <Loading />
  if (!user) return <Navigate to="/" replace />
  // Admin has no family/profile concept — every other role must pick a
  // profile (even "continue as me") before reaching its dashboard.
  if (user.role !== 'admin' && !profileEntered) return <Navigate to="/profiles" replace />
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
          <Route path="/activate"       element={<ActivatePage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/profiles"  element={<ProfilePickerRoute />} />
          <Route path="/dashboard" element={<DashboardRoute />} />
          <Route path="*"           element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
