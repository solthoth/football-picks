import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Pool } from '../data/types'
import { fontSizePx, textContrast } from '../testUtils/contrast'
import { guaranteedHeightPx, MIN_TOUCH_TARGET_PX } from '../testUtils/layout'
import { mockMatchMediaMatches } from '../testUtils/mockMatchMedia'
import { renderWithTheme } from '../testUtils/renderWithTheme'
import { SeasonWeekSelect } from './SeasonWeekSelect'

function pool(season: number, week: number): Pool {
  return { season, week, games: [], participants: [], results: {} }
}

const multiSeasonPools: Pool[] = [
  pool(2026, 1),
  pool(2026, 2),
  pool(2026, 3),
  pool(2025, 1),
  pool(2025, 2),
]

const singleSeasonPools: Pool[] = [pool(2026, 1), pool(2026, 2), pool(2026, 3)]

describe('SeasonWeekSelect', () => {
  it('shows a message when there is no pool data', () => {
    render(<SeasonWeekSelect pools={[]} onSelect={vi.fn()} />)
    expect(screen.getByText(/no pool data is available/i)).toBeInTheDocument()
  })

  it('defaults to the latest week of the most recent season', () => {
    render(<SeasonWeekSelect pools={multiSeasonPools} onSelect={vi.fn()} />)

    expect(screen.getByRole('button', { name: '2026' })).toBeInTheDocument()
    const selected = screen.getByRole('option', { selected: true })
    expect(selected).toHaveAccessibleName('Week 3')
  })

  it('only shows weeks that have a pool for the selected season', () => {
    render(<SeasonWeekSelect pools={multiSeasonPools} onSelect={vi.fn()} />)

    const options = screen.getAllByRole('option').map((o) => o.getAttribute('aria-label'))
    expect(options).toEqual(['Week 1', 'Week 2', 'Week 3'])
  })

  it('does not show a season control when there is only one season', () => {
    render(<SeasonWeekSelect pools={singleSeasonPools} onSelect={vi.fn()} />)
    expect(screen.queryByRole('group')).not.toBeInTheDocument()
  })

  it('changing season updates the weeks and re-defaults to that season’s latest week without navigating', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<SeasonWeekSelect pools={multiSeasonPools} onSelect={onSelect} />)

    await user.click(screen.getByRole('button', { name: '2025' }))

    const options = screen.getAllByRole('option').map((o) => o.getAttribute('aria-label'))
    expect(options).toEqual(['Week 1', 'Week 2'])
    expect(screen.getByRole('option', { selected: true })).toHaveAccessibleName('Week 2')
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('calls onSelect immediately when a week is clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<SeasonWeekSelect pools={multiSeasonPools} onSelect={onSelect} />)

    await user.click(screen.getByRole('option', { name: 'Week 1' }))

    expect(onSelect).toHaveBeenCalledWith(2026, 1)
  })

  it('supports arrow-key navigation between weeks and Enter to select', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<SeasonWeekSelect pools={multiSeasonPools} onSelect={onSelect} />)

    const week3 = screen.getByRole('option', { name: 'Week 3' })
    week3.focus()
    expect(week3).toHaveFocus()

    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('option', { name: 'Week 2' })).toHaveFocus()
    expect(onSelect).not.toHaveBeenCalled()

    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledWith(2026, 2)
    expect(screen.getByRole('option', { name: 'Week 2' })).toHaveAttribute('aria-selected', 'true')
  })

  it('supports Space to select the focused week', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<SeasonWeekSelect pools={multiSeasonPools} onSelect={onSelect} />)

    const week3 = screen.getByRole('option', { name: 'Week 3' })
    week3.focus()
    await user.keyboard(' ')

    expect(onSelect).toHaveBeenCalledWith(2026, 3)
  })
})


