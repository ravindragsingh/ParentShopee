import MultipleChoiceGame from './MultipleChoiceGame.jsx'

const SIGHT_WORDS = [
  'the', 'and', 'a', 'to', 'said', 'you', 'is', 'it', 'in', 'was',
  'he', 'for', 'on', 'are', 'with', 'they', 'at', 'this', 'have', 'from',
  'or', 'one', 'had', 'by', 'word', 'but', 'not', 'what', 'all', 'were',
]

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateRound() {
  const target = SIGHT_WORDS[randInt(0, SIGHT_WORDS.length - 1)]
  const choices = new Set([target])
  while (choices.size < 4) choices.add(SIGHT_WORDS[randInt(0, SIGHT_WORDS.length - 1)])
  const shuffled = [...choices].sort(() => Math.random() - 0.5)

  return {
    prompt: (
      <div>
        <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 6 }}>Find the word</div>
        <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#1e293b' }}>{target}</div>
      </div>
    ),
    choices: shuffled.map(w => ({ id: w, label: w })),
    correctId: target,
  }
}

export default function SightWordsGame({ session, onExit }) {
  return <MultipleChoiceGame session={session} onExit={onExit} generateRound={generateRound} timeUpEmoji="📖" />
}
