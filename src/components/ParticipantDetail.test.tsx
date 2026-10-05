import { render, screen, within } from '@testing-library/react'
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
    for (const label of ['Correct', 'Incorrect', 'Pending']) {
      const tile = within(summary).getByText(label).parentElement?.parentElement
      expect(tile).toHaveTextContent(`${label}1`)
    }
    expect(within(summary).getAllByText('of 3 games')).toHaveLength(3)
  })

  it('shows the tiebreaker guess', () => {
    render(<ParticipantDetail pool={pool} participantName="Steve" onBack={vi.fn()} />)
    const tile = screen.getByText('Tiebreaker guess').parentElement?.parentElement
    expect(tile).toHaveTextContent('combined score')
    expect(within(tile as HTMLElement).getByText('44')).toBeInTheDocument()
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
    expect(screen.getByText('Week Winner')).toBeInTheDocument()
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

describe('ParticipantDetail sharing', () => {
  it('shares a deep link to this participant (see ShareButton.test.tsx for share/clipboard behavior)', async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)

    render(<ParticipantDetail pool={pool} participantName="Steve" onBack={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /share/i }))

    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/season/2026/week/1/participant/Steve`)
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

    expect(screen.getByText('Week Winner')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /back to participants/i }))
    expect(onBack).toHaveBeenCalled()
  })
})

describe('ParticipantDetail game selection', () => {
  afterEach(() => {
    mockMatchMediaMatches(false)
  })

  it('opens a game when its table row is clicked or activated with the keyboard', async () => {
    const user = userEvent.setup()
    const onSelectGame = vi.fn()
    render(<ParticipantDetail pool={pool} participantName="Steve" onBack={vi.fn()} onSelectGame={onSelectGame} />)

    const rows = screen.getAllByRole('row').slice(1)
    await user.click(rows[0])
    expect(onSelectGame).toHaveBeenLastCalledWith('game_01')

    rows[1].focus()
    await user.keyboard('{Enter}')
    expect(onSelectGame).toHaveBeenLastCalledWith('game_02')
  })

  it('opens a game when its card is tapped on mobile', async () => {
    mockMatchMediaMatches(true)
    const user = userEvent.setup()
    const onSelectGame = vi.fn()
    render(<ParticipantDetail pool={pool} participantName="Steve" onBack={vi.fn()} onSelectGame={onSelectGame} />)

    await user.click(screen.getByRole('button', { name: 'See who picked 49ers at Rams' }))

    expect(onSelectGame).toHaveBeenCalledWith('game_02')
  })

  it('does not make games clickable without onSelectGame', () => {
    mockMatchMediaMatches(true)
    render(<ParticipantDetail pool={pool} participantName="Steve" onBack={vi.fn()} />)

    expect(screen.queryByRole('button', { name: /see who picked/i })).not.toBeInTheDocument()
  })

  it('shows a custom back label', () => {
    render(<ParticipantDetail pool={pool} participantName="Steve" onBack={vi.fn()} backLabel="Back to Patriots @ Seahawks" />)

    expect(screen.getByRole('button', { name: 'Back to Patriots @ Seahawks' })).toBeInTheDocument()
  })
})
