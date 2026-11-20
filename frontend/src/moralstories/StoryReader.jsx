import { useEffect, useRef, useState } from 'react'
import { api } from '../api.js'

// The Web Speech API hands back whatever voice the device defaults to if you
// don't pick one -- on most platforms that default is the oldest, most
// robotic-sounding voice installed, while noticeably better ones (often
// cloud-backed, e.g. Chrome's "Google US English") sit unused in the same
// list. voices() resolves once the list is actually populated -- Chrome in
// particular returns an empty array the first time it's asked, firing
// `voiceschanged` only once the real list is ready.
function voices() {
  return new Promise(resolve => {
    const list = window.speechSynthesis?.getVoices() || []
    if (list.length) { resolve(list); return }
    window.speechSynthesis.onvoiceschanged = () => resolve(window.speechSynthesis.getVoices())
    setTimeout(() => resolve(window.speechSynthesis?.getVoices() || []), 500)
  })
}

// Known-good voices worth asking for by name first, roughly best-to-worst,
// across the platforms this app actually runs on (Chrome desktop/Android,
// Safari/iOS). Falls through to "any non-local (cloud) English voice" --
// cloud voices are near-universally more natural than a device's bundled
// compact/offline ones -- then any ordinary local English voice.
const PREFERRED_VOICE_NAMES = [
  'Google US English', 'Google UK English Female', 'Google UK English Male',
  'Microsoft Aria Online (Natural) - English (United States)',
  'Microsoft Jenny Online (Natural) - English (United States)',
  'Alex', 'Samantha', 'Daniel', 'Karen', 'Moira', 'Tessa', 'Victoria',
]

// macOS alone ships over a dozen "fun" novelty voices (robots, whispering,
// pipe organs...) alongside its normal ones, and they sort into the English
// voice list like any other -- a naive "just take the first English voice"
// fallback can land on one of these instead of a normal-sounding voice. Never
// shipped on iOS/Android, so this only ever matters when testing in a
// desktop browser, but it's cheap to rule out explicitly either way.
const NOVELTY_VOICE_NAMES = new Set([
  'Albert', 'Bad News', 'Bahh', 'Bells', 'Boing', 'Bubbles', 'Cellos', 'Good News',
  'Hysterical', 'Jester', 'Organ', 'Pipe Organ', 'Trinoids', 'Whisper', 'Wobble', 'Zarvox',
  'Deranged', 'Superstar', 'Ralph',
])

function pickBestVoice(list) {
  for (const name of PREFERRED_VOICE_NAMES) {
    const v = list.find(v => v.name === name)
    if (v) return v
  }
  const normal = v => v.lang?.startsWith('en') && !NOVELTY_VOICE_NAMES.has(v.name)
  return list.find(v => !v.localService && normal(v))
    || list.find(normal)
    || list.find(v => v.lang?.startsWith('en'))
    || list[0] || null
}

