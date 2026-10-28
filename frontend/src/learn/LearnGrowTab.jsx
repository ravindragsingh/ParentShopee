import FutureReadyTab from '../futureready/FutureReadyTab.jsx'
import QuestsTab from '../quests/QuestsTab.jsx'

// Umbrella for the kid's "learning-shaped" sections -- Future-Ready and
// Quests share this one bottom-nav/home-tile slot instead of each getting
// their own, so the nav doesn't grow a new item every time a section like
// this is added. Picking "Learn" with nothing chosen yet shows a picker
// (two big tappable cards), not the content directly with a switcher at the
// top -- `section` being unset is exactly that "nothing picked yet" state.
// `section` is driven by the URL (see KidDashboard.jsx), so a pick, the
// back button, and deep links (the home screen's "Continue Learning" card
// sets section=futureready directly, skipping the picker) are all
// back-button- and reload-friendly, same as every other tab in the app.
const SECTIONS = [
  { key: 'futureready', icon: '🚀', label: 'Future-Ready', text: 'Short lessons on money, AI, safety & more', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { key: 'quests', icon: '🧸', label: 'Quests', text: 'Hands-on things to try together', color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' },
]

function SectionPicker({ onPick }) {
  return (
    <div>
      <h3 style={{ color: '#334155', margin: '0 0 6px' }}>🌱 Learn & Grow</h3>
      <div style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: 18 }}>Pick something to explore.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {SECTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => onPick(s.key)}
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

export default function LearnGrowTab({ section, onSectionChange, onBalanceChange, startModuleId, onConsumeStart }) {
  if (!section) {
    return <SectionPicker onPick={onSectionChange} />
  }

  return (
    <div>
      <button onClick={() => onSectionChange(null)} style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', marginBottom: 14, padding: 0 }}>
        ← Back
      </button>
      {section === 'quests'
        ? <QuestsTab onBalanceChange={onBalanceChange} />
        : <FutureReadyTab onBalanceChange={onBalanceChange} startModuleId={startModuleId} onConsumeStart={onConsumeStart} />}
    </div>
  )
}
