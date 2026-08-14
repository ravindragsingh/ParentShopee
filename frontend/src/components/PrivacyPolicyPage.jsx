import { useNavigate } from 'react-router-dom'
import { LegalAgreementSections } from './Login.jsx'

// Public, unauthenticated page hosting the same content shown in the in-app
// User Agreement modal — needed as a standalone URL for app store submissions
// (Google Play Console and App Store Connect both require a privacy policy URL).
export default function PrivacyPolicyPage() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ background: 'linear-gradient(135deg,#0f766e,#0d9488)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 10px rgba(0,0,0,0.12)' }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>🏆 Reward Ur Kids</span>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)', color: '#fff', borderRadius: 8, padding: '6px 16px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
        >
          Sign In
        </button>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 60px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>📋 Privacy Policy &amp; User Agreement</h1>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 28 }}>Reward Ur Kids · Effective June 2026</p>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '24px 28px', fontSize: '0.9rem', color: '#334155', lineHeight: 1.7 }}>
          <LegalAgreementSections />
        </div>
      </div>
    </div>
  )
}
