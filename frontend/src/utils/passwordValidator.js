/**
 * Password complexity rules for Reward Ur Kids.
 * Applies to new accounts and password resets — NOT to login, so
 * existing passwords (including seeded demo accounts) still work.
 */

export const PASSWORD_REQUIREMENTS_HINT =
  'At least 8 characters, with 1 uppercase letter, 1 number, and 1 special character.'

export const PASSWORD_RULES = [
  { key: 'length', label: 'At least 8 characters', test: pw => pw.length >= 8 },
  { key: 'upper', label: 'One uppercase letter', test: pw => /[A-Z]/.test(pw) },
  { key: 'number', label: 'One number', test: pw => /[0-9]/.test(pw) },
  { key: 'special', label: 'One special character', test: pw => /[^A-Za-z0-9]/.test(pw) },
]

/**
 * Returns { ok: boolean, message: string|null } — message is the first unmet rule.
 * @param {string} password
 */
export function checkPasswordComplexity(password) {
  const pw = password || ''
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(pw)) {
      return { ok: false, message: `Password needs: ${rule.label.toLowerCase()}.` }
    }
  }
  return { ok: true, message: null }
}
