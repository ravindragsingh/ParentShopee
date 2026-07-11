import HamburgerMenu from './HamburgerMenu.jsx'

export default function AppNavbar({
  variant = 'parent',
  title = '🏆 Reward Ur Kids',
  userName,
  avatar,
  onLogout,
  tab,
  setTab,
  role = variant,
  children,
}) {
  return (
    <nav className={`navbar ${variant}`}>
      <div className="navbar-brand">
        <span className="navbar-brand-icon">🏆</span>
        <span className="navbar-brand-text">{title.replace(/^🏆\s*/, '')}</span>
      </div>
      <div className="navbar-user">
        {avatar && <span className={variant === 'kid' ? 'kid-avatar lg' : ''}>{avatar}</span>}
        <span>Hi, {userName}!</span>
        {children}
        {setTab && (
          <HamburgerMenu tab={tab} setTab={setTab} role={role} onLogout={onLogout} />
        )}
      </div>
    </nav>
  )
}
