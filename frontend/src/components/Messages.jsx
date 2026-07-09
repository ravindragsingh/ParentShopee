import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api.js'
import { checkFields } from '../utils/wordFilter.js'

const MAX_CHARS = 60

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  return isToday
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function MessagesTab() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [sending, setSending] = useState(false)
  const [loadingContacts, setLoadingContacts] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [error, setError] = useState('')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const loadContacts = useCallback(async () => {
    setLoadingContacts(true)
    try {
      const data = await api.getContacts()
      setContacts(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingContacts(false)
    }
  }, [])

  async function openConversation(contact) {
    setSelected(contact)
    setMessages([])
    setReplyTo(null)
    setInput('')
    setLoadingMsgs(true)
    setError('')
    try {
      const data = await api.getMessages(contact.id)
      setMessages(Array.isArray(data) ? data : [])
      await api.markRead(contact.id)
      setContacts(cs => cs.map(c => c.id === contact.id ? { ...c, unread: 0 } : c))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingMsgs(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || !selected || sending || text.length > MAX_CHARS) return
    const wordCheck = checkFields(text)
    if (!wordCheck.ok) {
      setError(wordCheck.message)
      return
    }
    setSending(true)
    setError('')
    try {
      const msg = await api.sendMessage(selected.id, text, replyTo?.content || null)
      setMessages(ms => [...ms, msg])
      setInput('')
      setReplyTo(null)
      setContacts(cs => cs.map(c =>
        c.id === selected.id ? { ...c, lastMessage: msg.content, lastMessageTime: msg.timestamp } : c
      ))
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  function handleReply(msg) {
    const senderName = msg.senderId === user.id ? 'You' : (selected?.name || 'Them')
    setReplyTo({ content: msg.content, senderName })
    inputRef.current?.focus()
  }

  useEffect(() => { loadContacts() }, [loadContacts])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const isParent = user.role === 'parent'
  const accentColor = isParent ? '#0d9488' : '#059669'
  const accentLight = isParent ? '#f0fdfa' : '#f0fdf4'
  const accentGrad  = isParent
    ? 'linear-gradient(135deg, #0f766e, #0d9488)'
    : 'linear-gradient(135deg, #059669, #0d9488)'

  const overLimit = input.length > MAX_CHARS
  const canSend   = input.trim().length > 0 && !overLimit && !sending

  // On mobile: show only contact list OR only chat pane (never both)
  const showContacts = !isMobile || !selected
  const showChat     = !isMobile || !!selected

  function ContactAvatar({ contact, size = 38 }) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: contact.role === 'kid'
          ? 'linear-gradient(135deg,#f0fdfa,#fff7ed)'
          : 'linear-gradient(135deg,#f0fdfa,#ccfbf1)',
        border: `2px solid ${contact.role === 'kid' ? '#f9a8d4' : '#99f6e4'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.55, position: 'relative',
      }}>
        {contact.avatar || (contact.role === 'kid' ? '🐶' : '👤')}
        {contact.unread > 0 && (
          <span style={{
            position: 'absolute', top: -3, right: -3,
            background: '#ef4444', color: 'white', borderRadius: '50%',
            width: 16, height: 16, fontSize: '0.62rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{contact.unread > 9 ? '9+' : contact.unread}</span>
        )}
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      height: isMobile ? 'calc(100vh - 130px)' : 'calc(100vh - 160px)',
      minHeight: 400,
      background: 'white',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    }}>

      {/* ── Contact list ──────────────────────────────────────────────── */}
      {showContacts && (
        <div style={{
          width: isMobile ? '100%' : 220,
          flexShrink: 0,
          borderRight: isMobile ? 'none' : '1px solid #f1f5f9',
          display: 'flex', flexDirection: 'column',
          background: '#fafafa',
        }}>
          <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>💬 Messages</div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 1 }}>Your family</div>
          </div>

          {loadingContacts && <div className="loading-text" style={{ padding: 20, fontSize: '0.85rem' }}>Loading...</div>}
          {!loadingContacts && contacts.length === 0 && (
            <div className="empty-text" style={{ padding: 20, fontSize: '0.85rem' }}>No family members yet.</div>
          )}

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {contacts.map(contact => (
              <button
                key={contact.id}
                onClick={() => openConversation(contact)}
                style={{
                  width: '100%', textAlign: 'left', padding: '12px 14px',
                  background: selected?.id === contact.id ? accentLight : 'transparent',
                  border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'background 0.15s',
                }}
              >
                <ContactAvatar contact={contact} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1e293b' }}>{contact.name}</span>
                    {contact.lastMessageTime && (
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{formatTime(contact.lastMessageTime)}</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {contact.lastMessage || (contact.role === 'kid' ? 'Kid' : 'Parent')}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Conversation pane ─────────────────────────────────────────── */}
      {showChat && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {!selected ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: 10 }}>
              <div style={{ fontSize: '2.5rem' }}>💬</div>
              <div style={{ fontWeight: 600 }}>Select someone to message</div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10, background: 'white', flexShrink: 0 }}>
                {isMobile && (
                  <button
                    onClick={() => setSelected(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: accentColor, fontSize: '1.2rem', padding: '0 4px', lineHeight: 1 }}
                  >←</button>
                )}
                <ContactAvatar contact={selected} size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.92rem' }}>{selected.name}</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'capitalize' }}>{selected.role}</div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8, background: '#f8fafc' }}>
                {loadingMsgs && <div className="loading-text" style={{ fontSize: '0.85rem' }}>Loading...</div>}
                {!loadingMsgs && messages.length === 0 && (
                  <div className="empty-text" style={{ marginTop: 32 }}>No messages yet. Say hello!</div>
                )}
                {messages.map(msg => {
                  const mine = msg.senderId === user.id
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', gap: 4 }}>
                      <div style={{ maxWidth: '78%' }}>
                        {/* Quoted block */}
                        {msg.quoteContent && (
                          <div style={{
                            background: mine ? 'rgba(255,255,255,0.18)' : '#e2e8f0',
                            borderLeft: `3px solid ${mine ? 'rgba(255,255,255,0.5)' : accentColor}`,
                            borderRadius: '8px 8px 0 0',
                            padding: '5px 10px',
                            fontSize: '0.75rem',
                            color: mine ? 'rgba(255,255,255,0.85)' : '#64748b',
                            fontStyle: 'italic',
                            marginBottom: -2,
                          }}>
                            ↩ {msg.quoteContent}
                          </div>
                        )}
                        <div style={{
                          background: mine ? accentGrad : 'white',
                          color: mine ? 'white' : '#1e293b',
                          borderRadius: msg.quoteContent
                            ? (mine ? '0 0 4px 16px' : '0 0 16px 4px')
                            : (mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px'),
                          padding: '9px 13px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                          fontSize: '0.88rem',
                          lineHeight: 1.4,
                          wordBreak: 'break-word',
                        }}>
                          <div>{msg.content}</div>
                          <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <span style={{ fontSize: '0.65rem', opacity: 0.65 }}>{formatTime(msg.timestamp)}</span>
                            {/* Reply button inline inside bubble */}
                            <button
                              onClick={() => handleReply(msg)}
                              title="Reply"
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                opacity: 0.5, fontSize: '0.72rem', padding: 0, lineHeight: 1,
                                color: mine ? 'white' : '#64748b',
                              }}
                            >↩</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {/* Reply preview */}
              {replyTo && (
                <div style={{
                  padding: '7px 14px',
                  borderTop: '1px solid #f1f5f9',
                  background: accentLight,
                  display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
                }}>
                  <span style={{ fontSize: '0.76rem', color: accentColor, flex: 1, minWidth: 0 }}>
                    <strong>↩ {replyTo.senderName}:</strong>{' '}
                    <span style={{ fontStyle: 'italic', color: '#64748b' }}>
                      {replyTo.content.length > 40 ? replyTo.content.slice(0, 40) + '…' : replyTo.content}
                    </span>
                  </span>
                  <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1rem', lineHeight: 1 }}>✕</button>
                </div>
              )}

              {/* Input bar */}
              {error && <div className="error-msg" style={{ margin: '0 12px 6px', fontSize: '0.8rem' }}>{error}</div>}
              <div style={{ padding: '8px 12px 10px', borderTop: replyTo ? 'none' : '1px solid #f1f5f9', background: 'white', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder={`Message ${selected.name}…`}
                    rows={1}
                    style={{
                      flex: 1, resize: 'none',
                      border: `1px solid ${overLimit ? '#ef4444' : '#e2e8f0'}`,
                      borderRadius: 10, padding: '9px 12px', fontSize: '0.88rem',
                      outline: 'none', fontFamily: 'inherit', lineHeight: 1.4,
                      maxHeight: 90, overflowY: 'auto', background: '#f8fafc',
                    }}
                    onFocus={e => { e.target.style.borderColor = overLimit ? '#ef4444' : accentColor; e.target.style.background = 'white' }}
                    onBlur={e => { e.target.style.borderColor = overLimit ? '#ef4444' : '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!canSend}
                    style={{
                      width: 40, height: 40, borderRadius: '50%', border: 'none',
                      cursor: canSend ? 'pointer' : 'not-allowed',
                      background: canSend ? accentGrad : '#e2e8f0',
                      color: canSend ? 'white' : '#94a3b8',
                      fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, transition: 'background 0.2s',
                    }}
                  >➤</button>
                </div>
                <div style={{
                  textAlign: 'right', marginTop: 3, fontSize: '0.68rem',
                  color: overLimit ? '#ef4444' : input.length > MAX_CHARS * 0.8 ? '#f59e0b' : '#94a3b8',
                  fontWeight: overLimit ? 700 : 400,
                }}>
                  {input.length}/{MAX_CHARS}{overLimit && ' — too long!'}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
