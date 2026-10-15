import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { TOURS } from './tours.js'
import { markTourCompleted } from './tourStorage.js'

const TourCtx = createContext(null)

export function TourProvider({ userId, children }) {
  const [activeTourId, setActiveTourId] = useState(null)
  const [stepIndex, setStepIndex] = useState(0)

  const startTour = useCallback(tourId => {
    if (!TOURS[tourId]) return
    setActiveTourId(tourId)
    setStepIndex(0)
  }, [])

  const stopTour = useCallback(() => {
    if (activeTourId) markTourCompleted(userId, activeTourId)
    setActiveTourId(null)
    setStepIndex(0)
  }, [activeTourId, userId])

  const tour = activeTourId ? TOURS[activeTourId] : null
  const totalSteps = tour?.steps.length ?? 0

  const next = useCallback(() => {
    setStepIndex(i => {
      if (i + 1 >= totalSteps) {
        // Last step -- end of tour, not an early skip, but the same
        // "don't auto-restart" bookkeeping applies either way.
        if (activeTourId) markTourCompleted(userId, activeTourId)
        setActiveTourId(null)
        return 0
      }
      return i + 1
    })
  }, [totalSteps, activeTourId, userId])

  const prev = useCallback(() => {
    setStepIndex(i => Math.max(0, i - 1))
  }, [])

  const value = useMemo(() => ({
    activeTourId,
    tour,
    stepIndex,
    totalSteps,
    currentStep: tour?.steps[stepIndex] ?? null,
    startTour,
    next,
    prev,
    skip: stopTour,
  }), [activeTourId, tour, stepIndex, totalSteps, startTour, next, prev, stopTour])

  return <TourCtx.Provider value={value}>{children}</TourCtx.Provider>
}

export function useTour() {
  const ctx = useContext(TourCtx)
  if (!ctx) throw new Error('useTour must be used within a TourProvider')
  return ctx
}
