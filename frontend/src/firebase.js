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
// at all while iterating locally. Set in .env.local, which Vite loads for
// EVERY mode (including a local `vite build --mode production`) since
// .env.production never overrides this specific key -- so `DEV` is checked
// too, since that's only ever true under the dev server (`vite`/`vite dev`),
// never in any built output regardless of --mode. Without it, a production
// build made on a machine with .env.local present would silently ship
// pointed at the emulator instead of the real Firebase project.
const emulatorHost = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST
if (import.meta.env.DEV && emulatorHost) {
  connectAuthEmulator(auth, `http://${emulatorHost}`, { disableWarnings: true })
}
