// Native (Android/iOS) Google Sign-In. The web build uses Google's own
// Identity Services widget directly in Login.jsx -- that widget can't work
// inside an app WebView (Google blocks it), so native platforms use this
// module instead.
//
// iOS uses the @capgo/capacitor-social-login plugin's native SDK integration,
// same as before. Android uses a browser-based OAuth redirect flow (Custom
// Tabs) instead of that plugin's Credential Manager integration -- Credential
// Manager's "reauth" step fails with "[16] Account reauth failed" specifically
// on the Play Store-signed build (confirmed via extensive testing: correct
// SHA-1 registered and verified via runtime logs, OAuth consent screen
// correctly configured, Play Integrity API linked -- none of it fixed the
// underlying Credential Manager failure). The browser flow talks to Google's
// generic OAuth endpoint directly and never touches Credential Manager, so it
// isn't subject to whatever is failing there.
//
// All paths end up producing the same thing: a Google ID token (JWT). The web
// and iOS tokens are audienced to the "Web application" OAuth client; the
// Android browser flow's token is audienced to the "4th Android" OAuth client
// instead (that's inherent to how Google's generic OAuth endpoint issues
// tokens -- there's no equivalent of the plugin's serverClientId override
// outside of Credential Manager). The backend accepts both as valid audiences
// (see backend/google_auth_utils.py).

import { Capacitor } from '@capacitor/core'

const WEB_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const IOS_CLIENT_ID = import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID
const ANDROID_CLIENT_ID = import.meta.env.VITE_GOOGLE_ANDROID_CLIENT_ID
const ANDROID_REDIRECT_URI = `com.googleusercontent.apps.${ANDROID_CLIENT_ID?.split('.apps.googleusercontent.com')[0]}:/oauth2redirect`

let initPromise = null

export function isNativeGoogleSignInAvailable() {
  if (!Capacitor.isNativePlatform()) return false
  const platform = Capacitor.getPlatform()
  if (platform === 'ios') return Boolean(WEB_CLIENT_ID && IOS_CLIENT_ID)
  if (platform === 'android') return Boolean(ANDROID_CLIENT_ID)
  return false
}

function ensureIosInitialized() {
  if (!initPromise) {
    initPromise = import('@capgo/capacitor-social-login').then(({ SocialLogin }) =>
      SocialLogin.initialize({
        google: {
          webClientId: WEB_CLIENT_ID,
          iOSClientId: IOS_CLIENT_ID,
          iOSServerClientId: WEB_CLIENT_ID,
          mode: 'online',
        },
      }).then(() => SocialLogin)
    )
  }
  return initPromise
}

async function iosGoogleSignIn() {
  const SocialLogin = await ensureIosInitialized()
  const { result } = await SocialLogin.login({ provider: 'google', options: {} })
  if (!result?.idToken) {
    throw new Error('Google did not return a sign-in token. Please try again.')
  }
  return result.idToken
}

function randomToken() {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return base64Url(bytes.buffer)
}

function base64Url(buffer) {
  let binary = ''
  new Uint8Array(buffer).forEach(b => { binary += String.fromCharCode(b) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function pkceChallenge(verifier) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return base64Url(digest)
}

// Google's implicit id_token flow only accepts registered HTTPS/localhost
// redirect URIs (Web client type), not custom URL schemes -- confirmed via
// "Error 400: invalid_request" when tried. The Authorization Code + PKCE
// flow ("OAuth 2.0 for Mobile & Desktop Apps") is the one Google explicitly
// supports with a custom-scheme redirect on an Android-type client (once
// "Enable Custom URI scheme" is turned on for it), and doesn't need a client
// secret since the code exchange is verified by the PKCE code_verifier
// instead.
//
// Opening the browser backgrounds the app, and Android is free to kill the
// backgrounded process under memory pressure -- confirmed happening even on
// this project's own test emulator. When that happens, the redirect back in
// arrives at a freshly-recreated app with none of the original login click's
// in-memory state left, so the pending {state, codeVerifier} and the
// eventual result both live in localStorage instead of a JS closure. Two
// consumers read the result: this module's own androidGoogleSignIn() (the
// common case, where the process survived) and Login.jsx's mount-time
// consumePendingAndroidGoogleSignIn() call (the recreated-process case).
const PENDING_KEY = 'grk_google_oauth_pending'
const RESULT_KEY = 'grk_google_oauth_result'

async function exchangeAndroidCode(code, codeVerifier) {
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: ANDROID_CLIENT_ID,
      code,
      code_verifier: codeVerifier,
      redirect_uri: ANDROID_REDIRECT_URI,
      grant_type: 'authorization_code',
    }).toString(),
  })
  const tokenData = await tokenResponse.json().catch(() => null)
  if (!tokenResponse.ok || !tokenData?.id_token) {
    throw new Error(tokenData?.error_description || 'Google sign-in failed while exchanging the code. Please try again.')
  }
  return tokenData.id_token
}

