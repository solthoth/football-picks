import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Pool } from '../data/types'
import { mockMatchMediaMatches } from '../testUtils/mockMatchMedia'
import { renderWithRouter } from '../testUtils/renderWithRouter'
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
    renderWithRouter(<ParticipantList pool={pool} />)
    expect(screen.getByRole('heading', { name: /season 2026.*week 1/i })).toBeInTheDocument()
  })

  it('lists participants ranked by correct picks', () => {
    renderWithRouter(<ParticipantList pool={pool} />)
    const rows = screen.getAllByRole('row').slice(1) // skip header row
    expect(rows[0]).toHaveTextContent('Steve')
    expect(rows[1]).toHaveTextContent('Greg')
  })

  it('links each participant name to their picks, encoding awkward names', () => {
    const spaced: Pool = { ...pool, participants: [{ name: 'Mary Jo', picks: { game_01: 'Seahawks' }, tieBreakerTotalScore: 1 }] }
    renderWithRouter(<ParticipantList pool={spaced} />)

    expect(screen.getByRole('link', { name: 'Mary Jo' })).toHaveAttribute('href', '/season/2026/week/1/participant/Mary%20Jo')
  })

  it('opens the participant when the row is clicked anywhere, navigating exactly once', async () => {
    const user = userEvent.setup()
    const { visited } = renderWithRouter(<ParticipantList pool={pool} />, { initialEntries: ['/week'] })

    const row = screen.getByText('Greg').closest('tr') as HTMLElement
    await user.click(within(row).getByText(/pending/i))

    expect(visited).toEqual(['/week', '/season/2026/week/1/participant/Greg'])
  })

  it('navigates once, not twice, when the name link itself is clicked', async () => {
    const user = userEvent.setup()
    const { visited } = renderWithRouter(<ParticipantList pool={pool} />, { initialEntries: ['/week'] })

    await user.click(screen.getByRole('link', { name: 'Greg' }))

    expect(visited).toEqual(['/week', '/season/2026/week/1/participant/Greg'])
  })

  it('opens a participant from the keyboard through the name link', async () => {
    const user = userEvent.setup()
    renderWithRouter(<ParticipantList pool={pool} />)

    screen.getByRole('link', { name: 'Greg' }).focus()
    await user.keyboard('{Enter}')

    expect(screen.getByTestId('location')).toHaveTextContent('/season/2026/week/1/participant/Greg')
  })

  it('makes the link, not the whole row, the keyboard stop (rows are not focusable)', () => {
    renderWithRouter(<ParticipantList pool={pool} />)

    for (const row of screen.getAllByRole('row').slice(1)) {
      expect(row).not.toHaveAttribute('tabindex')
    }
  })

  it('links back to the season/week picker', () => {
    renderWithRouter(<ParticipantList pool={pool} />)

    expect(screen.getByRole('link', { name: /change season\/week/i })).toHaveAttribute('href', '/')
  })

  it('links to the pick dashboard', () => {
    renderWithRouter(<ParticipantList pool={pool} />)

    expect(screen.getByRole('link', { name: /see how the pool picked/i })).toHaveAttribute('href', '/season/2026/week/1/dashboard')
  })

  it('shares a deep link to the week (see ShareButton.test.tsx for share/clipboard behavior)', async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)

    renderWithRouter(<ParticipantList pool={pool} />)
    await user.click(screen.getByRole('button', { name: /share/i }))

    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/season/2026/week/1`)
  })
})

describe('ParticipantList week winner badge', () => {
  it("shows a winner badge next to the week's winner only", () => {
    renderWithRouter(<ParticipantList pool={poolWithWinner} />)

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
    renderWithRouter(<ParticipantList pool={poolPending} />)

    expect(screen.queryByText(/week winner/i)).not.toBeInTheDocument()
  })
})

describe('ParticipantList mobile layout', () => {
  afterEach(() => {
    mockMatchMediaMatches(false)
  })

  it('renders participants as cards instead of a table below the sm breakpoint', () => {
    mockMatchMediaMatches(true)
    renderWithRouter(<ParticipantList pool={pool} />)

    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByText('Steve')).toBeInTheDocument()
    expect(screen.getByText('Greg')).toBeInTheDocument()
  })

  it('makes each participant card a link to their picks', async () => {
    mockMatchMediaMatches(true)
    const user = userEvent.setup()
    renderWithRouter(<ParticipantList pool={pool} />)

    const card = screen.getByRole('link', { name: /Greg/ })
    expect(card).toHaveAttribute('href', '/season/2026/week/1/participant/Greg')

    await user.click(screen.getByText('Greg'))
    expect(screen.getByTestId('location')).toHaveTextContent('/season/2026/week/1/participant/Greg')
  })

  it('still shows the winner badge on the mobile card layout', () => {
    mockMatchMediaMatches(true)
    renderWithRouter(<ParticipantList pool={poolWithWinner} />)

    expect(screen.getByText(/week winner/i)).toBeInTheDocument()
  })
})


describe('ParticipantList before any game is decided', () => {
  const poolNotStarted: Pool = {
    ...pool,
    results: {
      game_01: { kickoffTime: null, status: 'scheduled', awayScore: null, homeScore: null, winner: null },
    },
  }

  afterEach(() => {
    mockMatchMediaMatches(false)
  })

  it.each([
    ['desktop table', false],
    ['mobile cards', true],
  ])('does not hand out rank 1 to everyone in the %s', (_layout, mobile) => {
    mockMatchMediaMatches(mobile)
    renderWithRouter(<ParticipantList pool={poolNotStarted} />)

    expect(screen.queryByText('1')).not.toBeInTheDocument()
    expect(screen.getAllByRole('img', { name: 'Not ranked yet' })).toHaveLength(2)
  })

  it('explains why there is no ranking yet', () => {
    renderWithRouter(<ParticipantList pool={poolNotStarted} />)

    expect(screen.getByText(/rankings start once the first game is final/i)).toBeInTheDocument()
  })

  it('lists players alphabetically while unranked', () => {
    renderWithRouter(<ParticipantList pool={poolNotStarted} />)

    const rows = screen.getAllByRole('row').slice(1)
    expect(rows[0]).toHaveTextContent('Greg')
    expect(rows[1]).toHaveTextContent('Steve')
  })

  it('shows ranks and no explanation once a game is decided', () => {
    renderWithRouter(<ParticipantList pool={pool} />)

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'Not ranked yet' })).not.toBeInTheDocument()
    expect(screen.queryByText(/rankings start once/i)).not.toBeInTheDocument()
  })
})
