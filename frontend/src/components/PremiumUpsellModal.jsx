// Shown when a guardian tries to turn on a premium module without an active
// subscription -- same event the backend's `premium_required` 403 already
// catches (see routers/quests.py / future_ready.py's set_*_visibility), but
// surfaced as a proactive prompt instead of a plain error banner. Duplicated
// into quests/ and futureready/ callers rather than imported deeper, same
// "conceptually separate catalogs" convention as KidPicker/PointsEditor.
export default function PremiumUpsellModal({ topicTitle, moduleTitle, activityCount, onViewPlans, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: '18px 18px 0 0', width: '100%', maxWidth: 480, padding: '22px 22px 26px', boxShadow: '0 -8px 30px rgba(0,0,0,0.18)' }}
        className="pop-in"
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8', lineHeight: 1, padding: 4 }}>✕</button>
        </div>
        <div style={{ fontSize: '1.3rem', marginBottom: 2 }}>💎</div>
        <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#1e293b', marginBottom: 4 }}>Unlock {topicTitle}</div>
        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 12 }}>
          {moduleTitle}{activityCount ? ` · ${activityCount} activities` : ''}
        </div>
        <div style={{ fontSize: '0.87rem', color: '#475569', lineHeight: 1.5, marginBottom: 18 }}>
          This is part of a premium activity pack. Premium gives your family access to every
          included pack — you choose which activities to turn on and how many points they're worth.
        </div>
        <button
          onClick={onViewPlans}
          style={{
            width: '100%', padding: '13px', fontSize: '0.92rem', fontWeight: 700, borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg,#0f766e,#0d9488)', color: '#fff', cursor: 'pointer', marginBottom: 10,
          }}
        >
          View Premium Plans
        </button>
        <button
          onClick={onClose}
          style={{ width: '100%', padding: '8px', fontSize: '0.85rem', fontWeight: 600, borderRadius: 10, border: 'none', background: 'none', color: '#64748b', cursor: 'pointer' }}
        >
          Not now
        </button>
      </div>
    </div>
  )
}
