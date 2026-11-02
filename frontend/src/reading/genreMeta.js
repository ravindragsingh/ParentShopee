// Visual identity + a one-line description per genre, keyed by the backend's
// `category` slug (same role as quests/categoryMeta.js plays for Quests).
const GENRE_META = {
  adventure: { color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', description: 'Exciting journeys and daring heroes.' },
  fantasy: { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', description: 'Magic, mythical creatures, and faraway worlds.' },
  science: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', description: 'Facts, discoveries, and how things work.' },
  classics: { color: '#b45309', bg: '#fffbeb', border: '#fde68a', description: 'Timeless stories every kid should meet.' },
  mystery: { color: '#0f172a', bg: '#f8fafc', border: '#cbd5e1', description: 'Puzzles, clues, and page-turning twists.' },
}

const DEFAULT_META = { color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4', description: '' }

export function genreMeta(genre) {
  return GENRE_META[genre] || DEFAULT_META
}
