// Shared "Ages 4–6" / "Ages 8+" / "All ages" formatting for a game's min/max age tags.
export function ageLabel(minAge, maxAge) {
  if (minAge == null && maxAge == null) return 'All ages'
  if (maxAge == null) return `Ages ${minAge}+`
  if (minAge == null) return `Up to age ${maxAge}`
  return `Ages ${minAge}–${maxAge}`
}
