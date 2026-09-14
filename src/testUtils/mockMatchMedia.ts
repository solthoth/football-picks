import { vi } from 'vitest'

/** Makes MUI's useMediaQuery report a match for every query (e.g. to force the mobile layout branch in a test). */
export function mockMatchMediaMatches(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}
