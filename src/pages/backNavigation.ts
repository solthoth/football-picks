import type { NavigateFunction } from 'react-router-dom'

/** Router state set by a screen that links onward, so the next screen can offer a "back to where you were" button. */
export interface BackState {
  backLabel: string
}

export function readBackLabel(state: unknown): string | undefined {
  if (typeof state === 'object' && state !== null && 'backLabel' in state && typeof state.backLabel === 'string') {
    return state.backLabel
  }
  return undefined
}

/** Pops history when the user arrived from another screen in the app; otherwise goes to the fallback route (shared link, refresh). */
export function goBack(navigate: NavigateFunction, backLabel: string | undefined, fallback: string) {
  if (backLabel) navigate(-1)
  else navigate(fallback)
}
