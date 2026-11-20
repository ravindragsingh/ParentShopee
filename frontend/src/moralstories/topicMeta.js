// Visual identity + a one-line description per topic, keyed by the backend's
// `topic` slug -- same pattern as futureready/topicMeta.js. Purely a frontend
// concern (color, copy); the backend only knows ids, titles, and age ranges.
// Adding a topic later (via the admin Content panel) means adding one entry
// here for it to get a distinct look instead of the default teal.
const TOPIC_META = {
  'honesty': { color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4', description: 'Stories about telling the truth, even when it\'s hard.' },
  'sharing-kindness': { color: '#db2777', bg: '#fdf2f8', border: '#fbcfe8', description: 'Stories about caring for others and sharing what you have.' },
  'courage': { color: '#d97706', bg: '#fffbeb', border: '#fde68a', description: 'Stories about trying again and not giving up.' },
}

const DEFAULT_META = { color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4', description: '' }

export function topicMeta(topic) {
  return TOPIC_META[topic] || DEFAULT_META
}
