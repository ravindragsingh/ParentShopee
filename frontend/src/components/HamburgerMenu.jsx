import { useState, useEffect, useRef, useCallback } from 'react'

export default function HamburgerMenu({ tab, setTab, role }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const btnRef  = useRef(null)
  const dropRef = useRef(null)

  const menuTabIds = role === 'parent'
    ? ['co-parent', 'messages', 'help', 'settings']
    : ['messages', 'help', 'settings']

  const isMenuTab   = menuTabIds.includes(tab)
  const accent      = role === 'parent' ? '#7c3aed' : '#059669'
  const accentBg    = role === 'parent' ? '#f5f3ff' : '#f0fdf4'
  const activeClass = role === 'parent' ? ' active parent' : ' active kid'

  // Compute dropdown position using visualViewport when available (fixes mobile rotation bug)
  const computePos = useCallback(() => {
    if (!btnRef.current) return
    const r  = btnRef.current.getBoundingClientRect()
    // visualViewport gives the actual visible area on mobile (accounts for browser chrome, zoom)
    const vw = window.visualViewport?.width ?? window.innerWidth
    const vt = window.visualViewport?.offsetTop ?? 0
    setPos({ top: r.bottom + vt + 6, right: vw - r.right })
  }, [])

  function handleToggle() {
    if (!open) computePos()
    setOpen(v => !v)
  }

  // Re-sync position whenever the visual viewport changes (rotation, zoom, keyboard)
  useEffect(() => {
    if (!open) return
    const vv = window.visualViewport
    if (vv) {
      vv.addEventListener('resize', computePos)
      vv.addEventListener('scroll', computePos)
    }
    window.addEventListener('resize', computePos)
    return () => {
      if (vv) {
        vv.removeEventListener('resize', computePos)
        vv.removeEventListener('scroll', computePos)
      }
      window.removeEventListener('resize', computePos)
    }
  }, [open, computePos])

  // Close on click outside
  useEffect(() => {
    if (!open) return
    function onDown(e) {
      const inBtn  = btnRef.current  && btnRef.current.contains(e.target)
      const inDrop = dropRef.current && dropRef.current.contains(e.target)
      if (!inBtn && !inDrop) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
    }
  }, [open])

  // Close on page scroll
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('scroll', close, true)
    return () => window.removeEventListener('scroll', close, true)
  }, [open])

  const items = [
    ...(role === 'parent' ? [{ id: 'co-parent', icon: '👥', label: 'Co-Parent' }] : []),
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
