import { useEffect, useRef, useCallback } from 'react'

// Renders Google's own Sign-In button via the Identity Services script
// (loaded in index.html) and hands the resulting credential (a Google ID
// token JWT) to the caller. Used anywhere the app needs to re-prove "this is
// the same Google account" without a password -- e.g. PIN recovery for
// guardians who signed up via Google and have no password to re-enter.
export default function GoogleCredentialButton({ onCredential, text = 'continue_with' }) {
  const buttonRef = useRef(null)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  const handleCredentialResponse = useCallback((response) => {
    onCredential(response.credential)
  }, [onCredential])

  useEffect(() => {
    if (!clientId) return
    // Same poll-until-ready pattern as the sign-in button: the GSI script
    // loads async/defer, so window.google can still be undefined on a first
    // render -- retry instead of silently rendering nothing.
    let cancelled = false
    function tryRender() {
      if (cancelled) return
      if (!window.google?.accounts?.id || !buttonRef.current) {
        setTimeout(tryRender, 100)
        return
      }
      window.google.accounts.id.initialize({ client_id: clientId, callback: handleCredentialResponse })
      window.google.accounts.id.renderButton(buttonRef.current, { theme: 'outline', size: 'large', width: 280, text })
    }
    tryRender()
    return () => { cancelled = true }
  }, [clientId, handleCredentialResponse, text])

  if (!clientId) return null
  return <div ref={buttonRef} />
}
