// localStorage helpers for the guided tour system -- same per-profile,
// inverted-boolean-flag convention as TipOfTheDayModal's areTipsDisabled/
// setTipsEnabled, so both onboarding features behave consistently.

const disabledKey = userId => `tourDisabled_${userId}`
const promptSeenKey = userId => `tourPromptSeen_${userId}`
const completedKey = (userId, tourId) => `tourCompleted_${userId}_${tourId}`

export function isTourDisabled(userId) {
  return localStorage.getItem(disabledKey(userId)) === '1'
}

export function setTourEnabled(userId, enabled) {
  if (enabled) localStorage.removeItem(disabledKey(userId))
  else localStorage.setItem(disabledKey(userId), '1')
}

// Whether we've already asked "want a guided tour?" at least once -- asked
// only once ever, regardless of answer, so it never nags on every login.
export function hasSeenPrompt(userId) {
  return localStorage.getItem(promptSeenKey(userId)) === '1'
}

export function markPromptSeen(userId) {
  localStorage.setItem(promptSeenKey(userId), '1')
}

export function isTourCompleted(userId, tourId) {
  return localStorage.getItem(completedKey(userId, tourId)) === '1'
}

export function markTourCompleted(userId, tourId) {
  localStorage.setItem(completedKey(userId, tourId), '1')
}
