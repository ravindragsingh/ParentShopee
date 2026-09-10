import { INVESTING_CONTENT } from './investingContent.js'
import { AI_CONTENT } from './aiContent.js'
import { ENTREPRENEURSHIP_CONTENT } from './entrepreneurshipContent.js'
import { CRITICAL_THINKING_CONTENT } from './criticalThinkingContent.js'
import { COMMUNICATION_CONTENT } from './communicationContent.js'
import { DIGITAL_SAFETY_CONTENT } from './digitalSafetyContent.js'
import { PROBLEM_SOLVING_CONTENT } from './problemSolvingContent.js'
import { LEADERSHIP_CONTENT } from './leadershipContent.js'
import { NEGOTIATION_CONTENT } from './negotiationContent.js'

// Every topic's content, merged into one map keyed by module id -- adding
// another topic later means a new content file and one more spread here, no
// changes to LessonModule.jsx or either tab component.
export const LESSON_CONTENT = {
  ...INVESTING_CONTENT,
  ...AI_CONTENT,
  ...ENTREPRENEURSHIP_CONTENT,
  ...CRITICAL_THINKING_CONTENT,
  ...COMMUNICATION_CONTENT,
  ...DIGITAL_SAFETY_CONTENT,
  ...PROBLEM_SOLVING_CONTENT,
  ...LEADERSHIP_CONTENT,
  ...NEGOTIATION_CONTENT,
}
