// Native-app-only daily chore-reminder local notifications -- entirely
// on-device (the OS fires these, not the backend), unlike pushNotifications.js's
// FCM-delivered ones. Same shape as that file on purpose: dynamic plugin
// import, Capacitor.isNativePlatform() guard, check-then-request-if-needed
// permission flow. One deliberate difference -- toggling a switch is a direct
// user action, not a background registration, so a denied/blocked permission
// here returns false instead of silently swallowing it, letting the caller
// show an inline message rather than pretending the toggle took effect.

import { Capacitor } from '@capacitor/core'

export function isLocalNotificationsAvailable() {
  return Capacitor.isNativePlatform()
}

// Stable positive 31-bit id for a given (userId, who) pair -- local
// notification ids must be plain integers, and the same pair must always
// resolve to the same id so re-scheduling/cancelling targets the right one
// instead of piling up duplicates. djb2 string hash, masked into int32 range.
function notificationIdFor(userId, who) {
  const str = `${who}:${userId}`
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash) || 1
}

// 'granted' | 'denied' | 'prompt' | 'unavailable'
export async function checkLocalNotificationPermission() {
  if (!isLocalNotificationsAvailable()) return 'unavailable'
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    const { display } = await LocalNotifications.checkPermissions()
    return display
  } catch {
    return 'unavailable'
  }
}

// Schedules (or replaces) this user's daily reminder. Returns true on
// success, false if the permission is denied/blocked -- the caller should
// revert its toggle UI and surface a message when this returns false.
export async function scheduleChoreReminder(userId, who, { title, body, hour, minute }) {
  if (!isLocalNotificationsAvailable()) return false
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    let { display } = await LocalNotifications.checkPermissions()
    if (display !== 'granted') {
      const requested = await LocalNotifications.requestPermissions()
      display = requested.display
    }
    if (display !== 'granted') return false

    await LocalNotifications.schedule({
      notifications: [{
        id: notificationIdFor(userId, who),
        title,
        body,
        // isExactNotification defaults to true, which on API 31+ can pop
        // Android's own "Alarms & reminders" special-access settings screen
        // -- overkill for a "sometime around this hour" nudge, and the kind
        // of extra permission surface Play Store review scrutinizes. An
        // inexact alarm is plenty precise for a daily reminder.
        isExactNotification: false,
        schedule: { on: { hour, minute }, repeats: true, allowWhileIdle: true },
      }],
    })
    return true
  } catch {
    return false
  }
}

export async function cancelChoreReminder(userId, who) {
  if (!isLocalNotificationsAvailable()) return
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    await LocalNotifications.cancel({ notifications: [{ id: notificationIdFor(userId, who) }] })
  } catch {
    // Plugin unavailable -- nothing to do.
  }
}
