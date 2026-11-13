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
