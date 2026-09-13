// A small pill switch, used instead of a bare checkbox for guardian
// enable/disable controls -- reads more clearly at a glance across a grid
// of several age-band rows.
export default function Toggle({ checked, onChange, disabled, color = '#0d9488' }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      style={{
        width: 40, height: 22, borderRadius: 999, border: 'none', padding: 2,
        background: checked ? color : '#cbd5e1', cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.6 : 1, transition: 'background 0.15s ease', flexShrink: 0,
        display: 'inline-flex', alignItems: 'center',
      }}
    >
      <span style={{
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'transform 0.15s ease',
        transform: checked ? 'translateX(18px)' : 'translateX(0)',
      }} />
    </button>
  )
}
