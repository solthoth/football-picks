import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// jsdom has no real <canvas> 2D rendering context, which crashes
// canvas-confetti's animation loop. Stub it globally; tests that care about
// confetti actually firing (WinnerCelebration.test.tsx) override this with
// their own vi.mock to get an inspectable spy.
vi.mock('canvas-confetti', () => ({ default: vi.fn() }))

// jsdom doesn't implement matchMedia; MUI's useMediaQuery (breakpoints,
// dark-mode detection) needs it to exist. Defaults to "no match" (desktop),
// so tests exercising the mobile layout override it per-test.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
