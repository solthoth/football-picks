import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Pool } from '../data/types'
import { mockMatchMediaMatches } from '../testUtils/mockMatchMedia'
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

const poolWithWinner: Pool = {
  season: 2026,
  week: 1,
  games: [
    { id: 'game_01', away: 'Patriots', home: 'Seahawks' },
    { id: 'game_02', away: '49ers', home: 'Rams' },
  ],
  participants: [
    { name: 'Steve', picks: { game_01: 'Seahawks', game_02: 'Rams' }, tieBreakerTotalScore: 44 },
    { name: 'Greg', picks: { game_01: 'Patriots', game_02: 'Rams' }, tieBreakerTotalScore: 40 },
  ],
  results: {
    game_01: { kickoffTime: '2026-09-13T17:00:00Z', status: 'final', awayScore: 10, homeScore: 13, winner: 'Seahawks' },
    game_02: { kickoffTime: '2026-09-14T20:00:00Z', status: 'final', awayScore: 20, homeScore: 10, winner: '49ers' },
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

  it('calls onSelect when the row is clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<ParticipantList pool={pool} onSelect={onSelect} onBack={vi.fn()} />)

    await user.click(screen.getByText('Greg').closest('tr') as HTMLElement)

    expect(onSelect).toHaveBeenCalledWith('Greg')
  })

  it('calls onSelect when any cell in the row is clicked, not just the name', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<ParticipantList pool={pool} onSelect={onSelect} onBack={vi.fn()} />)

    const row = screen.getByText('Greg').closest('tr') as HTMLElement
    await user.click(within(row).getByText(/pending/i))

    expect(onSelect).toHaveBeenCalledWith('Greg')
  })

  it('activates the row via the keyboard', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<ParticipantList pool={pool} onSelect={onSelect} onBack={vi.fn()} />)

    const row = screen.getByText('Greg').closest('tr') as HTMLElement
    row.focus()
    await user.keyboard('{Enter}')

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

describe('ParticipantList week winner badge', () => {
  it("shows a winner badge next to the week's winner only", () => {
    render(<ParticipantList pool={poolWithWinner} onSelect={vi.fn()} onBack={vi.fn()} />)

    const steveRow = screen.getByText('Steve').closest('tr') as HTMLElement
    const gregRow = screen.getByText('Greg').closest('tr') as HTMLElement

    expect(within(steveRow).getByText(/week winner/i)).toBeInTheDocument()
    expect(within(gregRow).queryByText(/week winner/i)).not.toBeInTheDocument()
  })

  it('shows no winner badge while the week is not decided yet', () => {
    const poolPending: Pool = {
      ...poolWithWinner,
      results: {
        ...poolWithWinner.results,
        game_01: { ...poolWithWinner.results.game_01, status: 'in_progress', winner: null },
      },
    }
    render(<ParticipantList pool={poolPending} onSelect={vi.fn()} onBack={vi.fn()} />)

    expect(screen.queryByText(/week winner/i)).not.toBeInTheDocument()
  })
})

describe('ParticipantList mobile layout', () => {
  afterEach(() => {
    mockMatchMediaMatches(false)
  })

  it('renders participants as cards instead of a table below the sm breakpoint', () => {
    mockMatchMediaMatches(true)
    render(<ParticipantList pool={pool} onSelect={vi.fn()} onBack={vi.fn()} />)

    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByText('Steve')).toBeInTheDocument()
    expect(screen.getByText('Greg')).toBeInTheDocument()
  })

  it('still calls onSelect when a participant card is tapped', async () => {
    mockMatchMediaMatches(true)
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<ParticipantList pool={pool} onSelect={onSelect} onBack={vi.fn()} />)

    await user.click(screen.getByText('Greg'))

    expect(onSelect).toHaveBeenCalledWith('Greg')
  })

  it('still shows the winner badge on the mobile card layout', () => {
    mockMatchMediaMatches(true)
    render(<ParticipantList pool={poolWithWinner} onSelect={vi.fn()} onBack={vi.fn()} />)

    expect(screen.getByText(/week winner/i)).toBeInTheDocument()
  })
})