// Moral Stories gets its own reader instead of reusing Future-Ready's
// LessonModule -- that one is a slide-by-slide lesson deck (swipe, dot
// progress, one sentence at a time), which reads like an app, not a story.
// This renders the whole thing as one continuous, illustrated page a kid
// scrolls through -- closer to an actual storybook -- then moves into the
// same quiz/result shape every other Learn & Grow section uses, so a
// guardian previewing it or a kid finishing it sees familiar scoring and
// celebration either way.
export default function StoryReader({ module, onExit, onCompleted, previewMode = false, subtitle }) {
  const [content, setContent] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [phase, setPhase] = useState('story') // 'story' | 'quiz' | 'result'
  const [reading, setReading] = useState(false)
  const bestVoiceRef = useRef(null)
  const [quizIndex, setQuizIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [selected, setSelected] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    api.getMoralStoryContent(module.id)
      .then(data => { if (!cancelled) setContent(data) })
      .catch(err => { if (!cancelled) setLoadError(err.message || "This story isn't ready yet.") })
    return () => { cancelled = true }
  }, [module.id])

  useEffect(() => {
    return () => window.speechSynthesis?.cancel()
  }, [])

  async function toggleReadAloud() {
    if (reading) {
      window.speechSynthesis?.cancel()
      setReading(false)
      return
    }
    if (!window.speechSynthesis) return
    if (!bestVoiceRef.current) bestVoiceRef.current = pickBestVoice(await voices())
    window.speechSynthesis.cancel()
    content.slides.forEach((slide, i) => {
      const utterance = new SpeechSynthesisUtterance(`${slide.title}. ${slide.text}`)
      utterance.rate = 0.95
      if (bestVoiceRef.current) utterance.voice = bestVoiceRef.current
      if (i === content.slides.length - 1) utterance.onend = () => setReading(false)
      window.speechSynthesis.speak(utterance)
    })
    setReading(true)
  }

  if (loadError) {
    return <div className="error-msg">{loadError}</div>
  }
  if (!content) {
    return <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>Loading story…</div>
  }

  const score = answers.reduce((s, a, i) => s + (a === content.quiz[i].correctIndex ? 1 : 0), 0)

  function handleChoice(idx) {
    if (selected !== null) return
    setSelected(idx)
    const nextAnswers = [...answers, idx]
    setTimeout(() => {
      setAnswers(nextAnswers)
      setSelected(null)
      if (quizIndex + 1 < content.quiz.length) {
        setQuizIndex(quizIndex + 1)
      } else {
        submitQuiz(nextAnswers)
      }
    }, 1200)
  }

  async function submitQuiz(finalAnswers) {
    const finalScore = finalAnswers.reduce((s, a, i) => s + (a === content.quiz[i].correctIndex ? 1 : 0), 0)
    if (previewMode) {
      setResult({ passed: finalScore / content.quiz.length >= 0.6, alreadyCompleted: false, pointsAwarded: 0, preview: true })
      setPhase('result')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await api.completeMoralStory(module.id, finalScore, content.quiz.length)
      setResult(res)
      if (res.passed && !res.alreadyCompleted) onCompleted?.(res.pointsAwarded)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
      setPhase('result')
    }
  }

  function retakeQuiz() {
    setQuizIndex(0)
    setAnswers([])
    setSelected(null)
    setResult(null)
    setPhase('quiz')
  }

  return (
    <div style={{ maxWidth: 460, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 10 }}>
        <button className="btn btn-outline btn-sm" onClick={onExit}>← Back</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', textAlign: 'right' }}>{subtitle ?? module.topicTitle}</span>
          {phase === 'story' && (
            <button
              type="button"
              onClick={toggleReadAloud}
              title={reading ? 'Stop reading' : 'Read story aloud'}
              style={{
                background: 'none', border: '1px solid #e2e8f0', borderRadius: 999, cursor: 'pointer',
                fontSize: '1rem', padding: '4px 9px', lineHeight: 1, flexShrink: 0,
              }}
            >
              {reading ? '⏹' : '🔊'}
            </button>
          )}
        </div>
      </div>

      {phase !== 'result' && (
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <span style={{
            fontSize: '0.78rem', fontWeight: 700, color: '#0f766e', background: '#f0fdfa',
            border: '1px solid #99f6e4', borderRadius: 999, padding: '4px 12px',
          }}>
            ⭐ Earn {module.points} pts for finishing this story
          </span>
        </div>
      )}

      {phase === 'story' && (
        <div>
          <div style={{
            background: '#fffdf7', border: '1px solid #f3e8c9', borderRadius: 20, padding: '28px 24px',
            boxShadow: '0 6px 20px rgba(120,90,30,0.07)',
          }}>
            {content.slides.map((slide, i) => (
              <div key={i}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%', background: '#fef3c7', margin: '0 auto 14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem',
                  }}>
                    {slide.emoji}
                  </div>
                  <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.95rem', fontWeight: 700, color: '#92400e', marginBottom: 10 }}>
                    {slide.title}
                  </div>
                  <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.05rem', color: '#44403c', lineHeight: 1.8, margin: 0, textAlign: 'left' }}>
                    {slide.text}
                  </p>
                </div>
                {i < content.slides.length - 1 && (
                  <div style={{ textAlign: 'center', color: '#d6c9a3', fontSize: '1.1rem', letterSpacing: '0.3em', margin: '26px 0' }}>
                    • • •
                  </div>
                )}
              </div>
            ))}
          </div>
          <button
            className="btn btn-green"
            onClick={() => { window.speechSynthesis?.cancel(); setReading(false); setPhase('quiz') }}
            style={{ width: '100%', marginTop: 20 }}
          >
            The End · Answer a few questions 📝
          </button>
        </div>
      )}

      {phase === 'quiz' && (
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: 10, textAlign: 'center' }}>
            Question {quizIndex + 1} of {content.quiz.length}
          </div>
          <div style={{
            background: '#fff', border: '1px solid #f1f5f9', borderRadius: 16, padding: '26px 22px',
            textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', marginBottom: 18,
          }}>
            <div style={{ fontSize: '1.02rem', fontWeight: 700, color: '#1e293b', marginBottom: selected !== null ? 12 : 0 }}>
              {content.quiz[quizIndex].question}
            </div>
            {selected !== null && (
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 4 }}>
                {content.quiz[quizIndex].explanation}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {content.quiz[quizIndex].choices.map((choice, i) => {
              const isCorrect = i === content.quiz[quizIndex].correctIndex
              let background = 'linear-gradient(135deg, #0d9488, #0891b2)'
              if (selected !== null) {
                if (isCorrect) background = '#059669'
                else if (i === selected) background = '#dc2626'
                else background = '#cbd5e1'
              }
              return (
                <button
                  key={i}
                  onClick={() => handleChoice(i)}
                  disabled={selected !== null}
                  style={{
                    padding: '14px 18px', fontSize: '0.98rem', fontWeight: 700, color: '#fff',
                    borderRadius: 12, border: 'none', cursor: selected !== null ? 'default' : 'pointer',
                    background, transition: 'background 0.15s ease', textAlign: 'left',
                  }}
                >
                  {choice}
                </button>
              )
            })}
          </div>
          {submitting && <div style={{ textAlign: 'center', marginTop: 14, color: '#94a3b8', fontSize: '0.85rem' }}>Checking your answers…</div>}
        </div>
      )}

      {phase === 'result' && (
        error ? (
          <div className="error-msg">{error}</div>
        ) : result?.passed ? (
          <div className="result-celebration" style={{ textAlign: 'center', padding: '34px 20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 16 }}>
            <div className="nova-flyby" aria-hidden="true">📖</div>
            <div className="mega-confetti" aria-hidden="true">
              {['🎉', '✨', '⭐', '🎊', '🎈', '🌟', '💫', '🏆'].map((p, i) => (
                <span key={i} className={`confetti-piece mc-${i}`}>{p}</span>
              ))}
            </div>
            <div style={{ fontSize: '2.6rem', marginBottom: 8 }}>🎉</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#166534' }}>
              You got {score} of {content.quiz.length} right!
            </div>
            <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: 8 }}>
              {result.preview
                ? `This is a preview — kids earn ${module.points} points for finishing this story.`
                : result.alreadyCompleted
                ? "You've already earned points for this story — great review!"
                : `You earned ${result.pointsAwarded} points! 🌟`}
            </div>
            <button className="btn btn-green" style={{ marginTop: 18 }} onClick={onExit}>Back</button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '34px 20px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 16 }}>
            <div style={{ fontSize: '2.6rem', marginBottom: 8 }}>🤔</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#b91c1c' }}>
              You got {score} of {content.quiz.length} — so close!
            </div>
            <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: 8 }}>
              Read the story again and try the quiz once more to earn your points.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 18 }}>
              <button className="btn btn-outline" onClick={() => setPhase('story')}>Read again</button>
              <button className="btn btn-green" onClick={retakeQuiz}>Try quiz again</button>
            </div>
          </div>
        )
      )}
    </div>
  )
}
