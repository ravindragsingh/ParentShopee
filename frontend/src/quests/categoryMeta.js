// Visual identity + a one-line description per category, keyed by the
// backend's `category` slug (same role as futureready/topicMeta.js plays
// for Future-Ready's topics).
const CATEGORY_META = {
  cognitive: { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', description: 'Memory, logic, and focus-building activities.' },
  creativity: { color: '#db2777', bg: '#fdf2f8', border: '#fbcfe8', description: 'Art, storytelling, and imaginative play.' },
  physical: { color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4', description: 'Movement, coordination, and active play.' },
  emotional: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', description: 'Feelings, empathy, and connecting together.' },
  stem: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', description: 'Simple experiments, building, and discovery.' },
  'life-skills': { color: '#b45309', bg: '#fffbeb', border: '#fde68a', description: 'Real-world skills kids can build real confidence with.' },
  social: { color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc', description: 'Communication, teamwork, and getting along with others.' },
  nature: { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', description: 'Getting outside and connecting with the natural world.' },
  mindfulness: { color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe', description: 'Breathing, gratitude, and calming-down techniques.' },
  'puzzle-solving': { color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', description: 'Puzzles, strategy, and figuring things out.' },
}

const DEFAULT_META = { color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4', description: '' }

export function categoryMeta(category) {
  return CATEGORY_META[category] || DEFAULT_META
}
