import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import type { Pool } from '../data/types'
import { textContrast } from '../testUtils/contrast'
import { expectNotTruncated } from '../testUtils/truncation'
import { mockMatchMediaMatches } from '../testUtils/mockMatchMedia'
import { renderWithRouter } from '../testUtils/renderWithRouter'
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
    renderWithRouter(<ParticipantDetail pool={pool} participantName="Steve" />)
    const summary = screen.getByRole('group', { name: /pick summary/i })
    for (const label of ['Correct', 'Incorrect', 'Pending']) {
      const tile = within(summary).getByText(label).parentElement?.parentElement
      expect(tile).toHaveTextContent(`${label}1`)
    }
    expect(within(summary).getAllByText('of 3 games')).toHaveLength(3)
  })

  it('shows the tiebreaker guess', () => {
    renderWithRouter(<ParticipantDetail pool={pool} participantName="Steve" />)
    const tile = screen.getByText('Tiebreaker guess').parentElement?.parentElement
    expect(tile).toHaveTextContent('combined score')
    expect(within(tile as HTMLElement).getByText('44')).toBeInTheDocument()
  })

  it('drops the Pending tile once nothing is pending, and keeps the others', () => {
    const finalPool: Pool = {
      ...pool,
      results: { ...pool.results, game_03: { kickoffTime: null, status: 'final', awayScore: 17, homeScore: 24, winner: 'Steelers' } },
    }
    renderWithRouter(<ParticipantDetail pool={finalPool} participantName="Steve" />)

    const summary = within(screen.getByRole('group', { name: /pick summary/i }))
    expect(summary.queryByText('Pending')).not.toBeInTheDocument()
    for (const label of ['Correct', 'Incorrect', 'Tiebreaker guess']) expect(summary.getByText(label)).toBeInTheDocument()
  })

  it('labels each pick as correct, incorrect, or pending', () => {
    renderWithRouter(<ParticipantDetail pool={pool} participantName="Steve" />)
    const rows = screen.getAllByRole('row').slice(1)
    expect(rows[0]).toHaveTextContent('Correct')
    expect(rows[1]).toHaveTextContent('Incorrect')
    expect(rows[2]).toHaveTextContent('Pending')
  })

  it('labels a pick on a tied final game as a tie rather than pending', () => {
    const tiedPool: Pool = {
      ...pool,
      results: { ...pool.results, game_03: { kickoffTime: null, status: 'final', awayScore: 20, homeScore: 20, winner: null } },
    }
    renderWithRouter(<ParticipantDetail pool={tiedPool} participantName="Steve" />)
    const rows = screen.getAllByRole('row').slice(1)
    expect(rows[2]).toHaveTextContent('Tie')
    expect(rows[2]).not.toHaveTextContent('Pending')
  })

  it("shows a titled fallback that leads to the week's standings when the participant is not found", () => {
    renderWithRouter(<ParticipantDetail pool={pool} participantName="Nobody" />)

    expect(screen.getByRole('heading', { level: 1, name: 'Player not found' })).toBeInTheDocument()
    expect(screen.getByText(/couldn't find nobody/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: "See this week's standings" })).toHaveAttribute('href', '/season/2026/week/1')
  })

  it("shows a winner badge next to the participant's name once the week is decided", () => {
    // Sole participant, and both non-tiebreaker games (game_01, game_02) are
    // already final -> Steve is the winner regardless of game_03 (the
    // tiebreaker/"Monday" game, still scheduled) since there's no one to tie with.
    renderWithRouter(<ParticipantDetail pool={pool} participantName="Steve" />)
    expect(screen.getByText('Week Winner')).toBeInTheDocument()
  })

  it('lets the picked team wrap on a narrow phone instead of cutting it to a letter or two', () => {
    mockMatchMediaMatches(true)
    renderWithRouter(<ParticipantDetail pool={pool} participantName="Steve" />)

    expectNotTruncated(screen.getByText('Rams'))
    expect(screen.getByText('Rams')).toHaveStyle({ overflowWrap: 'anywhere' })
  })

  it('keeps "Week 1" together in the subtitle so the number cannot wrap onto its own line', () => {
    renderWithRouter(<ParticipantDetail pool={pool} participantName="Steve" />)

    expect(screen.getByText('Week 1')).toHaveStyle({ whiteSpace: 'nowrap' })
  })

  it('announces a winner by name and week, not as "you"', () => {
    renderWithRouter(<ParticipantDetail pool={pool} participantName="Steve" />)

    expect(screen.getByText('Steve won Week 1!')).toBeInTheDocument()
  })

  it('shows no winner badge while a non-tiebreaker game is still in progress', () => {
    const pendingPool: Pool = {
      ...pool,
      results: { ...pool.results, game_01: { ...pool.results.game_01, status: 'in_progress', winner: null } },
    }
    renderWithRouter(<ParticipantDetail pool={pendingPool} participantName="Steve" />)
    expect(screen.queryByText(/week winner/i)).not.toBeInTheDocument()
  })
})

