import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, GoogleAuthProvider } from 'firebase/auth'

// Public, client-safe config (distinct from the server-side service-account
// secret in backend/config.py's FIREBASE_SERVICE_ACCOUNT_JSON) -- same project
// as the one already used for push notifications. Values come from the
// Firebase Console: Project Settings -> General -> Your apps -> Web app.
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:         import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:          import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId:              import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseApp = initializeApp(firebaseConfig)
export const auth = getAuth(firebaseApp)
export const googleProvider = new GoogleAuthProvider()

// Local dev against the Auth Emulator (see backend/firebase_app.py and
// `firebase emulators:start --only auth`) -- no real Firebase project needed
// at all while iterating locally. Only ever set in .env.local, never in a
// real deployment's env vars.
const emulatorHost = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST
if (emulatorHost) {
  connectAuthEmulator(auth, `http://${emulatorHost}`, { disableWarnings: true })
}
