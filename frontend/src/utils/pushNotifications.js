// Native-app-only push notifications (guardian gets notified when a kid
// completes a chore; kid gets notified when a guardian approves one). No-op
// on the web build -- Capacitor.isNativePlatform() is false there.
//
// Delivery is FCM on both platforms via @capacitor-firebase/messaging, so the
// backend only ever needs to know one token format. The token is device-level
// (this app uses a single shared "device" with a Netflix-style profile
// picker), so it's re-registered every time a profile becomes active in
// App.jsx's DashboardRoute -- whichever profile is currently active is
// whoever the backend will notify.

import { Capacitor } from '@capacitor/core'
import { api } from '../api.js'

export function isPushAvailable() {
  return Capacitor.isNativePlatform()
}

// Requests permission (no-op if already granted) and registers this device's
// current FCM token with the backend for the currently active profile.
// Fire-and-forget: a denied permission or delivery failure shouldn't block
// anything else in the app, so this never throws.
export async function registerForPushNotifications() {
  if (!isPushAvailable()) return
  try {
    const { FirebaseMessaging } = await import('@capacitor-firebase/messaging')
    const { receive } = await FirebaseMessaging.checkPermissions()
    if (receive !== 'granted') {
      const requested = await FirebaseMessaging.requestPermissions()
      if (requested.receive !== 'granted') return
    }
    const { token } = await FirebaseMessaging.getToken()
    if (token) await api.registerPushToken(token)
    // If FCM rotates the token later, keep the backend in sync.
    await FirebaseMessaging.addListener('tokenReceived', async (event) => {
      if (event?.token) {
        try { await api.registerPushToken(event.token) } catch { /* best-effort */ }
      }
    })
  } catch {
    // Plugin unavailable, permission denied, or network error -- nothing to do.
  }
}

// Calls `onTap` whenever the user taps a push notification (app opened from
// background/killed via the notification, or tapped while foregrounded).
export async function addNotificationTapListener(onTap) {
  if (!isPushAvailable()) return
  try {
    const { FirebaseMessaging } = await import('@capacitor-firebase/messaging')
    await FirebaseMessaging.addListener('notificationActionPerformed', (event) => {
      onTap(event?.notification?.data || {})
    })
  } catch {
    // Plugin unavailable -- nothing to do.
  }
}
