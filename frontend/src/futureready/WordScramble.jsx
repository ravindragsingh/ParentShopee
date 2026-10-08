import { useMemo, useState } from 'react'
import Reaction from './Reaction.jsx'

function shuffleLetters(word) {
  const letters = word.split('').map((ch, i) => ({ ch, i }))
  for (let k = letters.length - 1; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1))
    ;[letters[k], letters[j]] = [letters[j], letters[k]]
  }
  // A shuffle that happens to land back in the original order isn't much of
  // a puzzle -- reshuffle once more if so (harmless no-op for 1-2 letter words).
  if (letters.every((l, idx) => l.i === idx) && letters.length > 2) {
    return shuffleLetters(word)
  }
  return letters
}

// Spell-the-word puzzle: tap scrambled letter tiles in the right order to
// build the target word. Tapping the correct next letter locks it into the
// "your spelling" row; tapping any other letter just shakes that tile. Built
// for sight-words, but config-driven so any topic's key term could use it.
export default function WordScramble({ config, onResult }) {
  const { word, hint } = config
  const target = word.toLowerCase()
  const tiles = useMemo(() => shuffleLetters(target), [target])
  const [placed, setPlaced] = useState([]) // original tile indices, in tap order
  const [shakeIndex, setShakeIndex] = useState(null)

  const done = placed.length === target.length

  function tap(tile) {
    if (done || placed.includes(tile.i)) return
    if (tile.ch === target[placed.length]) {
      setPlaced(p => [...p, tile.i])
      onResult?.(true)
    } else {
      setShakeIndex(tile.i)
      onResult?.(false)
      setTimeout(() => setShakeIndex(null), 450)
    }
  }

  return (
    <div style={{ marginTop: 18, textAlign: 'left', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 16px 18px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f766e', marginBottom: 4, textAlign: 'center' }}>
        🔤 Unscramble the word
      </div>
      {hint && (
        <div style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', marginBottom: 10 }}>
          {hint}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 14 }}>
        {target.split('').map((ch, pos) => (
          <div key={pos} style={{
            width: 30, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.05rem', fontWeight: 800, textTransform: 'uppercase',
            border: `2px solid ${pos < placed.length ? '#86efac' : '#e2e8f0'}`,
            background: pos < placed.length ? '#f0fdf4' : '#fff', color: '#166534',
          }}>
            {pos < placed.length ? target[pos] : ''}
          </div>
        ))}
      </div>

      {!done && (
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8 }}>
          {tiles.filter(t => !placed.includes(t.i)).map(tile => (
            <button
              key={tile.i}
              type="button"
              onClick={() => tap(tile)}
              className={shakeIndex === tile.i ? 'tile-shake' : ''}
              style={{
                width: 38, height: 38, borderRadius: 8, fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase',
                border: '1.5px solid #e2e8f0', background: '#fff', color: '#1e293b', cursor: 'pointer',
              }}
            >
              {tile.ch}
            </button>
          ))}
        </div>
      )}

      {done && (
        <>
          <Reaction status="correct" keyProp="scramble-done" />
          <div className="pop-in" style={{ textAlign: 'center', marginTop: 4, fontSize: '0.82rem', fontWeight: 700, color: '#059669' }}>
            🎉 You spelled it!
          </div>
        </>
      )}
    </div>
  )
}