describe('SeasonWeekSelect week tile text', () => {
  it.each([
    ['light', '#ffffff'],
    ['dark', '#121212'],
  ] as const)('keeps the "Week" caption readable (AA) and at least 12px on every tile in %s mode', (mode, surface) => {
    renderWithTheme(<SeasonWeekSelect pools={singleSeasonPools} onSelect={vi.fn()} />, mode)

    for (const week of [1, 2, 3]) {
      const caption = within(screen.getByRole('option', { name: `Week ${week}` })).getByText('Week')
      expect(textContrast(caption, surface), `Week ${week} caption`).toBeGreaterThanOrEqual(4.5)
      expect(fontSizePx(caption), `Week ${week} caption size`).toBeGreaterThanOrEqual(12)
    }
  })
})

describe('SeasonWeekSelect touch targets', () => {
  it('makes the season chips comfortable touch targets', () => {
    renderWithTheme(<SeasonWeekSelect pools={multiSeasonPools} onSelect={vi.fn()} />)

    for (const season of ['2026', '2025']) {
      expect(guaranteedHeightPx(screen.getByRole('button', { name: season }))).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX)
    }
  })
})

describe('SeasonWeekSelect week layout', () => {
  const tenWeeks: Pool[] = Array.from({ length: 10 }, (_, i) => pool(2026, i + 1))

  afterEach(() => {
    mockMatchMediaMatches(false)
  })

  it('on larger screens wraps every week into a grid, so earlier weeks are never hidden off to the side', () => {
    mockMatchMediaMatches(false)
    renderWithTheme(<SeasonWeekSelect pools={tenWeeks} onSelect={vi.fn()} />)

    const list = screen.getByRole('listbox', { name: 'Week' })
    expect(list).toHaveStyle({ flexWrap: 'wrap', justifyContent: 'center', overflowX: 'visible' })
    expect(screen.getAllByRole('option')).toHaveLength(10)
  })

  it('on phones keeps the compact swipeable rail', () => {
    mockMatchMediaMatches(true)
    renderWithTheme(<SeasonWeekSelect pools={tenWeeks} onSelect={vi.fn()} />)

    expect(screen.getByRole('listbox', { name: 'Week' })).toHaveStyle({ flexWrap: 'nowrap', overflowX: 'auto' })
  })

  it('still moves focus with the arrow keys across a wrapped grid', async () => {
    mockMatchMediaMatches(false)
    const user = userEvent.setup()
    renderWithTheme(<SeasonWeekSelect pools={tenWeeks} onSelect={vi.fn()} />)

    screen.getByRole('option', { name: 'Week 10' }).focus()
    await user.keyboard('{ArrowLeft}{ArrowLeft}')

    expect(screen.getByRole('option', { name: 'Week 8' })).toHaveFocus()
  })
})

describe('SeasonWeekSelect initial selection', () => {
  it('preselects the given week instead of the latest', () => {
    render(<SeasonWeekSelect pools={singleSeasonPools} onSelect={vi.fn()} initial={{ season: 2026, week: 2 }} />)

    expect(screen.getByRole('option', { name: 'Week 2' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('option', { name: 'Week 3' })).toHaveAttribute('aria-selected', 'false')
  })

  it('preselects the season and week together when there are several seasons', () => {
    render(<SeasonWeekSelect pools={multiSeasonPools} onSelect={vi.fn()} initial={{ season: 2025, week: 1 }} />)

    expect(screen.getByRole('button', { name: '2025' })).toHaveClass('MuiChip-filled')
    expect(screen.getByRole('option', { name: 'Week 1' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByRole('option', { name: 'Week 3' })).not.toBeInTheDocument()
  })

  it.each([
    ['a week that is not in the data', { season: 2026, week: 99 }],
    ['a season that is not in the data', { season: 1999, week: 1 }],
    ['nothing', undefined],
  ])('falls back to the latest week for %s', (_name, initial) => {
    render(<SeasonWeekSelect pools={singleSeasonPools} onSelect={vi.fn()} initial={initial} />)

    expect(screen.getByRole('option', { name: 'Week 3' })).toHaveAttribute('aria-selected', 'true')
  })
})