async function handleAndroidRedirectUrl(url) {
  if (!url.startsWith(ANDROID_REDIRECT_URI)) return
  const pendingRaw = localStorage.getItem(PENDING_KEY)
  if (!pendingRaw) return
  // appUrlOpen and getLaunchUrl() can both fire for the same startup intent --
  // mark this pending flow claimed immediately (without clearing it yet, so
  // consumePendingAndroidGoogleSignIn()'s poll loop below still sees a flow
  // in progress) so a second concurrent call bails instead of trying to
  // exchange the same one-time-use authorization code twice.
  let pending
  try {
    pending = JSON.parse(pendingRaw)
  } catch {
    return
  }
  if (pending.claimed) return
  localStorage.setItem(PENDING_KEY, JSON.stringify({ ...pending, claimed: true }))

  let result
  try {
    const { state, codeVerifier } = pending
    const params = new URLSearchParams(url.split('?')[1] || '')
    const error = params.get('error')
    if (error) throw new Error(`Google sign-in was cancelled or failed (${error}).`)
    if (params.get('state') !== state) throw new Error('Google sign-in response failed a security check. Please try again.')
    const code = params.get('code')
    if (!code) throw new Error('Google did not return a sign-in code. Please try again.')
    result = { idToken: await exchangeAndroidCode(code, codeVerifier) }
  } catch (err) {
    result = { error: err.message }
  }
  // Only cleared once the result is actually ready, so PENDING_KEY staying
  // present is a reliable "still working on it" signal for pollers.
  localStorage.removeItem(PENDING_KEY)
  localStorage.setItem(RESULT_KEY, JSON.stringify(result))
}

let redirectHandlingReady = null
function ensureAndroidRedirectHandling() {
  if (!redirectHandlingReady) {
    redirectHandlingReady = import('@capacitor/app').then(async ({ App }) => {
      App.addListener('appUrlOpen', ({ url }) => { handleAndroidRedirectUrl(url) })
      const launch = await App.getLaunchUrl().catch(() => null)
      if (launch?.url) await handleAndroidRedirectUrl(launch.url)
    })
  }
  return redirectHandlingReady
}

if (Capacitor.getPlatform() === 'android') {
  ensureAndroidRedirectHandling()
}

function waitForAndroidResult() {
  return new Promise((resolve, reject) => {
    const poll = () => {
      const raw = localStorage.getItem(RESULT_KEY)
      if (raw) {
        localStorage.removeItem(RESULT_KEY)
        const data = JSON.parse(raw)
        data.idToken ? resolve(data.idToken) : reject(new Error(data.error))
        return
      }
      setTimeout(poll, 400)
    }
    poll()
  })
}

async function androidGoogleSignIn() {
  await ensureAndroidRedirectHandling()
  const { Browser } = await import('@capacitor/browser')

  const state = randomToken()
  const codeVerifier = randomToken()
  const codeChallenge = await pkceChallenge(codeVerifier)
  localStorage.setItem(PENDING_KEY, JSON.stringify({ state, codeVerifier }))
  localStorage.removeItem(RESULT_KEY)

  const authUrl =
    'https://accounts.google.com/o/oauth2/v2/auth?' +
    new URLSearchParams({
      client_id: ANDROID_CLIENT_ID,
      redirect_uri: ANDROID_REDIRECT_URI,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      prompt: 'select_account',
    }).toString()

  try {
    await Browser.open({ url: authUrl })
  } catch (err) {
    localStorage.removeItem(PENDING_KEY)
    throw err
  }

  // Covers the common case (process survives): if the user closes the tab
  // manually without finishing, no redirect ever arrives, so nothing would
  // otherwise stop waitForAndroidResult() from polling forever. This listener
  // is a no-op if a real redirect already resolved things first, since
  // handleAndroidRedirectUrl() only ever writes a result when PENDING_KEY is
  // still there to consume.
  Browser.addListener('browserFinished', () => {
    setTimeout(() => {
      if (localStorage.getItem(PENDING_KEY) === JSON.stringify({ state, codeVerifier })) {
        localStorage.removeItem(PENDING_KEY)
        localStorage.setItem(RESULT_KEY, JSON.stringify({ error: 'Google sign-in was cancelled.' }))
      }
    }, 500)
  })

  return waitForAndroidResult()
}

// Checked once on the login screen's mount: if the app process was killed
// and recreated while a sign-in redirect was in flight (see comment above
// PENDING_KEY), this picks up the result that ensureAndroidRedirectHandling()
// already wrote to localStorage during this fresh module load. Resolves to
// null immediately when no sign-in was in progress, which is the normal case
// on every other page load.
export async function consumePendingAndroidGoogleSignIn() {
  if (Capacitor.getPlatform() !== 'android') return null
  await ensureAndroidRedirectHandling()
  for (let i = 0; i < 20; i++) {
    const raw = localStorage.getItem(RESULT_KEY)
    if (raw) {
      localStorage.removeItem(RESULT_KEY)
      const data = JSON.parse(raw)
      if (data.idToken) return data.idToken
      throw new Error(data.error)
    }
    if (!localStorage.getItem(PENDING_KEY)) return null
    await new Promise(r => setTimeout(r, 300))
  }
  return null
}

// Returns the Google ID token (JWT) on success.
export async function nativeGoogleSignIn() {
  return Capacitor.getPlatform() === 'android' ? androidGoogleSignIn() : iosGoogleSignIn()
}
