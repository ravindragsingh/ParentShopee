import MemoryMatchGame from './MemoryMatchGame.jsx'
import QuickMathGame from './QuickMathGame.jsx'
import AlphabetHuntGame from './AlphabetHuntGame.jsx'
import NumberMatchGame from './NumberMatchGame.jsx'
import SightWordsGame from './SightWordsGame.jsx'
import WordScrambleGame from './WordScrambleGame.jsx'
import WhackAMoleGame from './WhackAMoleGame.jsx'
import TicTacToeGame from './TicTacToeGame.jsx'
import ColorMatchGame from './ColorMatchGame.jsx'
import ShapeSortGame from './ShapeSortGame.jsx'
import MemorySequenceGame from './MemorySequenceGame.jsx'

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
  'whack-a-mole': WhackAMoleGame,
  'tic-tac-toe': TicTacToeGame,
  'color-match': ColorMatchGame,
  'shape-sort': ShapeSortGame,
  'memory-sequence': MemorySequenceGame,
}
