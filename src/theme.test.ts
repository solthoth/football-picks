import { alpha } from '@mui/material/styles'
import { describe, expect, it } from 'vitest'
import { compositeOver, contrastRatio, parseColor } from './testUtils/contrast'
import { accentTextColor, createAppTheme } from './theme'
import type { AccentColor, ThemeMode } from './theme'

const MODES: ThemeMode[] = ['light', 'dark']
const FILLED: AccentColor[] = ['primary', 'secondary', 'error', 'warning', 'info', 'success']
const TEXT_ACCENTS = ['primary', 'secondary', 'info', 'error', 'warning', 'success'] as const satisfies readonly AccentColor[]

describe.each(MODES)('app theme (%s)', (mode) => {
  const theme = createAppTheme(mode)

  it.each(FILLED)('keeps text on filled %s surfaces (chips, avatars, buttons) at WCAG AA', (color) => {
    const { main, contrastText } = theme.palette[color]
    expect(contrastRatio(contrastText, main), `${color}: ${contrastText} on ${main}`).toBeGreaterThanOrEqual(4.5)
  })

  describe('accentTextColor', () => {
    const paper = parseColor(theme.palette.background.paper)
    const tint = (color: AccentColor, amount: number) => compositeOver(parseColor(alpha(theme.palette[color].main, amount)), paper)

    // The surfaces each accent's text really sits on in the app:
    // - summary tiles tint their own colour at 7% (ParticipantDetail)
    // - the selected week tile tints primary at 12% (SeasonWeekSelect)
    // - the dashboard summary tiles tint primary / secondary / info at 7% from md up (PickSummaryStrip)
    // - live games tint warning at 12% (GamePickCard, also holds the primary "See who picked" hint) and 18% (mobile score row)
    const usedOn: Record<(typeof TEXT_ACCENTS)[number], Record<string, () => ReturnType<typeof tint>>> = {
      primary: {
        'plain paper': () => paper,
        'its own 7% tint (tiebreaker tile)': () => tint('primary', 0.07),
        'its own 12% tint (selected week tile)': () => tint('primary', 0.12),
        'the live-game card (warning 12% tint)': () => tint('warning', 0.12),
      },
      secondary: { 'plain paper': () => paper, 'its own 7% tint (most popular tile)': () => tint('secondary', 0.07) },
      info: { 'plain paper': () => paper, 'its own 7% tint (most divided tile)': () => tint('info', 0.07) },
      error: { 'plain paper': () => paper, 'its own 7% tint (incorrect tile)': () => tint('error', 0.07) },
      success: { 'plain paper': () => paper, 'its own 7% tint (correct tile)': () => tint('success', 0.07) },
      warning: {
        'plain paper': () => paper,
        'the live-game card (12% tint)': () => tint('warning', 0.12),
        'the live score row (18% tint)': () => tint('warning', 0.18),
      },
    }

    it.each(TEXT_ACCENTS)('reads at AA for %s on every surface the app puts it on', (color) => {
      const text = accentTextColor(theme, color)
      for (const [name, background] of Object.entries(usedOn[color])) {
        expect(contrastRatio(text, background()), `${color} text (${text}) on ${name}`).toBeGreaterThanOrEqual(4.5)
      }
    })
  })
})
