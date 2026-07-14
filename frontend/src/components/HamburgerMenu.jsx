import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { api } from '../api.js'

export default function HamburgerMenu({ tab, setTab, role, onLogout, onSwitchProfile }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const [unreadCount, setUnreadCount] = useState(0)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640)
  const btnRef  = useRef(null)
  const dropRef = useRef(null)

  const menuTabIds = role === 'parent'
    ? ['admin', 'messages', 'help', 'contact']
    : ['messages', 'help', 'contact', 'settings']

  const isMenuTab   = menuTabIds.includes(tab)
  const accent      = role === 'parent' ? '#0d9488' : '#059669'
  const accentBg    = role === 'parent' ? '#f0fdfa' : '#f0fdf4'
  const activeClass = role === 'parent' ? ' active parent' : ' active kid'

  // getBoundingClientRect() is already relative to the visual viewport.
  // We must NOT add visualViewport.offsetTop — that would double-count scroll.
  // Use visualViewport.width (not window.innerWidth) for accurate mobile width.
  const computePos = useCallback(() => {
    if (!btnRef.current) return
    const r  = btnRef.current.getBoundingClientRect()
    const vw = window.visualViewport?.width ?? window.innerWidth
    setPos({ top: r.bottom + 6, right: vw - r.right })
  }, [])

  function handleToggle() {
    if (!open) {
      // Compute immediately, then recompute after paint in case the first
      // measurement is stale (common on iOS Safari after orientation change)
      computePos()
      requestAnimationFrame(computePos)
    }
    setOpen(v => !v)
  }

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Re-sync position on visual-viewport resize/scroll (rotation, zoom, soft-keyboard)
  useEffect(() => {
    if (!open || isMobile) return
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

  // Close on click/tap outside both button and dropdown
  useEffect(() => {
    if (!open) return
    function onDown(e) {
      const inBtn  = btnRef.current  && btnRef.current.contains(e.target)
      const inDrop = dropRef.current && dropRef.current.contains(e.target)
      if (!inBtn && !inDrop) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown, { passive: true })
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

  useEffect(() => {
    let active = true

    async function refreshUnread() {
      try {
        const data = await api.getContacts()
        const contacts = Array.isArray(data) ? data : []
        const count = contacts.reduce((sum, contact) => sum + (Number(contact.unread) || 0), 0)
        if (active) setUnreadCount(count)
      } catch {
        if (active) setUnreadCount(0)
      }
    }

    refreshUnread()
    const intervalId = window.setInterval(refreshUnread, 10000)

    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [])

  const hasNotification = unreadCount > 0

  const items = [
    ...(role === 'parent' ? [{ id: 'admin', icon: '🛡️', label: 'Admin Panel' }] : []),
    { id: 'messages', icon: '💬', label: 'Messages'   },
    { id: 'help',     icon: '❓', label: 'Help'        },
    { id: 'contact',  icon: '📩', label: 'Contact Us'  },
    ...(role !== 'parent' ? [{ id: 'settings', icon: '⚙️', label: 'Settings' }] : []),
    ...(onSwitchProfile ? [{ id: 'switch-profile', icon: '🔄', label: 'Switch Profile' }] : []),
    ...(onLogout ? [{ id: 'logout', icon: '🚪', label: 'Sign Out' }] : []),
  ]

  const handleItemClick = (item) => {
    if (item.id === 'logout') {
      setOpen(false)
      onLogout?.()
      return
    }
    if (item.id === 'switch-profile') {
      setOpen(false)
      onSwitchProfile?.()
      return
    }
    setTab(item.id)
    setOpen(false)
  }

  const dropdown = open ? (
    isMobile ? (
      <div
        ref={dropRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'white',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '12px 14px' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setOpen(false)
            }}
            style={{ border: 'none', background: 'transparent', color: '#334155', width: 40, height: 40, borderRadius: '50%', fontSize: '1.2rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0 8px' }}>
          {items.map((item, i) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '16px 18px',
                background: tab === item.id ? accentBg : 'white',
                border: 'none',
                borderBottom: i < items.length - 1 ? '1px solid #f1f5f9' : 'none',
                cursor: 'pointer',
                color: tab === item.id ? accent : '#334155',
                fontWeight: tab === item.id ? 700 : 600,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
              {item.label}
              {item.id === 'messages' && hasNotification && (
                <span style={{ marginLeft: 'auto', background: '#ef4444', color: 'white', borderRadius: 999, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700, lineHeight: 1.2 }}>
                  New
                </span>
              )}
              {tab === item.id && (
                <span style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: accent, flexShrink: 0 }} />
              )}
            </button>
          ))}
        </div>
      </div>
    ) : (
      <div
        ref={dropRef}
        style={{
          position: 'fixed',
          top: pos.top,
          right: pos.right,
          zIndex: 99999,
          background: 'white',
          borderRadius: 14,
          boxShadow: '0 12px 40px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)',
          minWidth: 200,
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          animation: 'fadeSlideDown 0.15s ease',
        }}
      >
        {items.map((item, i) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item)}
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
            {item.id === 'messages' && hasNotification && (
              <span style={{ marginLeft: 'auto', background: '#ef4444', color: 'white', borderRadius: 999, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700, lineHeight: 1.2 }}>
                New
              </span>
            )}
            {tab === item.id && (
              <span style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', background: accent, flexShrink: 0 }} />
            )}
          </button>
        ))}
      </div>
    )
  ) : null

  return (
    <>
      <button
        ref={btnRef}
        className={`tab-btn${isMenuTab ? activeClass : ''}`}
        onClick={handleToggle}
        title="More"
        style={{
          fontSize: '1.35rem',
          padding: '10px 16px',
          marginLeft: 'auto',
          flexShrink: 0,
          position: 'relative',
          color: 'white',
          background: 'linear-gradient(135deg, #0f766e, #0d9488)',
          border: '1px solid rgba(255,255,255,0.25)',
          boxShadow: '0 6px 16px rgba(13, 148, 136, 0.25)',
        }}
      >
        {open ? '✕' : '☰'}
        {hasNotification && (
          <span
            aria-label="New messages"
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#ef4444',
              border: '2px solid white',
              boxShadow: '0 0 0 1px rgba(0,0,0,0.08)',
            }}
          />
        )}
      </button>

      {/* Portal renders dropdown directly into document.body —
          completely escapes any parent overflow, transform, or stacking context */}
      {createPortal(dropdown, document.body)}
    </>
  )
}
