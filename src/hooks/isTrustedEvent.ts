/**
 * True only for events the browser generated from real user input. Script-
 * dispatched events (`dispatchEvent(new TouchEvent(...))`) report
 * `isTrusted === false`, so gating on this keeps injected code, extensions
 * and automation from triggering a page reload. Kept in its own module so
 * tests can stub it (jsdom's `isTrusted` is unforgeable).
 */
export function isTrustedEvent(event: Event): boolean {
  return event.isTrusted
}
