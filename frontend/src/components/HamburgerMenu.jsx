import { useState, useEffect, useRef } from 'react'

export default function HamburgerMenu({ tab, setTab, role }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const isMenuTab = ['messages', 'help', 'settings'].includes(tab)
  const accent     = role === 'parent' ? '#7c3aed' : '#059669'
  const accentBg   = role === 'parent' ? '#f5f3ff' : '#f0fdf4'
  const activeClass = role === 'parent' ? ' active parent' : ' active kid'

  // Close on outside click
  useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    if (open) document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  const items = [
    { id: 'messages', icon: '💬', label: 'Messages' },
    { id: 'help',     icon: '❓', label: 'Help' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ]

  return (
    <div ref={ref} style={{ position: 'relative', marginLeft: 'auto', flexShrink: 0 }}>
      <button
        className={`tab-btn${isMenuTab ? activeClass : ''}`}
        onClick={() => setOpen(v => !v)}
        title="More"
        style={{ fontSize: '1.15rem', padding: '10px 16px', letterSpacing: 1 }}
      >
        {open ? '✕' : '☰'}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 200,
          background: 'white', borderRadius: 14,
          boxShadow: '0 10px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
          minWidth: 190, overflow: 'hidden',
          border: '1px solid #f1f5f9',
          animation: 'fadeSlideDown 0.15s ease',
        }}>
          {items.map((item, i) => (
            <button
              key={item.id}
              onClick={() => { setTab(item.id); setOpen(false) }}
              style={{
                width: '100%', textAlign: 'left',
                padding: '13px 18px',
                background: tab === item.id ? accentBg : 'white',
                border: 'none',
                borderBottom: i < items.length - 1 ? '1px solid #f8fafc' : 'none',
                cursor: 'pointer',
                color: tab === item.id ? accent : '#334155',
                fontWeight: tab === item.id ? 700 : 500,
                fontSize: '0.92rem',
                display: 'flex', alignItems: 'center', gap: 10,
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => { if (tab !== item.id) e.currentTarget.style.background = '#f8fafc' }}
              onMouseLeave={e => { if (tab !== item.id) e.currentTarget.style.background = 'white' }}
            >
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
              {item.label}
              {tab === item.id && (
                <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: accent }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
