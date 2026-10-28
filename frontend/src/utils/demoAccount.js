// Single source of truth for the public "Try Demo" account. The username is
// permanently reserved (usernames are unique account-wide), so checking for
// it is a reliable way to detect "this is the demo family" anywhere in the
// app -- used to skip the PIN prompt when switching between demo profiles,
// since a public demo shouldn't ask a visitor to know/guess a PIN.
export const DEMO_USERNAME = 'parent1'
// Firebase sign-in needs an email, not the username -- see backend/seed.py.
export const DEMO_EMAIL = 'mom@family.com'
// One character longer than the old "pass1" -- Firebase requires at least 6.
export const DEMO_PASSWORD = 'pass1234'

export const DEMO_PROFILE_PINS = {
  parent1: '246810',
  kid1: '473829',
  kid2: '284917',
}
