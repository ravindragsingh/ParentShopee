import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api.js'

const MAX_CHARS = 60

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  return isToday
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function MessagesTab() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [replyTo, setReplyTo] = useState(null) // { content, senderName }
  const [sending, setSending] = useState(false)
  const [loadingContacts, setLoadingContacts] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

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
  const accentColor = isParent ? '#7c3aed' : '#059669'
  const accentLight = isParent ? '#f5f3ff' : '#f0fdf4'
  const accentGrad = isParent
    ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
    : 'linear-gradient(135deg, #059669, #0d9488)'

  const overLimit = input.length > MAX_CHARS
  const canSend = input.trim().length > 0 && !overLimit && !sending

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 160px)', minHeight: 500, background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>

      {/* Contact list */}
      <div style={{ width: 260, flexShrink: 0, borderRight: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>💬 Messages</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>Your family</div>
        </div>

        {loadingContacts && <div className="loading-text" style={{ padding: 24, fontSize: '0.85rem' }}>Loading...</div>}
        {!loadingContacts && contacts.length === 0 && (
          <div className="empty-text" style={{ padding: 24, fontSize: '0.85rem' }}>
            No family members to message yet.
          </div>
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
              <div style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                background: contact.role === 'kid'
                  ? 'linear-gradient(135deg,#fdf4ff,#fff7ed)'
                  : 'linear-gradient(135deg,#f5f3ff,#ede9fe)',
                border: `2px solid ${contact.role === 'kid' ? '#f9a8d4' : '#c4b5fd'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem', position: 'relative',
              }}>
                {contact.avatar || (contact.role === 'kid' ? '🐶' : '👤')}
                {contact.unread > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -4,
                    background: '#ef4444', color: 'white', borderRadius: '50%',
                    width: 16, height: 16, fontSize: '0.65rem', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{contact.unread > 9 ? '9+' : contact.unread}</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1e293b', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{contact.name}</span>
                  {contact.lastMessageTime && (
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 400 }}>{formatTime(contact.lastMessageTime)}</span>
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {contact.lastMessage || (contact.role === 'kid' ? 'Kid' : 'Parent')}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Conversation pane */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: 12 }}>
            <div style={{ fontSize: '3rem' }}>💬</div>
            <div style={{ fontWeight: 600, fontSize: '1rem' }}>Select someone to message</div>
            <div style={{ fontSize: '0.85rem' }}>Choose a family member from the left</div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12, background: 'white' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: selected.role === 'kid' ? 'linear-gradient(135deg,#fdf4ff,#fff7ed)' : 'linear-gradient(135deg,#f5f3ff,#ede9fe)',
                border: `2px solid ${selected.role === 'kid' ? '#f9a8d4' : '#c4b5fd'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
              }}>
                {selected.avatar || (selected.role === 'kid' ? '🐶' : '👤')}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{selected.name}</div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'capitalize' }}>{selected.role}</div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#94a3b8' }}>Last 20 messages</div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10, background: '#f8fafc' }}>
              {loadingMsgs && <div className="loading-text" style={{ fontSize: '0.85rem' }}>Loading messages...</div>}
              {!loadingMsgs && messages.length === 0 && (
                <div className="empty-text" style={{ marginTop: 40 }}>No messages yet. Say hello!</div>
              )}
              {messages.map(msg => {
                const mine = msg.senderId === user.id
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 6 }}>
                    {/* Reply button for received messages */}
                    {!mine && (
                      <button
                        onClick={() => handleReply(msg)}
                        title="Reply"
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#94a3b8', fontSize: '0.8rem', padding: '4px 6px',
                          borderRadius: 8, flexShrink: 0, marginBottom: 20,
                          transition: 'color 0.15s, background 0.15s',
                        }}
                        onMouseEnter={e => { e.target.style.color = accentColor; e.target.style.background = accentLight }}
                        onMouseLeave={e => { e.target.style.color = '#94a3b8'; e.target.style.background = 'none' }}
                      >
                        ↩
                      </button>
                    )}
                    <div style={{ maxWidth: '70%' }}>
                      {/* Quoted block */}
                      {msg.quoteContent && (
                        <div style={{
                          background: mine ? 'rgba(255,255,255,0.18)' : '#f1f5f9',
                          borderLeft: `3px solid ${mine ? 'rgba(255,255,255,0.5)' : accentColor}`,
                          borderRadius: '8px 8px 0 0',
                          padding: '6px 10px',
                          fontSize: '0.78rem',
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
                          ? (mine ? '0 0 4px 18px' : '0 0 18px 4px')
                          : (mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px'),
                        padding: '10px 14px',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                        fontSize: '0.9rem',
                        lineHeight: 1.4,
                      }}>
                        <div>{msg.content}</div>
                        <div style={{ fontSize: '0.68rem', opacity: 0.65, marginTop: 4, textAlign: mine ? 'right' : 'left' }}>
                          {formatTime(msg.timestamp)}
                        </div>
                      </div>
                    </div>
                    {/* Reply button for sent messages */}
                    {mine && (
                      <button
                        onClick={() => handleReply(msg)}
                        title="Reply"
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#94a3b8', fontSize: '0.8rem', padding: '4px 6px',
                          borderRadius: 8, flexShrink: 0, marginBottom: 20,
                          transition: 'color 0.15s, background 0.15s',
                        }}
                        onMouseEnter={e => { e.target.style.color = accentColor; e.target.style.background = accentLight }}
                        onMouseLeave={e => { e.target.style.color = '#94a3b8'; e.target.style.background = 'none' }}
                      >
                        ↩
                      </button>
                    )}
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Reply preview bar */}
            {replyTo && (
              <div style={{
                padding: '8px 16px',
                borderTop: '1px solid #f1f5f9',
                background: accentLight,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: '0.78rem', color: accentColor, flex: 1, minWidth: 0 }}>
                  <strong>↩ Replying to {replyTo.senderName}:</strong>{' '}
                  <span style={{ fontStyle: 'italic', color: '#64748b' }}>
                    {replyTo.content.length > 40 ? replyTo.content.slice(0, 40) + '…' : replyTo.content}
                  </span>
                </span>
                <button
                  onClick={() => setReplyTo(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1rem', lineHeight: 1, padding: '2px 4px' }}
                >✕</button>
              </div>
            )}

            {/* Input bar */}
            {error && <div className="error-msg" style={{ margin: '0 16px 8px', fontSize: '0.8rem' }}>{error}</div>}
            <div style={{ padding: '10px 16px 12px', borderTop: replyTo ? 'none' : '1px solid #f1f5f9', background: 'white' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={`Message ${selected.name}…`}
                  rows={1}
                  style={{
                    flex: 1, resize: 'none', borderRadius: 12,
                    border: `1px solid ${overLimit ? '#ef4444' : '#e2e8f0'}`,
                    padding: '10px 14px', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit',
                    lineHeight: 1.4, maxHeight: 100, overflowY: 'auto', background: '#f8fafc',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => { e.target.style.borderColor = overLimit ? '#ef4444' : accentColor; e.target.style.background = 'white' }}
                  onBlur={e => { e.target.style.borderColor = overLimit ? '#ef4444' : '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!canSend}
                  style={{
                    width: 42, height: 42, borderRadius: '50%', border: 'none', cursor: canSend ? 'pointer' : 'not-allowed',
                    background: canSend ? accentGrad : '#e2e8f0',
                    color: canSend ? 'white' : '#94a3b8',
                    fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.2s', flexShrink: 0,
                  }}
                >
                  ➤
                </button>
              </div>
              {/* Character counter */}
              <div style={{
                textAlign: 'right', marginTop: 4, fontSize: '0.72rem',
                color: overLimit ? '#ef4444' : input.length > MAX_CHARS * 0.8 ? '#f59e0b' : '#94a3b8',
                fontWeight: overLimit ? 700 : 400,
              }}>
                {input.length}/{MAX_CHARS}
                {overLimit && <span style={{ marginLeft: 6 }}>Too long!</span>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
