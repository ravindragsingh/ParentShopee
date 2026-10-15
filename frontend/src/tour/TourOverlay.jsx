import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTour } from './TourContext.jsx'
import { setTourEnabled } from './tourStorage.js'

const PAD = 8

function useTargetRect(selector) {
  const [rect, setRect] = useState(null)

  useEffect(() => {
    if (!selector) { setRect(null); return }
    function measure() {
      const el = document.querySelector(selector)
      if (!el) { setRect(null); return }
      // The target may be below the fold on a long page (e.g. the Admin
      // Panel) -- bring it into view first, or the spotlight would land on
      // an element the user can't actually see without scrolling themselves.
      const r = el.getBoundingClientRect()
      const tooltipSpace = 240 // roughly the bottom tooltip card's height
      const visible = r.top >= 0 && r.bottom <= window.innerHeight - tooltipSpace
      if (!visible) {
        el.scrollIntoView({ block: 'center' })
      }
      setRect(el.getBoundingClientRect())
    }
    // A short delay lets the destination tab's content mount after a
    // step-triggered navigation, before we try to measure it.
    const t = setTimeout(measure, 150)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [selector])

  return rect
}

function band(style) {
  return { position: 'fixed', background: 'rgba(15,23,42,0.6)', ...style }
}

export default function TourOverlay({ userId }) {
  const { activeTourId, currentStep, stepIndex, totalSteps, next, prev, skip } = useTour()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (currentStep?.path) {
      const current = location.pathname + location.search
      if (current !== currentStep.path) navigate(currentStep.path)
    }
    // Some targets only exist once a toggle/form is opened (e.g. the
    // recurring-chore checkbox lives inside the "+ Add Chore" form) --
    // autoClick opens it for them. Guarded on the target not already being
    // in the DOM, so revisiting the step (Back then Next again) doesn't
    // blindly re-click a toggle and close what it just opened.
    if (currentStep?.autoClick) {
      const t = setTimeout(() => {
        const alreadyThere = currentStep.target && document.querySelector(currentStep.target)
        if (!alreadyThere) document.querySelector(currentStep.autoClick)?.click()
      }, 80)
      return () => clearTimeout(t)
    }
  }, [currentStep, navigate, location.pathname, location.search])

  const rect = useTargetRect(currentStep?.target)

  if (!activeTourId || !currentStep) return null

  const hasTarget = !!currentStep.target
  const isLast = stepIndex + 1 >= totalSteps
  // A target in the lower half of the screen (e.g. the bottom row of home
  // tiles) would otherwise sit right behind a bottom-anchored tooltip, with
  // its label cut off -- flip the tooltip to the top of the screen instead.
  // Short pages (like Home) have little room to scroll a target further up,
  // so repositioning the tooltip, not the page, is what actually fixes it.
  const tooltipAtTop = hasTarget && rect && rect.top > window.innerHeight / 2

  function turnOff() {
    setTourEnabled(userId, false)
    skip()
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000 }}>
      {hasTarget && rect ? (
        <>
          <div style={band({ top: 0, left: 0, width: '100%', height: Math.max(0, rect.top - PAD) })} />
          <div style={band({ top: rect.bottom + PAD, left: 0, width: '100%', bottom: 0 })} />
          <div style={band({ top: rect.top - PAD, left: 0, width: Math.max(0, rect.left - PAD), height: rect.height + PAD * 2 })} />
          <div style={band({ top: rect.top - PAD, left: rect.right + PAD, right: 0, height: rect.height + PAD * 2 })} />
          <div style={{
            position: 'fixed', top: rect.top - PAD, left: rect.left - PAD,
            width: rect.width + PAD * 2, height: rect.height + PAD * 2,
            borderRadius: 14, boxShadow: '0 0 0 3px #ea580c, 0 0 24px rgba(234,88,12,0.5)',
            pointerEvents: 'none',
          }} />
        </>
      ) : (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)' }} />
      )}

      <div
        style={hasTarget
          ? (tooltipAtTop
              ? { position: 'fixed', left: 16, right: 16, top: 'max(16px, var(--sa-inset-top, 16px))' }
              : { position: 'fixed', left: 16, right: 16, bottom: 'max(16px, var(--sa-inset-bottom, 16px))' })
          : { position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }
        }
      >
        <div style={{
          background: '#fff', borderRadius: 16, padding: '18px 20px', maxWidth: 400,
          width: hasTarget ? '100%' : undefined, margin: hasTarget ? undefined : '0 auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ea580c', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Step {stepIndex + 1} of {totalSteps}
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1e293b', marginBottom: 6 }}>{currentStep.title}</div>
          <div style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.5, marginBottom: 16 }}>{currentStep.text}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <button onClick={turnOff} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.78rem', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
              Turn off guided tour
            </button>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {stepIndex > 0 && (
                <button onClick={prev} style={{ background: '#fff', color: '#334155', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                  Back
                </button>
              )}
              <button onClick={next} style={{ background: '#ea580c', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                {isLast ? 'Done' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
