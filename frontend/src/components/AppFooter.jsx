import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HowItWorksModal, UserAgreementModal } from './Login.jsx'
import { useTour } from '../tour/TourContext.jsx'

const linkStyle = {
  background: 'none', border: 'none', color: '#64748b', fontSize: '0.8rem',
  fontWeight: 600, cursor: 'pointer', padding: '4px 2px', display: 'flex', alignItems: 'center', gap: 5,
}

// Present on every authenticated page (both dashboards persistently render
// this outside their tab-switching content, same way AppNavbar sits at the
// top) -- Admin Panel and Guided Tour only make sense for a guardian, so
// they're omitted entirely for a kid rather than shown broken/disabled.
export default function AppFooter({ role, onNavigate }) {
  const navigate = useNavigate()
  const [showHelp, setShowHelp] = useState(false)
  const [showLegal, setShowLegal] = useState(false)
  const { startTour } = useTour()

  return (
    <>
      {showHelp && <HowItWorksModal onClose={() => setShowHelp(false)} />}
      {showLegal && <UserAgreementModal onClose={() => setShowLegal(false)} />}
      <div style={{
        marginTop: 32, padding: '18px 16px', borderTop: '1px solid #e2e8f0',
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center',
        gap: '6px 20px',
      }}>
        <button style={linkStyle} onClick={() => setShowHelp(true)}>❓ How It Works</button>
        <button style={linkStyle} onClick={() => navigate('/blog')}>📖 Blog</button>
        <button style={linkStyle} onClick={() => setShowLegal(true)}>📋 Terms of Use</button>
        {role === 'guardian' && (
          <button style={linkStyle} onClick={() => onNavigate('admin')}>🛡️ Admin Panel</button>
        )}
        {role === 'guardian' && (
          <button style={linkStyle} onClick={() => startTour('guardianOnboarding')}>🧭 Guided Tour</button>
        )}
      </div>
    </>
  )
}
