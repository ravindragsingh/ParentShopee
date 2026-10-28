// Fixed bottom tab bar -- replaces the old horizontal-scrolling `.tabs`
// strip, which on most phones cut off mid-label (and could hide the
// currently active tab entirely) once a 6th item was added. Standard mobile
// pattern instead: icon-over-label, every item visible at once, no scrolling
// to discover what's there.
export default function BottomNav({ items, active, onChange, variant = 'guardian' }) {
  return (
    <nav className={`bottom-nav ${variant}`}>
      {items.map(item => (
        <button
          key={item.key}
          className={`bottom-nav-item${active === item.key ? ' active' : ''}`}
          onClick={() => onChange(item.key)}
        >
          <span className="bottom-nav-icon">{item.icon}</span>
          <span className="bottom-nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
