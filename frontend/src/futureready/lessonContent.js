import { INVESTING_CONTENT } from './investingContent.js'
import { AI_CONTENT } from './aiContent.js'

// Every topic's content, merged into one map keyed by module id -- adding a
// third topic later means a new content file and one more spread here, no
// changes to LessonModule.jsx or either tab component.
export const LESSON_CONTENT = { ...INVESTING_CONTENT, ...AI_CONTENT }
