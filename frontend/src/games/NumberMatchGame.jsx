import MultipleChoiceGame from './MultipleChoiceGame.jsx'

const OBJECT_EMOJIS = ['🍎', '⭐', '🐶', '🎈', '🍓', '🚗']

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateRound() {
  const target = randInt(1, 10)
  const emoji = OBJECT_EMOJIS[randInt(0, OBJECT_EMOJIS.length - 1)]
  const choices = new Set([target])
  while (choices.size < 4) {
    const candidate = randInt(1, 10)
    if (candidate !== target) choices.add(candidate)
  }
  const shuffled = [...choices].sort(() => Math.random() - 0.5)

  return {
    prompt: (
      <div>
        <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 8 }}>How many?</div>
        <div style={{ fontSize: '1.8rem', lineHeight: 1.5, wordBreak: 'break-word' }}>
          {emoji.repeat(target)}
        </div>
      </div>
    ),
    choices: shuffled.map(n => ({ id: n, label: n })),
    correctId: target,
  }
}

export default function NumberMatchGame({ session, onExit }) {
  return <MultipleChoiceGame session={session} onExit={onExit} generateRound={generateRound} timeUpEmoji="🔢" />
}
