import MultipleChoiceGame from './MultipleChoiceGame.jsx'

const WORDS = [
  'cat', 'dog', 'sun', 'ball', 'tree', 'fish', 'frog', 'star', 'moon', 'book',
  'cake', 'jump', 'play', 'swim', 'bird', 'milk', 'rain', 'snow', 'ship', 'king',
]

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function scramble(word) {
  const letters = word.split('')
  for (let i = letters.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [letters[i], letters[j]] = [letters[j], letters[i]]
  }
  const result = letters.join('')
  return result === word && word.length > 1 ? scramble(word) : result
}

function generateRound() {
  const target = WORDS[randInt(0, WORDS.length - 1)]
  const scrambled = scramble(target)
  const choices = new Set([target])
  while (choices.size < 4) choices.add(WORDS[randInt(0, WORDS.length - 1)])
  const shuffled = [...choices].sort(() => Math.random() - 0.5)

  return {
    prompt: (
      <div>
        <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 6 }}>Unscramble</div>
        <div style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: 4, color: '#1e293b' }}>{scrambled.toUpperCase()}</div>
      </div>
    ),
    choices: shuffled.map(w => ({ id: w, label: w })),
    correctId: target,
  }
}

export default function WordScrambleGame(props) {
  return <MultipleChoiceGame {...props} generateRound={generateRound} timeUpEmoji="🔀" />
}
