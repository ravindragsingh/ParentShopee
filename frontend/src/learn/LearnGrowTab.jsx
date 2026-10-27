import FutureReadyTab from '../futureready/FutureReadyTab.jsx'
import QuestsTab from '../quests/QuestsTab.jsx'

// Umbrella for the kid's "learning-shaped" sections -- Future-Ready and
// Quests share this one bottom-nav/home-tile slot instead of each getting
// their own, so the nav doesn't grow a new item every time a section like
// this is added. `section` is driven by the URL (see KidDashboard.jsx), so
// switching sub-sections is back-button- and deep-link-friendly, same as
// every other tab in the app.
const SECTIONS = [
  { key: 'futureready', icon: '🚀', label: 'Future-Ready' },
  { key: 'quests', icon: '🧸', label: 'Quests' },
]

export default function LearnGrowTab({ section, onSectionChange, onBalanceChange, startModuleId, onConsumeStart }) {
  const active = section === 'quests' ? 'quests' : 'futureready'

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {SECTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => onSectionChange(s.key)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px 12px', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem',
              border: `1.5px solid ${active === s.key ? '#0d9488' : '#e2e8f0'}`,
              background: active === s.key ? '#f0fdfa' : '#fff',
              color: active === s.key ? '#0f766e' : '#64748b',
            }}
          >
            <span>{s.icon}</span> {s.label}
          </button>
        ))}
      </div>

      {active === 'quests'
        ? <QuestsTab onBalanceChange={onBalanceChange} />
        : <FutureReadyTab onBalanceChange={onBalanceChange} startModuleId={startModuleId} onConsumeStart={onConsumeStart} />}
    </div>
  )
}
