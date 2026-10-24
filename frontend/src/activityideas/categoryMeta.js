// Visual identity + a one-line description per category, keyed by the
// backend's `category` slug (same role as futureready/topicMeta.js plays
// for Future-Ready's topics).
const CATEGORY_META = {
  cognitive: { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', description: 'Memory, logic, and focus-building activities.' },
  creativity: { color: '#db2777', bg: '#fdf2f8', border: '#fbcfe8', description: 'Art, storytelling, and imaginative play.' },
  physical: { color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4', description: 'Movement, coordination, and active play.' },
  emotional: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', description: 'Feelings, empathy, and connecting together.' },
}

const DEFAULT_META = { color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4', description: '' }

export function categoryMeta(category) {
  return CATEGORY_META[category] || DEFAULT_META
}
