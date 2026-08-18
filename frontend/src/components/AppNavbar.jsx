import HamburgerMenu from './HamburgerMenu.jsx'

export default function AppNavbar({
  variant = 'guardian',
  userName,
  avatar,
  onLogout,
  onSwitchProfile,
  tab,
  setTab,
  role = variant,
  children,
}) {
  return (
    <nav className={`navbar ${variant}`}>
      <div className="navbar-brand">
        <div style={{ background: '#fff', borderRadius: 10, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
          <img src="/branding/RewardURKids_Website_Compact_Logo.png" alt="Reward Ur Kids" style={{ height: 26, display: 'block' }} />
        </div>
      </div>
      <div className="navbar-user">
        {avatar && <span className={variant === 'kid' ? 'kid-avatar lg' : ''}>{avatar}</span>}
        <span>Hi, {userName}!</span>
        {children}
        {setTab && (
          <HamburgerMenu tab={tab} setTab={setTab} role={role} onLogout={onLogout} onSwitchProfile={onSwitchProfile} />
        )}
      </div>
    </nav>
  )
}
