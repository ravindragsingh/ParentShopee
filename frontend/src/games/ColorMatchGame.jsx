import MultipleChoiceGame from './MultipleChoiceGame.jsx'

// Classic Stroop effect: the word names one color but is printed in a
// different ink color. The challenge is answering with the ink color while
// ignoring what the word actually says.
const COLORS = [
  { name: 'Red', hex: '#dc2626' },
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Green', hex: '#16a34a' },
  { name: 'Yellow', hex: '#ca8a04' },
  { name: 'Purple', hex: '#9333ea' },
  { name: 'Orange', hex: '#ea580c' },
]

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickColor() {
  return COLORS[randInt(0, COLORS.length - 1)]
}

function generateRound() {
  const word = pickColor()
  let ink = pickColor()
  // Mismatched ink/word is the whole point, but let it match sometimes so
  // kids can't just learn "always pick the different one".
  if (Math.random() < 0.8) {
    while (ink.name === word.name) ink = pickColor()
  }

  const choiceNames = new Set([ink.name])
  while (choiceNames.size < 4) choiceNames.add(pickColor().name)
  const shuffled = [...choiceNames].sort(() => Math.random() - 0.5)

  return {
    prompt: (
      <div>
        <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: 8 }}>Tap the COLOR of the letters, not the word</div>
        <div style={{ fontSize: '2.1rem', fontWeight: 800, color: ink.hex, letterSpacing: '0.03em' }}>{word.name.toUpperCase()}</div>
      </div>
    ),
    choices: shuffled.map(name => ({ id: name, label: name })),
    correctId: ink.name,
  }
}

export default function ColorMatchGame(props) {
  return <MultipleChoiceGame {...props} generateRound={generateRound} timeUpEmoji="🎨" />
}