describe('ParticipantDetail sharing', () => {
  it('shares a deep link to this participant (see ShareButton.test.tsx for share/clipboard behavior)', async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)

    renderWithRouter(<ParticipantDetail pool={pool} participantName="Steve" />)
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
    renderWithRouter(<ParticipantDetail pool={pool} participantName="Steve" />)

    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByText('Patriots @ Seahawks')).toBeInTheDocument()
    expect(screen.getByText('49ers @ Rams')).toBeInTheDocument()
    expect(screen.getByText('Falcons @ Steelers')).toBeInTheDocument()
  })

  it('still shows the winner badge and a link back to the participants on mobile', () => {
    mockMatchMediaMatches(true)
    renderWithRouter(<ParticipantDetail pool={pool} participantName="Steve" />)

    expect(screen.getByText('Week Winner')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to participants/i })).toHaveAttribute('href', '/season/2026/week/1')
  })
})

describe('ParticipantDetail tiebreaker result', () => {
  // game_03 is the tiebreaker (last listed, no kickoff times known). Steve guessed 44.
  const withMonday = (result: Pool['results'][string]): Pool => ({ ...pool, results: { ...pool.results, game_03: result } })
  const tile = () => within(screen.getByRole('group', { name: /pick summary/i })).getByText('Tiebreaker guess').parentElement?.parentElement as HTMLElement

  it('shows the actual combined score and how far off the guess was once the game is final', () => {
    const final = withMonday({ kickoffTime: null, status: 'final', awayScore: 17, homeScore: 24, winner: 'Steelers' })
    renderWithRouter(<ParticipantDetail pool={final} participantName="Steve" />)

    expect(tile()).toHaveTextContent('Actual 41')
    expect(tile()).toHaveTextContent('off by 3')
  })

  it('celebrates an exact guess', () => {
    const final = withMonday({ kickoffTime: null, status: 'final', awayScore: 20, homeScore: 24, winner: 'Steelers' })
    renderWithRouter(<ParticipantDetail pool={final} participantName="Steve" />)

    expect(tile()).toHaveTextContent('Actual 44')
    expect(tile()).toHaveTextContent('exact guess')
  })

  it('keeps showing "combined score" while the tiebreaker game is unfinished', () => {
    renderWithRouter(<ParticipantDetail pool={pool} participantName="Steve" />)

    expect(tile()).toHaveTextContent('combined score')
    expect(tile()).not.toHaveTextContent(/actual/i)
  })
})

