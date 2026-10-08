import { useMemo, useState } from 'react'
import Reaction from './Reaction.jsx'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Generic tap-two-cards matching puzzle: left column is one shuffled list,
// right column another -- tap one from each side, a correct match locks in
// green, a wrong one flashes red and resets. Good for term <-> meaning,
// word <-> picture, cause <-> effect, etc. across any topic.
export default function MatchingPairs({ config, onResult }) {
  const { pairs } = config
  const left = useMemo(() => shuffle(pairs.map((p, i) => ({ i, text: p.left }))), [pairs])
  const right = useMemo(() => shuffle(pairs.map((p, i) => ({ i, text: p.right }))), [pairs])

  const [selectedLeft, setSelectedLeft] = useState(null)
  const [selectedRight, setSelectedRight] = useState(null)
  const [matched, setMatched] = useState(new Set())
  const [wrongFlash, setWrongFlash] = useState(false)
  const [lastResult, setLastResult] = useState(null) // { correct, key } for the mascot reaction

  function pick(side, item) {
    if (matched.has(item.i)) return
    if (wrongFlash) return
    if (side === 'left') setSelectedLeft(item)
    else setSelectedRight(item)

    const otherSelected = side === 'left' ? selectedRight : selectedLeft
    if (otherSelected) {
      if (otherSelected.i === item.i) {
        setMatched(m => new Set([...m, item.i]))
        setSelectedLeft(null)
        setSelectedRight(null)
        setLastResult({ correct: true, key: `${item.i}-ok` })
        onResult?.(true)
      } else {
        setWrongFlash(true)
        setLastResult({ correct: false, key: `${item.i}-${otherSelected.i}-bad` })
        onResult?.(false)
        setTimeout(() => {
          setWrongFlash(false)
          setSelectedLeft(null)
          setSelectedRight(null)
        }, 650)
      }
    }
  }

  function cardStyle(item, side) {
    const isMatched = matched.has(item.i)
    const isSelected = (side === 'left' ? selectedLeft : selectedRight)?.i === item.i
    return {
      padding: '9px 10px', borderRadius: 9, fontSize: '0.76rem', fontWeight: 700, textAlign: 'center',
      cursor: isMatched ? 'default' : 'pointer', transition: 'all 0.15s',
      border: `1.5px solid ${isMatched ? '#86efac' : isSelected ? (wrongFlash ? '#fca5a5' : '#0d9488') : '#e2e8f0'}`,
      background: isMatched ? '#f0fdf4' : isSelected ? (wrongFlash ? '#fef2f2' : '#f0fdfa') : '#fff',
      color: isMatched ? '#166534' : '#1e293b',
      opacity: isMatched ? 0.7 : 1,
    }
  }

  const allMatched = matched.size === pairs.length

  return (
    <div style={{ marginTop: 18, textAlign: 'left', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 16px 18px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f766e', marginBottom: 4, textAlign: 'center' }}>
        🧩 Match the pairs
      </div>
      {lastResult && !allMatched && (
        <Reaction status={lastResult.correct ? 'correct' : 'incorrect'} keyProp={lastResult.key} />
      )}
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {left.map(item => (
            <button key={`l${item.i}`} type="button" onClick={() => pick('left', item)} style={cardStyle(item, 'left')}>
              {item.text}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {right.map(item => (
            <button key={`r${item.i}`} type="button" onClick={() => pick('right', item)} style={cardStyle(item, 'right')}>
              {item.text}
            </button>
          ))}
        </div>
      </div>
      {allMatched && (
        <>
          <Reaction status="correct" keyProp="all-matched" />
          <div className="pop-in" style={{ textAlign: 'center', marginTop: 4, fontSize: '0.82rem', fontWeight: 700, color: '#059669' }}>
            🎉 All matched!
          </div>
        </>
      )}
    </div>
  )
}
