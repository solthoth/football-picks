import { createTheme, darken } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'

export type ThemeMode = 'light' | 'dark'
export type AccentColor = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'

/** Minimum height of a tappable control, in px (WCAG 2.5.5 / Apple HIG). */
const TOUCH_TARGET_PX = 44

export function createAppTheme(mode: ThemeMode): Theme {
  return createTheme({
    components: {
      // MUI's default buttons are 30-42px tall, which is hard to hit on a phone.
      MuiButton: { styleOverrides: { root: { minHeight: TOUCH_TARGET_PX } } },
      MuiToggleButton: { styleOverrides: { root: { minHeight: TOUCH_TARGET_PX } } },
    },
    palette: {
      mode,
      // MUI's default threshold of 3 puts white text on the orange `warning` (3.1:1) and on dark-mode `error` (3.7:1).
      // At 4.5 every filled chip, avatar and button picks dark text where white would fail WCAG AA.
      contrastThreshold: 4.5,
    },
  })
}

/**
 * Colour for small accent-coloured *text* (as opposed to filled surfaces), safe on paper and on the
 * translucent tints of the same accent. `palette[x].main` is too light for that in light mode
 * (e.g. 4.0-4.5:1 on a primary tint), and even `warning.dark` is only 3.8:1 on white, so warning goes a
 * step further. In dark mode `main` is already the light variant.
 */
export function accentTextColor(theme: Theme, color: AccentColor): string {
  const palette = theme.palette[color]
  if (theme.palette.mode === 'dark') return palette.main
  return color === 'warning' ? darken(palette.dark, 0.3) : palette.dark
}
