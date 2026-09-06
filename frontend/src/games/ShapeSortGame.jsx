import MultipleChoiceGame from './MultipleChoiceGame.jsx'

const SHAPES = [
  { name: 'Circle', emoji: '🔵' },
  { name: 'Square', emoji: '⬛' },
  { name: 'Triangle', emoji: '🔺' },
  { name: 'Star', emoji: '⭐' },
  { name: 'Heart', emoji: '❤️' },
  { name: 'Diamond', emoji: '🔶' },
]

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateRound() {
  const answer = SHAPES[randInt(0, SHAPES.length - 1)]

  const choiceNames = new Set([answer.name])
  while (choiceNames.size < 4) choiceNames.add(SHAPES[randInt(0, SHAPES.length - 1)].name)
  const shuffled = [...choiceNames].sort(() => Math.random() - 0.5)

  return {
    prompt: <div style={{ fontSize: '4rem' }}>{answer.emoji}</div>,
    choices: shuffled.map(name => ({ id: name, label: name })),
    correctId: answer.name,
  }
}

export default function ShapeSortGame(props) {
  return <MultipleChoiceGame {...props} generateRound={generateRound} timeUpEmoji="🔷" />
}
