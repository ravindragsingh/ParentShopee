import MultipleChoiceGame from './MultipleChoiceGame.jsx'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateRound() {
  const target = ALPHABET[randInt(0, ALPHABET.length - 1)]
  const choices = new Set([target])
  while (choices.size < 4) choices.add(ALPHABET[randInt(0, ALPHABET.length - 1)])
  const shuffled = [...choices].sort(() => Math.random() - 0.5)

  return {
    prompt: (
      <div>
        <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 6 }}>Find the letter</div>
        <div style={{ fontSize: '3.4rem', fontWeight: 800, color: '#1e293b' }}>{target}</div>
      </div>
    ),
    choices: shuffled.map(l => ({ id: l, label: l })),
    correctId: target,
  }
}

export default function AlphabetHuntGame(props) {
  return <MultipleChoiceGame {...props} generateRound={generateRound} timeUpEmoji="🔤" />
}
