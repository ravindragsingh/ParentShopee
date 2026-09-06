import { useState } from 'react'
import { formatRemaining } from './formatRemaining.js'
import { isSoundMuted, setSoundMuted } from './gameSounds.js'

// Shared "Back to Games" + status text + countdown chip + sound toggle row
// every game screen uses. The mute setting is global (one localStorage key
// shared by every game via gameSounds.js), so muting in one game keeps it
// muted in the next one too, rather than surprising a kid who just turned it off.
export default function GameHeader({ onExit, gameName, status, remainingMs, timeUp }) {
  const [muted, setMuted] = useState(isSoundMuted)

  function toggleMuted() {
    const next = !muted
    setSoundMuted(next)
    setMuted(next)
  }

  return (
    <div style={{ marginBottom: 14 }}>
      {gameName && (
        <div style={{ textAlign: 'center', fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', marginBottom: 10 }}>
          {gameName}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <button className="btn btn-outline btn-sm" onClick={onExit}>← Back to Games</button>
        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{status}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={toggleMuted}
            aria-label={muted ? 'Unmute sound' : 'Mute sound'}
            title={muted ? 'Unmute sound' : 'Mute sound'}
            style={{
              background: 'none', border: '1px solid #e2e8f0', borderRadius: 999,
              width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: '0.95rem',
            }}
          >
            {muted ? '🔇' : '🔊'}
          </button>
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
      </div>
    </div>
  )
}
