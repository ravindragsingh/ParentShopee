/**
 * PIN complexity rules for Reward Ur Kids profile PINs.
 * Mirrors backend/security.py's check_pin_complexity().
 */

export const PIN_REQUIREMENTS_HINT = 'Exactly 6 digits — not all the same, not a simple sequence.'

const SEQUENTIAL_ASC  = '0123456789'
const SEQUENTIAL_DESC = '9876543210'

/**
 * Returns { ok: boolean, message: string|null }.
 * @param {string} pin
 */
export function checkPinComplexity(pin) {
  const value = pin || ''
  if (!/^\d{6}$/.test(value)) {
    return { ok: false, message: 'PIN must be exactly 6 digits.' }
  }
  if (new Set(value.split('')).size === 1) {
    return { ok: false, message: "PIN can't be the same digit repeated." }
  }
  if (SEQUENTIAL_ASC.includes(value) || SEQUENTIAL_DESC.includes(value)) {
    return { ok: false, message: "PIN can't be a simple sequence like 123456." }
  }
  return { ok: true, message: null }
}
