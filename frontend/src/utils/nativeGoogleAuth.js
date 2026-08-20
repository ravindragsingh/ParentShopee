// Native (Android/iOS) Google Sign-In. The web build uses Google's own
// Identity Services widget directly in Login.jsx -- that widget can't work
// inside an app WebView (Google blocks it), so native platforms use this
// module instead, via the @capgo/capacitor-social-login plugin's Credential
// Manager (Android) / native SDK (iOS) integration.
//
// Both paths end up producing the same thing: a Google ID token (JWT), which
// gets sent to the exact same backend endpoints (/api/auth/google[/complete])
// that already verify it -- no backend changes needed for native support.

import { Capacitor } from '@capacitor/core'

const WEB_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const IOS_CLIENT_ID = import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID

let initPromise = null

export function isNativeGoogleSignInAvailable() {
  if (!Capacitor.isNativePlatform()) return false
  if (!WEB_CLIENT_ID) return false
  if (Capacitor.getPlatform() === 'ios' && !IOS_CLIENT_ID) return false
  return true
}

function ensureInitialized() {
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

// Returns the Google ID token (JWT) on success.
export async function nativeGoogleSignIn() {
  const SocialLogin = await ensureInitialized()
  // Don't pass custom `scopes` here -- the plugin's Android Credential Manager
  // path rejects any login() call with scopes unless MainActivity is manually
  // modified to implement ModifiedMainActivityForSocialLoginPlugin. We don't
  // need to: it already requests email/profile/openid by default, which is
  // all the ID token needs to carry for our backend to verify it.
  const { result } = await SocialLogin.login({ provider: 'google', options: {} })
  if (!result?.idToken) {
    throw new Error('Google did not return a sign-in token. Please try again.')
  }
  return result.idToken
}
