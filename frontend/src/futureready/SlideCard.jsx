import CompoundGrowthWidget from './CompoundGrowthWidget.jsx'
import SaveVsInvestWidget from './SaveVsInvestWidget.jsx'
import RiskRewardSimulator from './RiskRewardSimulator.jsx'
import DiversificationPuzzle from './DiversificationPuzzle.jsx'
import RuleOf72Widget from './RuleOf72Widget.jsx'
import NeedVsWantSort from './NeedVsWantSort.jsx'
import SortPuzzle from './SortPuzzle.jsx'
import ScenarioPicker from './ScenarioPicker.jsx'
import MatchingPairs from './MatchingPairs.jsx'
import BudgetSplitWidget from './BudgetSplitWidget.jsx'
import ProfitCalculatorWidget from './ProfitCalculatorWidget.jsx'
import SequenceOrder from './SequenceOrder.jsx'
import WordScramble from './WordScramble.jsx'
import SliderGuess from './SliderGuess.jsx'
import OddOneOut from './OddOneOut.jsx'

// Maps a slide's optional "widget" key to the interactive component that
// renders below its text -- data-driven so a new interactive slide only
// needs a new entry here, not a new slide "type" switch spread everywhere.
// The first six are topic-specific (investing); the rest are generic,
// config-driven widgets reused across every other Future-Ready topic.
// Exported so both LessonModule.jsx (kid-facing playthrough) and
// AdminContentPanel.jsx (live preview while authoring) stay in sync with
// exactly the same set of widget types -- adding a 16th widget means
// registering it once, here.
export const SLIDE_WIDGETS = {
  'compound-growth': CompoundGrowthWidget,
  'save-vs-invest': SaveVsInvestWidget,
  'risk-reward': RiskRewardSimulator,
  'diversification': DiversificationPuzzle,
  'rule-of-72': RuleOf72Widget,
  'need-vs-want': NeedVsWantSort,
  'sort-puzzle': SortPuzzle,
  'scenario-picker': ScenarioPicker,
  'matching-pairs': MatchingPairs,
  'budget-split': BudgetSplitWidget,
  'profit-calculator': ProfitCalculatorWidget,
  'sequence-order': SequenceOrder,
  'word-scramble': WordScramble,
  'slider-guess': SliderGuess,
  'odd-one-out': OddOneOut,
}

// Pure content of one slide -- emoji, title, text, and its optional
// interactive widget. No card chrome, no swipe/animation handling, no quiz
// or fetch concerns -- just the thing rendered inside the card wrapper.
// LessonModule.jsx owns the kid-facing swipeable deck chrome around this;
// AdminContentPanel.jsx wraps the same component in a plain preview box.
export default function SlideCard({ slide, onResult }) {
  if (!slide) return null
  const Widget = slide.widget ? SLIDE_WIDGETS[slide.widget] : null
  return (
    <>
      <div style={{ fontSize: '2.6rem', marginBottom: 12 }}>{slide.emoji}</div>
      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: 10 }}>
        {slide.title}
      </div>
      <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.7, margin: 0 }}>
        {slide.text}
      </p>
      {Widget && <Widget config={slide.widgetConfig} onResult={onResult} />}
    </>
  )
}
