// "Nova" the rocket buddy -- a single recurring character (ties back to the
// 🚀 Future-Ready branding used everywhere else) that reacts to correct/wrong
// taps across the quiz-style widgets (ScenarioPicker, SortPuzzle,
// MatchingPairs), via CSS keyframes in styles.css. Emoji-based rather than
// an illustrated asset, consistent with the rest of the app's visual style.
const PARTICLES = ['🎉', '✨', '⭐', '🎊']

export default function Reaction({ status, keyProp }) {
  if (!status) return null
  if (status === 'correct') {
    return (
      <div className="mascot-reaction mascot-correct" key={keyProp} aria-hidden="true">
        <span className="mascot-face">🚀</span>
        <span className="mascot-sparkle">✨</span>
        <div className="mascot-confetti">
          {PARTICLES.map((p, i) => <span key={i} className={`confetti-piece confetti-${i}`}>{p}</span>)}
        </div>
      </div>
    )
  }
  return (
    <div className="mascot-reaction mascot-oops" key={keyProp} aria-hidden="true">
      <span className="mascot-face">🚀</span>
      <span className="mascot-thought">💭</span>
    </div>
  )
}
