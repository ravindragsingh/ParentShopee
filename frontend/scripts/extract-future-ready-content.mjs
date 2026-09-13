// Regenerates backend/future_ready_content.json from the lesson content
// authored in src/futureready/*Content.js. Run this after editing any
// existing lesson's slides/quiz, or adding a new topic's content file, then
// commit the regenerated JSON alongside it and redeploy the backend --
// that's the whole release process for a content-only change, since the
// backend serves this file's contents live via GET /api/future-ready/:id/content
// instead of the app needing to bundle it. See backend/main.py's startup
// seeding and backend/routers/future_ready.py.
//
// Usage: node scripts/extract-future-ready-content.mjs   (run from frontend/)
import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { LESSON_CONTENT } from '../src/futureready/lessonContent.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outPath = resolve(__dirname, '../../backend/future_ready_content.json')

writeFileSync(outPath, JSON.stringify(LESSON_CONTENT, null, 2) + '\n')
console.log(`Wrote ${Object.keys(LESSON_CONTENT).length} modules' content to ${outPath}`)
