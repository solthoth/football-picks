/** Smallest height an element is guaranteed (px): the larger of its min-height and an explicit height. */
export function guaranteedHeightPx(element: Element): number {
  const style = getComputedStyle(element)
  const toPx = (value: string) => (value.endsWith('rem') ? parseFloat(value) * 16 : parseFloat(value))
  return Math.max(toPx(style.minHeight) || 0, toPx(style.height) || 0)
}

/** WCAG 2.5.5 / Apple HIG touch target: at least 44 CSS px. */
export const MIN_TOUCH_TARGET_PX = 44
