import MemoryMatchGame from './MemoryMatchGame.jsx'
import QuickMathGame from './QuickMathGame.jsx'
import AlphabetHuntGame from './AlphabetHuntGame.jsx'
import NumberMatchGame from './NumberMatchGame.jsx'
import SightWordsGame from './SightWordsGame.jsx'
import WordScrambleGame from './WordScrambleGame.jsx'
import SnakeGame from './SnakeGame.jsx'
import WhackAMoleGame from './WhackAMoleGame.jsx'
import TicTacToeGame from './TicTacToeGame.jsx'

// Add a new game's slug -> component here to make it playable once it has a
// matching row in the backend's games catalog (backend/main.py seeds it).
// Shared by the kid-facing GamesTab (real purchased passes) and the
// guardian-facing GuardianGamesTab ("Try It" preview, no purchase involved).
export const GAME_COMPONENTS = {
  'memory-match': MemoryMatchGame,
  'quick-math': QuickMathGame,
  'alphabet-hunt': AlphabetHuntGame,
  'number-match': NumberMatchGame,
  'sight-words': SightWordsGame,
  'word-scramble': WordScrambleGame,
  'snake': SnakeGame,
  'whack-a-mole': WhackAMoleGame,
  'tic-tac-toe': TicTacToeGame,
}
