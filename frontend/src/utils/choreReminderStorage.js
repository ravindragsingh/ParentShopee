// localStorage helper for the daily chore-reminder local notification --
// same per-profile, inverted-boolean-flag convention as TipOfTheDayModal's
// areTipsDisabled/setTipsEnabled and tour/tourStorage.js's isTourDisabled/
// setTourEnabled. `who` is "kid" or "guardian" -- the same app install can
// have both a kid's and a guardian's reminder toggled independently (this
// app's shared-device, profile-picker model means both could be active on
// the same physical device).

const disabledKey = (userId, who) => `choreReminderDisabled_${who}_${userId}`

export function isChoreReminderDisabled(userId, who) {
  return localStorage.getItem(disabledKey(userId, who)) === '1'
}

export function setChoreReminderEnabled(userId, who, enabled) {
  if (enabled) localStorage.removeItem(disabledKey(userId, who))
  else localStorage.setItem(disabledKey(userId, who), '1')
}
