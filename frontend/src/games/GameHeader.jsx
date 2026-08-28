import { formatRemaining } from './formatRemaining.js'

// Shared "Back to Games" + status text + countdown chip row every game screen uses.
export default function GameHeader({ onExit, status, remainingMs, timeUp }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
      <button className="btn btn-outline btn-sm" onClick={onExit}>← Back to Games</button>
      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{status}</span>
      <span
        style={{
          fontSize: '0.85rem', fontWeight: 700, borderRadius: 999, padding: '4px 12px',
          background: timeUp ? '#fee2e2' : remainingMs < 60000 ? '#fed7aa' : '#ccfbf1',
          color: timeUp ? '#b91c1c' : remainingMs < 60000 ? '#c2410c' : '#0d9488',
        }}
      >
        ⏱️ {timeUp ? "Time's up" : formatRemaining(remainingMs)}
      </span>
    </div>
  )
}