describe('ParticipantDetail game selection', () => {
  afterEach(() => {
    mockMatchMediaMatches(false)
  })

  it('links each game to its who-picked-what page from the matchup cell', () => {
    renderWithRouter(<ParticipantDetail pool={pool} participantName="Steve" />)

    expect(screen.getByRole('link', { name: /Patriots @ Seahawks/ })).toHaveAttribute('href', '/season/2026/week/1/game/game_01')
  })

  it('opens a game when its table row is clicked anywhere, navigating once and offering a way back', async () => {
    const user = userEvent.setup()
    const { visited } = renderWithRouter(<ParticipantDetail pool={pool} participantName="Steve" />, { initialEntries: ['/steve'] })

    await user.click(screen.getAllByRole('row').slice(1)[0])

    expect(visited).toEqual(['/steve', '/season/2026/week/1/game/game_01'])
    expect(screen.getByTestId('location-state')).toHaveTextContent('{"backLabel":"Back to Steve"}')
  })

  it('opens a game from the keyboard through the matchup link', async () => {
    const user = userEvent.setup()
    renderWithRouter(<ParticipantDetail pool={pool} participantName="Steve" />)

    screen.getByRole('link', { name: /49ers @ Rams/ }).focus()
    await user.keyboard('{Enter}')

    expect(screen.getByTestId('location')).toHaveTextContent('/season/2026/week/1/game/game_02')
  })

  it('does not make table rows focusable (the matchup link is the keyboard stop)', () => {
    renderWithRouter(<ParticipantDetail pool={pool} participantName="Steve" />)

    for (const row of screen.getAllByRole('row').slice(1)) {
      expect(row).not.toHaveAttribute('tabindex')
    }
  })

  it('makes each game card a link on mobile', () => {
    mockMatchMediaMatches(true)
    renderWithRouter(<ParticipantDetail pool={pool} participantName="Steve" />)

    expect(screen.getByRole('link', { name: 'See who picked 49ers at Rams' })).toHaveAttribute('href', '/season/2026/week/1/game/game_02')
  })

  it('keeps back and share in a sticky header', () => {
    renderWithRouter(<ParticipantDetail pool={pool} participantName="Steve" />)

    expect(screen.getByRole('link', { name: 'Back to participants' }).closest('header')).toHaveStyle({ position: 'sticky' })
    expect(screen.getByRole('button', { name: /share/i }).closest('header')).toHaveStyle({ position: 'sticky' })
  })

  it('links back to the participants by default', () => {
    renderWithRouter(<ParticipantDetail pool={pool} participantName="Steve" />)

    expect(screen.getByRole('link', { name: 'Back to participants' })).toHaveAttribute('href', '/season/2026/week/1')
  })

  it('shows a custom back label and returns to the previous screen', async () => {
    const user = userEvent.setup()
    renderWithRouter(<ParticipantDetail pool={pool} participantName="Steve" backLabel="Back to Patriots @ Seahawks" />, {
      initialEntries: ['/game', '/steve'],
      initialIndex: 1,
    })

    await user.click(screen.getByRole('link', { name: 'Back to Patriots @ Seahawks' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/game')
  })
})


describe('ParticipantDetail text contrast', () => {
  const livePool: Pool = {
    ...pool,
    results: { ...pool.results, game_03: { kickoffTime: null, status: 'in_progress', awayScore: 3, homeScore: 0, winner: null } },
  }

  afterEach(() => {
    mockMatchMediaMatches(false)
  })

  it.each([
    ['light', '#ffffff'],
    ['dark', '#121212'],
  ] as const)('keeps the summary tile labels readable (WCAG AA) in %s mode', (mode, surface) => {
    renderWithRouter(<ParticipantDetail pool={pool} participantName="Steve" />, { mode })

    const summary = within(screen.getByRole('group', { name: /pick summary/i }))
    for (const label of ['Correct', 'Incorrect', 'Pending', 'Tiebreaker guess']) {
      expect(textContrast(summary.getByText(label), surface), `${label} label`).toBeGreaterThanOrEqual(4.5)
    }
  })

  it.each([
    ['light', '#ffffff'],
    ['dark', '#121212'],
  ] as const)('keeps the LIVE label and score readable on a mobile live-game card in %s mode', (mode, surface) => {
    mockMatchMediaMatches(true)
    renderWithRouter(<ParticipantDetail pool={livePool} participantName="Steve" />, { mode })

    expect(textContrast(screen.getByText('LIVE'), surface), 'LIVE label').toBeGreaterThanOrEqual(4.5)
    expect(textContrast(screen.getByText('3'), surface), 'live score').toBeGreaterThanOrEqual(4.5)
  })
})
