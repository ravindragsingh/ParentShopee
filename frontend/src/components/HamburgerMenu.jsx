import { useState, useEffect, useRef } from 'react'

export default function HamburgerMenu({ tab, setTab, role }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const btnRef  = useRef(null)
  const dropRef = useRef(null)

  const isMenuTab   = ['messages', 'help', 'settings'].includes(tab)
  const accent      = role === 'parent' ? '#7c3aed' : '#059669'
  const accentBg    = role === 'parent' ? '#f5f3ff' : '#f0fdf4'
  const activeClass = role === 'parent' ? ' active parent' : ' active kid'

  function handleToggle() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 6, right: window.innerWidth - r.right })
    }
    setOpen(v => !v)
  }

  // Close on any click outside button + dropdown
  useEffect(() => {
    if (!open) return
    function onDown(e) {
      const inBtn  = btnRef.current  && btnRef.current.contains(e.target)
      const inDrop = dropRef.current && dropRef.current.contains(e.target)
      if (!inBtn && !inDrop) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // Close on scroll (keeps position accurate)
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('scroll', close, true)
    return () => window.removeEventListener('scroll', close, true)
  }, [open])

  const items = [
    { id: 'messages', icon: '💬', label: 'Messages' },
    { id: 'help',     icon: '❓', label: 'Help'     },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ]

  return (
    <>
      <button
        ref={btnRef}
        className={`tab-btn${isMenuTab ? activeClass : ''}`}
        onClick={handleToggle}
        title="More"
        style={{ fontSize: '1.15rem', padding: '10px 16px', marginLeft: 'auto', flexShrink: 0 }}
      >
        {open ? '✕' : '☰'}
      </button>

      {open && (
        <div
          ref={dropRef}
          style={{
            position: 'fixed',
            top: pos.top,
            right: pos.right,
            zIndex: 9999,
            background: 'white',
            borderRadius: 14,
            boxShadow: '0 12px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
            minWidth: 195,
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            animation: 'fadeSlideDown 0.15s ease',
          }}
        >
          {items.map((item, i) => (
            <button
              key={item.id}
              onClick={() => { setTab(item.id); setOpen(false) }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '14px 18px',
                background: tab === item.id ? accentBg : 'white',
                border: 'none',
                borderBottom: i < items.length - 1 ? '1px solid #f1f5f9' : 'none',
                cursor: 'pointer',
                color: tab === item.id ? accent : '#334155',
                fontWeight: tab === item.id ? 700 : 500,
                fontSize: '0.93rem',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontSize: '1.05rem' }}>{item.icon}</span>
              {item.label}
              {tab === item.id && (
                <span style={{
                  marginLeft: 'auto', width: 7, height: 7,
                  borderRadius: '50%', background: accent, flexShrink: 0,
                }} />
              )}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
