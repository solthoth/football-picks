import { expect } from 'vitest'

/**
 * Asserts that an element's text is allowed to wrap rather than being cut off with an ellipsis. jsdom cannot
 * lay text out, so this pins the styles that would truncate it; the real-browser check is that no visible
 * text has scrollWidth greater than clientWidth.
 */
export function expectNotTruncated(element: Element) {
  const style = getComputedStyle(element)
  expect(style.whiteSpace, `${element.textContent} should be able to wrap`).not.toBe('nowrap')
  expect(style.textOverflow, `${element.textContent} should not be ellipsised`).not.toBe('ellipsis')
}
