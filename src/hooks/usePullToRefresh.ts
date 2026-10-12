import { useEffect, useRef, useState } from 'react'
import { isTrustedEvent } from './isTrustedEvent'

export type PullPhase = 'idle' | 'pulling' | 'armed' | 'refreshing'

/** Finger travel before the gesture counts as a pull (also the axis-lock slop). */
export const PULL_SLOP_PX = 10
/** Downward travel at which the pull is "armed" and the hold timer starts. */
export const PULL_THRESHOLD_PX = 80
/** Longest distance the indicator itself travels, however far the finger goes. */
export const PULL_MAX_OFFSET_PX = 72
/** The indicator follows the finger at this fraction, for a rubber-band feel. */
const PULL_RESISTANCE = 0.5
/** How long the finger must stay past the threshold before the page reloads. */
export const HOLD_MS = 700
/** Minimum gap between two gesture-triggered reloads. */
export const COOLDOWN_MS = 5_000

const COOLDOWN_KEY = 'pull-refresh:last-reload'
/** Elements where a downward drag means something else (text selection, sliders, dialogs). */
const IGNORED_TARGETS = 'input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="dialog"], [data-no-pull-refresh]'

function reloadPage() {
  window.location.reload()
}

function pageScrollTop() {
  return (document.scrollingElement ?? document.documentElement).scrollTop
}

/** True when the touch started inside something that is itself scrolled down. */
function insideScrolledContainer(target: EventTarget | null) {
  for (let el = target instanceof Element ? target : null; el && el !== document.documentElement; el = el.parentElement) {
    if (el.scrollTop > 0) return true
  }
  return false
}

function canStartFrom(target: EventTarget | null) {
  if (pageScrollTop() > 0 || document.visibilityState === 'hidden') return false
  if (target instanceof Element && target.closest(IGNORED_TARGETS)) return false
  return !insideScrolledContainer(target)
}

// sessionStorage survives the reload, so a cooldown stamped before reloading
// is still enforced afterwards. If storage is blocked we fail open: a reload
// still needs a genuine, trusted, held gesture, so there is no loop to guard.
function cooldownElapsed(now: number) {
  try {
    const last = Number(sessionStorage.getItem(COOLDOWN_KEY))
    return !(last > 0 && now >= last && now - last < COOLDOWN_MS)
  } catch {
    return true
  }
}

function stampCooldown(now: number) {
  try {
    sessionStorage.setItem(COOLDOWN_KEY, String(now))
  } catch {
    // Storage unavailable (private mode, blocked): nothing to stamp.
  }
}

interface Options {
  /** Called once the hold completes. Defaults to a same-origin `location.reload()`. */
  onRefresh?: () => void
  enabled?: boolean
}

/**
 * Pull-to-refresh by swipe-and-hold: drag down from the very top of the page
 * past {@link PULL_THRESHOLD_PX} and keep the finger there for
 * {@link HOLD_MS} to reload.
 *
 * Cheap by construction: four passive document-level listeners, registered
 * once. The gesture lives in effect-local variables and the indicator is moved
 * by writing a CSS variable straight to the DOM, so React only re-renders when
 * `phase` changes (at most four times per gesture), never per touchmove.
 *
 * Safe by construction: it only ever calls the injected `onRefresh` (default
 * `location.reload()`, no URL is read or written); it ignores non-trusted
 * events, multi-touch, hidden tabs, form fields and dialogs, and scrolled
 * pages; the hold is re-validated when it fires; and reloads are rate-limited.
 */
export function usePullToRefresh({ onRefresh = reloadPage, enabled = true }: Options = {}) {
  const [phase, setPhase] = useState<PullPhase>('idle')
  const indicatorRef = useRef<HTMLDivElement>(null)
  const onRefreshRef = useRef(onRefresh)

  useEffect(() => {
    onRefreshRef.current = onRefresh
  })

  useEffect(() => {
    if (!enabled) return

    let current: PullPhase = 'idle'
    let touchId: number | null = null
    let startX = 0
    let startY = 0
    let holdTimer: ReturnType<typeof setTimeout> | undefined

    const go = (next: PullPhase) => {
      if (current === next) return
      current = next
      setPhase(next)
    }
    const setOffset = (px: number) => indicatorRef.current?.style.setProperty('--pull-offset', `${px}px`)
    const stopHold = () => {
      clearTimeout(holdTimer)
      holdTimer = undefined
    }
    const reset = () => {
      stopHold()
      touchId = null
      setOffset(0)
      go('idle')
    }

    const fire = () => {
      holdTimer = undefined
      const now = Date.now()
      if (touchId === null || !canStartFrom(null) || !cooldownElapsed(now)) {
        reset()
        return
      }
      stampCooldown(now)
      go('refreshing')
      onRefreshRef.current()
    }

    const onTouchStart = (e: TouchEvent) => {
      reset()
      if (e.touches.length !== 1 || !isTrustedEvent(e) || !canStartFrom(e.target)) return
      const touch = e.touches[0]
      touchId = touch.identifier
      startX = touch.clientX
      startY = touch.clientY
    }

    const onTouchMove = (e: TouchEvent) => {
      if (touchId === null || current === 'refreshing') return
      if (e.touches.length !== 1 || e.touches[0].identifier !== touchId) return reset()
      const dx = e.touches[0].clientX - startX
      const dy = e.touches[0].clientY - startY

      // Upward, mostly-horizontal, or the page started scrolling: not our gesture.
      if (dy < 0 || (Math.abs(dx) > PULL_SLOP_PX && Math.abs(dx) > dy) || pageScrollTop() > 0) return reset()
      if (dy < PULL_SLOP_PX) return

      setOffset(Math.min(dy * PULL_RESISTANCE, PULL_MAX_OFFSET_PX))
      if (dy >= PULL_THRESHOLD_PX) {
        if (current !== 'armed') {
          go('armed')
          holdTimer = setTimeout(fire, HOLD_MS)
        }
      } else if (current === 'armed') {
        // Slid back above the threshold: disarm, but keep the gesture alive.
        stopHold()
        go('pulling')
      } else {
        go('pulling')
      }
    }

    const opts = { passive: true } as const
    document.addEventListener('touchstart', onTouchStart, opts)
    document.addEventListener('touchmove', onTouchMove, opts)
    document.addEventListener('touchend', reset, opts)
    document.addEventListener('touchcancel', reset, opts)
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', reset)
      document.removeEventListener('touchcancel', reset)
      stopHold()
    }
  }, [enabled])

  return { phase, indicatorRef }
}
