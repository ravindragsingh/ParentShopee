import { useState } from 'react'
import GuardianFutureReadyTab from '../futureready/GuardianFutureReadyTab.jsx'
import GuardianQuestsTab from '../quests/GuardianQuestsTab.jsx'

// Guardian-side counterpart to LearnGrowTab.jsx -- see that file's comment
// for why Future-Ready and Quests share one nav slot instead of each
// getting their own. No deep-link/URL state needed here (unlike the kid
// side's "Continue Learning" card), so local state is enough.
const SECTIONS = [
  { key: 'futureready', icon: '🚀', label: 'Future-Ready' },
  { key: 'quests', icon: '🧸', label: 'Quests' },
]

export default function GuardianLearnGrowTab() {
  const [section, setSection] = useState('futureready')

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {SECTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px 12px', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem',
              border: `1.5px solid ${section === s.key ? '#ea580c' : '#e2e8f0'}`,
              background: section === s.key ? '#fff7ed' : '#fff',
              color: section === s.key ? '#c2410c' : '#64748b',
            }}
          >
            <span>{s.icon}</span> {s.label}
          </button>
        ))}
      </div>

      {section === 'quests' ? <GuardianQuestsTab /> : <GuardianFutureReadyTab />}
    </div>
  )
}
