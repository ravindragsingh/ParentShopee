import { useAuth } from '../context/AuthContext.jsx'
import AppNavbar from './AppNavbar.jsx'

export default function TeacherDashboard() {
  const { user, logout } = useAuth()

  return (
    <div className="app-container">
      <AppNavbar variant="teacher" userName={user.name}>
        <button className="logout-btn" onClick={logout}>🚪 Sign Out</button>
      </AppNavbar>

      <div className="main-content">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🍎</div>
          <h2 style={{ fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>Welcome, {user.name}!</h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>
            Your teacher account is set up. Classroom tools — adding students and assigning Maths topics — are coming soon.
          </p>
        </div>
      </div>
    </div>
  )
}
