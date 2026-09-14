import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Pool } from '../data/types'
import { mockMatchMediaMatches } from '../testUtils/mockMatchMedia'
import { ParticipantDetail } from './ParticipantDetail'

const pool: Pool = {
  season: 2026,
  week: 1,
  games: [
    { id: 'game_01', away: 'Patriots', home: 'Seahawks' },
    { id: 'game_02', away: '49ers', home: 'Rams' },
    { id: 'game_03', away: 'Falcons', home: 'Steelers' },
  ],
  participants: [{ name: 'Steve', picks: { game_01: 'Seahawks', game_02: 'Rams', game_03: 'Steelers' }, tieBreakerTotalScore: 44 }],
  results: {
    game_01: { kickoffTime: null, status: 'final', awayScore: 10, homeScore: 13, winner: 'Seahawks' },
    game_02: { kickoffTime: null, status: 'final', awayScore: 27, homeScore: 7, winner: '49ers' },
    game_03: { kickoffTime: null, status: 'scheduled', awayScore: null, homeScore: null, winner: null },
  },
}

describe('ParticipantDetail', () => {
  it('shows a summary of correct/incorrect/pending picks', () => {
    render(<ParticipantDetail pool={pool} participantName="Steve" onBack={vi.fn()} />)
    const summary = screen.getByRole('group', { name: /pick summary/i })
    expect(summary).toHaveTextContent('1 Correct')
    expect(summary).toHaveTextContent('1 Incorrect')
    expect(summary).toHaveTextContent('1 Pending')
    expect(screen.getByText(/out of 3 games/i)).toBeInTheDocument()
  })

  it('shows the tiebreaker guess', () => {
    render(<ParticipantDetail pool={pool} participantName="Steve" onBack={vi.fn()} />)
    expect(screen.getByText(/tiebreaker guess.*44/i)).toBeInTheDocument()
  })

  it('labels each pick as correct, incorrect, or pending', () => {
    render(<ParticipantDetail pool={pool} participantName="Steve" onBack={vi.fn()} />)
    const rows = screen.getAllByRole('row').slice(1)
    expect(rows[0]).toHaveTextContent('Correct')
    expect(rows[1]).toHaveTextContent('Incorrect')
    expect(rows[2]).toHaveTextContent('Pending')
  })

  it('shows a fallback and lets the user go back when the participant is not found', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    render(<ParticipantDetail pool={pool} participantName="Nobody" onBack={onBack} />)

    expect(screen.getByText(/couldn't find nobody/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(onBack).toHaveBeenCalled()
  })

  it("shows a winner badge next to the participant's name once the week is decided", () => {
    // Sole participant, and both non-tiebreaker games (game_01, game_02) are
    // already final -> Steve is the winner regardless of game_03 (the
    // tiebreaker/"Monday" game, still scheduled) since there's no one to tie with.
    render(<ParticipantDetail pool={pool} participantName="Steve" onBack={vi.fn()} />)
    expect(screen.getByText(/week winner/i)).toBeInTheDocument()
  })

  it('shows no winner badge while a non-tiebreaker game is still in progress', () => {
    const pendingPool: Pool = {
      ...pool,
      results: { ...pool.results, game_01: { ...pool.results.game_01, status: 'in_progress', winner: null } },
    }
    render(<ParticipantDetail pool={pendingPool} participantName="Steve" onBack={vi.fn()} />)
    expect(screen.queryByText(/week winner/i)).not.toBeInTheDocument()
  })
})

describe('ParticipantDetail mobile layout', () => {
  afterEach(() => {
    mockMatchMediaMatches(false)
  })

  it('renders picks as cards instead of a table below the sm breakpoint', () => {
    mockMatchMediaMatches(true)
    render(<ParticipantDetail pool={pool} participantName="Steve" onBack={vi.fn()} />)

    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByText('Patriots @ Seahawks')).toBeInTheDocument()
    expect(screen.getByText('49ers @ Rams')).toBeInTheDocument()
    expect(screen.getByText('Falcons @ Steelers')).toBeInTheDocument()
  })

  it('still shows the winner badge and lets the user navigate back on mobile', async () => {
    mockMatchMediaMatches(true)
    const user = userEvent.setup()
    const onBack = vi.fn()
    render(<ParticipantDetail pool={pool} participantName="Steve" onBack={onBack} />)

    expect(screen.getByText(/week winner/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /back to participants/i }))
    expect(onBack).toHaveBeenCalled()
  })
})
