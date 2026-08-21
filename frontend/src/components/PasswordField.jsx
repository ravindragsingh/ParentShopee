import { useState } from 'react'

// Password input with a show/hide eye toggle. Self-contained (inline styles
// for the wrapper/button only) so it drops into any surrounding form markup
// -- .form-group, plain, whatever -- and still picks up that container's own
// input styling (border, background, focus ring) via CSS descendant
// selectors, since the <input> itself carries no className of its own.
export default function PasswordField({ value, onChange, placeholder, autoFocus, id, style }) {
  const [visible, setVisible] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{ width: '100%', boxSizing: 'border-box', ...style, paddingRight: 38 }}
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        style={{
          position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.95rem',
          opacity: 0.55, padding: 6, lineHeight: 1,
        }}
      >
        {visible ? '🙈' : '👁'}
      </button>
    </div>
  )
}
