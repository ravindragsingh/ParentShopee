// Visual identity + a one-line description per topic, keyed by the backend's
// `topic` slug. Purely a frontend concern (color, copy) -- the backend only
// knows ids, titles, and age ranges. Adding a topic later means adding one
// entry here for it to get a distinct look instead of the default teal.
const TOPIC_META = {
  'investing-for-kids': { color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4', description: 'Learn how money can grow over time.' },
  'ai-for-kids': { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', description: 'Understand how smart computers actually work.' },
  'entrepreneurship': { color: '#d97706', bg: '#fffbeb', border: '#fde68a', description: 'Discover how ideas turn into real businesses.' },
  'critical-thinking': { color: '#db2777', bg: '#fdf2f8', border: '#fbcfe8', description: 'Learn to ask good questions and think clearly.' },
  'communication': { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', description: 'Build skills to express yourself and listen well.' },
  'digital-safety': { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', description: 'Stay safe and smart online.' },
  'problem-solving': { color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe', description: 'Learn how to tackle tricky challenges.' },
}

const DEFAULT_META = { color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4', description: '' }

export function topicMeta(topic) {
  return TOPIC_META[topic] || DEFAULT_META
}
