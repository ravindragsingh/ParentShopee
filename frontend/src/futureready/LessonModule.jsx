import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'

const audioKey = userId => `frAudioEnabled_${userId}`

// Text-to-speech relies entirely on the device/browser's built-in
// speechSynthesis -- no native plugin, no backend involvement, works the
// same in a browser tab and inside the Capacitor WebView. Voice quality
// varies by device since it uses whatever TTS engine is installed there.
function speakText(text, enabled) {
  if (!enabled || typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.95
  window.speechSynthesis.speak(utterance)
}

// Self-paced, untimed: a short deck of slides to read through, then a quiz
// to check what stuck. Unlike the Games section this isn't a race against a
// clock -- the goal is understanding, not speed. Kids can retake the quiz as
// many times as they like, but points are only paid out the first time they
// pass (server-enforced too, in case of a stale/replayed request). Generic
// across every Future-Ready topic -- which lesson to show comes entirely
// from fetching `module.id`'s content from the backend, so a new topic or an
// edited lesson needs no app changes at all, just a backend redeploy (see
// backend/routers/future_ready.py and DBLearningModule.content).
export default function LessonModule({ module, onExit, onCompleted, previewMode = false, subtitle }) {
  const { user } = useAuth()
  const [content, setContent] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [phase, setPhase] = useState('slides') // 'slides' | 'quiz' | 'result'
  const [slideIndex, setSlideIndex] = useState(0)
  const [quizIndex, setQuizIndex] = useState(0)
  const [answers, setAnswers] = useState([]) // index chosen per question
  const [selected, setSelected] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null) // { passed, alreadyCompleted, pointsAwarded }
  const [error, setError] = useState('')
  const [audioEnabled, setAudioEnabled] = useState(() => {
    if (!user?.id) return true
    return localStorage.getItem(audioKey(user.id)) !== '0'  // on by default until explicitly turned off
  })

  function toggleAudio() {
    const next = !audioEnabled
    setAudioEnabled(next)
    if (user?.id) localStorage.setItem(audioKey(user.id), next ? '1' : '0')
    if (!next) window.speechSynthesis?.cancel()
  }

  useEffect(() => {
    let cancelled = false
    api.getLearningContent(module.id)
      .then(data => { if (!cancelled) setContent(data) })
      .catch(err => { if (!cancelled) setLoadError(err.message || "This lesson isn't ready yet.") })
    return () => { cancelled = true }
  }, [module.id])

  // Reads the current slide out loud as soon as it's shown, so a kid can
  // listen instead of having to read it themselves -- re-fires whenever the
  // slide changes, and stops if they navigate away or turn narration off.
  useEffect(() => {
    if (phase !== 'slides' || !content) return
    const slide = content.slides[slideIndex]
    speakText(`${slide.title}. ${slide.text}`, audioEnabled)
    return () => window.speechSynthesis?.cancel()
  }, [phase, slideIndex, content, audioEnabled])

  useEffect(() => {
    if (phase !== 'quiz' || !content || selected !== null) return
    speakText(content.quiz[quizIndex].question, audioEnabled)
    return () => window.speechSynthesis?.cancel()
  }, [phase, quizIndex, content, audioEnabled, selected])

  useEffect(() => {
    return () => window.speechSynthesis?.cancel()
  }, [])

  if (loadError) {
    return <div className="error-msg">{loadError}</div>
  }
  if (!content) {
    return <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>Loading lesson…</div>
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
    // Guardians previewing a lesson aren't a kid, so the points endpoint (kid-only)
    // isn't reachable for them -- just show the score, no points, no server call.
    if (previewMode) {
      setResult({ passed: finalScore / content.quiz.length >= 0.6, alreadyCompleted: false, pointsAwarded: 0, preview: true })
      setPhase('result')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await api.completeLearningModule(module.id, finalScore, content.quiz.length)
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
          <button
            type="button"
            onClick={toggleAudio}
            title={audioEnabled ? 'Turn off read-aloud' : 'Turn on read-aloud'}
            style={{
              background: 'none', border: '1px solid #e2e8f0', borderRadius: 999, cursor: 'pointer',
              fontSize: '1rem', padding: '4px 9px', lineHeight: 1, flexShrink: 0,
            }}
          >
            {audioEnabled ? '🔊' : '🔇'}
          </button>
        </div>
      </div>

      {phase !== 'result' && (
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <span style={{
            fontSize: '0.78rem', fontWeight: 700, color: '#0f766e', background: '#f0fdfa',
            border: '1px solid #99f6e4', borderRadius: 999, padding: '4px 12px',
          }}>
            ⭐ Earn {module.points} pts for finishing this
          </span>
        </div>
      )}

      {phase === 'slides' && (
        <div>
          <div style={{
            background: '#fff', border: '1px solid #f1f5f9', borderRadius: 16, padding: '32px 24px',
            textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', marginBottom: 18, minHeight: 220,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}>
            <div style={{ fontSize: '2.6rem', marginBottom: 12 }}>{content.slides[slideIndex].emoji}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: 10 }}>
              {content.slides[slideIndex].title}
            </div>
            <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.7, margin: 0 }}>
              {content.slides[slideIndex].text}
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 18 }}>
            {content.slides.map((_, i) => (
              <span key={i} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: i === slideIndex ? '#0d9488' : '#e2e8f0',
              }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <button
              className="btn btn-outline"
              onClick={() => setSlideIndex(i => Math.max(0, i - 1))}
              disabled={slideIndex === 0}
            >
              ← Back
            </button>
            {slideIndex + 1 < content.slides.length ? (
              <button className="btn btn-green" onClick={() => setSlideIndex(i => i + 1)}>Next →</button>
            ) : (
              <button className="btn btn-green" onClick={() => setPhase('quiz')}>Start the quiz 📝</button>
            )}
          </div>
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
          <div style={{ textAlign: 'center', padding: '34px 20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 16 }}>
            <div style={{ fontSize: '2.6rem', marginBottom: 8 }}>🎉</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#166534' }}>
              You got {score} of {content.quiz.length} right!
            </div>
            <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: 8 }}>
              {result.preview
                ? `This is a preview — kids earn ${module.points} points for passing this quiz.`
                : result.alreadyCompleted
                ? "You've already earned points for this lesson — great review!"
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
              Review the lesson and try the quiz again to earn your points.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 18 }}>
              <button className="btn btn-outline" onClick={() => { setSlideIndex(0); setPhase('slides') }}>Review lesson</button>
              <button className="btn btn-green" onClick={retakeQuiz}>Try quiz again</button>
            </div>
          </div>
        )
      )}
    </div>
  )
}
