import MultipleChoiceGame from './MultipleChoiceGame.jsx'

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateRound() {
  const op = ['+', '-', '×'][randInt(0, 2)]
  let a, b, answer
  if (op === '+') { a = randInt(1, 20); b = randInt(1, 20); answer = a + b }
  else if (op === '-') { a = randInt(1, 20); b = randInt(1, a); answer = a - b }
  else { a = randInt(1, 10); b = randInt(1, 10); answer = a * b }

  const choices = new Set([answer])
  while (choices.size < 4) {
    const delta = randInt(-5, 5) || 1
    const candidate = answer + delta
    if (candidate >= 0) choices.add(candidate)
  }
  const shuffled = [...choices].sort(() => Math.random() - 0.5)

  return {
    prompt: <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#1e293b' }}>{a} {op} {b}</div>,
    choices: shuffled.map(n => ({ id: n, label: n })),
    correctId: answer,
  }
}

export default function QuickMathGame(props) {
  return <MultipleChoiceGame {...props} generateRound={generateRound} timeUpEmoji="🧮" />
}
