import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Pool } from '../data/types'
import { SeasonWeekSelect } from './SeasonWeekSelect'

const pools: Pool[] = [
  { season: 2026, week: 1, games: [], participants: [], results: {} },
  { season: 2026, week: 2, games: [], participants: [], results: {} },
  { season: 2025, week: 1, games: [], participants: [], results: {} },
]

describe('SeasonWeekSelect', () => {
  it('shows a message when there is no pool data', () => {
    render(<SeasonWeekSelect pools={[]} onSelect={vi.fn()} />)
    expect(screen.getByText(/no pool data is available/i)).toBeInTheDocument()
  })

  it('defaults to the most recent season and its first week', () => {
    render(<SeasonWeekSelect pools={pools} onSelect={vi.fn()} />)
    expect(screen.getByLabelText(/season/i)).toHaveValue('2026')
    expect(screen.getByLabelText(/week/i)).toHaveValue('1')
  })

  it('limits week options to the selected season', async () => {
    const user = userEvent.setup()
    render(<SeasonWeekSelect pools={pools} onSelect={vi.fn()} />)

    await user.selectOptions(screen.getByLabelText(/season/i), '2025')

    const weekSelect = screen.getByLabelText(/week/i) as HTMLSelectElement
    const options = Array.from(weekSelect.options).map((o) => o.value)
    expect(options).toEqual(['1'])
  })

  it('calls onSelect with the chosen season and week', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<SeasonWeekSelect pools={pools} onSelect={onSelect} />)

    await user.selectOptions(screen.getByLabelText(/week/i), '2')
    await user.click(screen.getByRole('button', { name: /view week/i }))

    expect(onSelect).toHaveBeenCalledWith(2026, 2)
  })
})
