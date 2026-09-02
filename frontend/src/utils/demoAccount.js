// Single source of truth for the public "Try Demo" account. The username is
// permanently reserved (usernames are unique account-wide), so checking for
// it is a reliable way to detect "this is the demo family" anywhere in the
// app -- used to skip the PIN prompt when switching between demo profiles,
// since a public demo shouldn't ask a visitor to know/guess a PIN.
export const DEMO_USERNAME = 'parent1'
export const DEMO_PASSWORD = 'pass1'

export const DEMO_PROFILE_PINS = {
  parent1: '246810',
  kid1: '473829',
  kid2: '284917',
}
