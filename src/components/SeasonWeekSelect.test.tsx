import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Pool } from '../data/types'
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
