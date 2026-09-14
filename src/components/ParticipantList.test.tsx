import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Pool } from '../data/types'
import { ParticipantList } from './ParticipantList'

const pool: Pool = {
  season: 2026,
  week: 1,
  games: [{ id: 'game_01', away: 'Patriots', home: 'Seahawks' }],
  participants: [
    { name: 'Steve', picks: { game_01: 'Seahawks' }, tieBreakerTotalScore: 44 },
    { name: 'Greg', picks: { game_01: 'Patriots' }, tieBreakerTotalScore: 40 },
  ],
  results: {
    game_01: { kickoffTime: null, status: 'final', awayScore: 10, homeScore: 13, winner: 'Seahawks' },
  },
}

describe('ParticipantList', () => {
  it('shows the season and week', () => {
    render(<ParticipantList pool={pool} onSelect={vi.fn()} onBack={vi.fn()} />)
    expect(screen.getByRole('heading', { name: /season 2026.*week 1/i })).toBeInTheDocument()
  })

  it('lists participants ranked by correct picks', () => {
    render(<ParticipantList pool={pool} onSelect={vi.fn()} onBack={vi.fn()} />)
    const rows = screen.getAllByRole('row').slice(1) // skip header row
    expect(rows[0]).toHaveTextContent('Steve')
    expect(rows[1]).toHaveTextContent('Greg')
  })

  it('calls onSelect with the clicked participant', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<ParticipantList pool={pool} onSelect={onSelect} onBack={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Greg' }))

    expect(onSelect).toHaveBeenCalledWith('Greg')
  })

  it('calls onBack when the back button is clicked', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    render(<ParticipantList pool={pool} onSelect={vi.fn()} onBack={onBack} />)

    await user.click(screen.getByRole('button', { name: /change season\/week/i }))

    expect(onBack).toHaveBeenCalled()
  })
})
