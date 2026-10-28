import { useState } from 'react'
import GuardianFutureReadyTab from '../futureready/GuardianFutureReadyTab.jsx'
import GuardianQuestsTab from '../quests/GuardianQuestsTab.jsx'

// Guardian-side counterpart to LearnGrowTab.jsx -- see that file's comment
// for why Future-Ready and Quests share one nav slot (with a picker screen,
// not a switcher) instead of each getting their own. No deep-link/URL state
// needed here (unlike the kid side's "Continue Learning" card), so local
// state is enough.
const SECTIONS = [
  { key: 'futureready', icon: '🚀', label: 'Future-Ready', text: 'Manage lessons on money, AI, safety & more', color: '#ea580c', bg: '#f5f3ff', border: '#ddd6fe' },
  { key: 'quests', icon: '🧸', label: 'Quests', text: 'Manage hands-on things to try together', color: '#ea580c', bg: '#f0fdfa', border: '#99f6e4' },
]

export default function GuardianLearnGrowTab() {
  const [section, setSection] = useState(null)

  if (!section) {
    return (
      <div>
        <h3 style={{ color: '#334155', margin: '0 0 6px' }}>🌱 Learn & Grow</h3>
        <div style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: 18 }}>Pick what to manage.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {SECTIONS.map(s => (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10,
                border: `1px solid ${s.border}`, background: s.bg, borderRadius: 18, padding: '28px 18px', cursor: 'pointer',
              }}
            >
              <div style={{
                width: 60, height: 60, borderRadius: 18, background: '#fff', border: `1px solid ${s.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
              }}>
                {s.icon}
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1e293b' }}>{s.label}</div>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{s.text}</div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <button onClick={() => setSection(null)} style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', marginBottom: 14, padding: 0 }}>
        ← Back
      </button>
      {section === 'quests' ? <GuardianQuestsTab /> : <GuardianFutureReadyTab />}
    </div>
  )
}
