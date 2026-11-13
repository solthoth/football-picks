import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithTheme } from '../testUtils/renderWithTheme'
import { textContrast } from '../testUtils/contrast'
import { WinnerBadge } from './WinnerBadge'

describe('WinnerBadge', () => {
  it.each(['light', 'dark'] as const)('has WCAG AA text contrast in %s mode', (mode) => {
    renderWithTheme(<WinnerBadge />, mode)

    const badge = screen.getByText('Week Winner').closest('.MuiChip-root') as HTMLElement
    expect(textContrast(badge, mode === 'light' ? '#ffffff' : '#121212')).toBeGreaterThanOrEqual(4.5)
  })
})
