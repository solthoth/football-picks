import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Pool } from '../data/types'
import { renderWithRouter } from '../testUtils/renderWithRouter'
import { PicksDashboard } from './PicksDashboard'

const GAMES = [
  { id: 'Falcons@Packers', away: 'Falcons', home: 'Packers' },
  { id: 'Colts@Commanders', away: 'Colts', home: 'Commanders' },
  { id: 'Chiefs@Raiders', away: 'Chiefs', home: 'Raiders' },
]

function pool(overrides: Partial<Pool> = {}): Pool {
  return {
    season: 2026,
    week: 4,
    games: GAMES,
    participants: [
      { name: 'A', picks: { 'Falcons@Packers': 'Falcons', 'Colts@Commanders': 'Colts', 'Chiefs@Raiders': 'Chiefs' }, tieBreakerTotalScore: null },
      { name: 'B', picks: { 'Falcons@Packers': 'Falcons', 'Colts@Commanders': 'Commanders', 'Chiefs@Raiders': 'Chiefs' }, tieBreakerTotalScore: null },
      { name: 'C', picks: { 'Falcons@Packers': 'Packers', 'Colts@Commanders': 'Colts', 'Chiefs@Raiders': 'Chiefs' }, tieBreakerTotalScore: null },
      { name: 'D', picks: { 'Falcons@Packers': 'Falcons', 'Colts@Commanders': 'Commanders', 'Chiefs@Raiders': 'Chiefs' }, tieBreakerTotalScore: null },
    ],
    results: {},
    ...overrides,
  }
}

function expectCardOrder(names: string[]) {
  const headings = screen.getAllByRole('heading', { level: 2 })
  expect(headings).toHaveLength(names.length)
  names.forEach((name, i) => expect(headings[i]).toHaveAccessibleName(name))
}

describe('PicksDashboard', () => {
  it('renders the week heading and one article per game', () => {
    renderWithRouter(<PicksDashboard pool={pool()} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Season 2026 · Week 4' })).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(3)
    expectCardOrder(['Falcons at Packers', 'Colts at Commanders', 'Chiefs at Raiders'])
  })

  it('keeps "Week 4" together in the heading so the number cannot wrap onto its own line', () => {
    renderWithRouter(<PicksDashboard pool={pool()} />)

    const heading = screen.getByRole('heading', { level: 1 })
    expect(within(heading).getByText('Week 4')).toHaveStyle({ whiteSpace: 'nowrap' })
  })

  it('links back to the standings', () => {
    renderWithRouter(<PicksDashboard pool={pool()} />)

    expect(screen.getByRole('link', { name: 'Back to standings' })).toHaveAttribute('href', '/season/2026/week/4')
  })

  it('links each game card to its who-picked-what page', () => {
    renderWithRouter(<PicksDashboard pool={pool()} />)

    expect(screen.getByRole('link', { name: 'See who picked Falcons at Packers' })).toHaveAttribute(
      'href',
      '/season/2026/week/4/game/Falcons%40Packers',
    )
  })

  it('tells the game page to offer a "Back to dashboard" button when a card is opened', async () => {
    const user = userEvent.setup()
    renderWithRouter(<PicksDashboard pool={pool()} />)

    await user.click(screen.getByRole('link', { name: 'See who picked Chiefs at Raiders' }))

    expect(screen.getByTestId('location-state')).toHaveTextContent('{"backLabel":"Back to dashboard"}')
  })

  it('shares a deep link to the dashboard', async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)
    renderWithRouter(<PicksDashboard pool={pool()} />)

    await user.click(screen.getByRole('button', { name: /share/i }))

    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/season/2026/week/4/dashboard`)
  })

  it('explains an empty roster without a summary or sort control', () => {
    renderWithRouter(<PicksDashboard pool={pool({ participants: [] })} />)

    expect(screen.getByText('No picks have been submitted for this week yet.')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Week summary' })).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Sort games' })).not.toBeInTheDocument()
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })

  it('explains an empty slate without a summary or sort control', () => {
    renderWithRouter(<PicksDashboard pool={pool({ games: [] })} />)

    expect(screen.getByText('No games are listed for this week yet.')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Week summary' })).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Sort games' })).not.toBeInTheDocument()
  })

  it('hides the summary strip for a single participant', () => {
    const base = pool()
    renderWithRouter(<PicksDashboard pool={pool({ participants: base.participants.slice(0, 1) })} />)

    expect(screen.queryByRole('group', { name: 'Week summary' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(3)
  })

  it('summarizes participants, most popular pick, and most divided game', () => {
    renderWithRouter(<PicksDashboard pool={pool()} />)

    const strip = screen.getByRole('group', { name: 'Week summary' })
    expect(within(strip).getByText('4')).toBeInTheDocument()
    expect(within(strip).getByText('Chiefs 100%')).toBeInTheDocument()
    expect(within(strip).getByText('4 of 4 - Chiefs @ Raiders')).toBeInTheDocument()
    expect(within(strip).getByText('Colts @ Commanders')).toBeInTheDocument()
    expect(within(strip).getByText('50% / 50%')).toBeInTheDocument()
  })

  it('omits the most-popular tile but keeps the strip when every game is an even split', () => {
    const tied = pool({
      participants: [
        { name: 'A', picks: { 'Falcons@Packers': 'Falcons', 'Colts@Commanders': 'Colts', 'Chiefs@Raiders': 'Chiefs' }, tieBreakerTotalScore: null },
        { name: 'B', picks: { 'Falcons@Packers': 'Packers', 'Colts@Commanders': 'Commanders', 'Chiefs@Raiders': 'Raiders' }, tieBreakerTotalScore: null },
      ],
    })
    renderWithRouter(<PicksDashboard pool={tied} />)

    const strip = screen.getByRole('group', { name: 'Week summary' })
    expect(within(strip).queryByText('Most popular pick')).not.toBeInTheDocument()
    expect(within(strip).getByText('Most divided game')).toBeInTheDocument()
  })

  it('reorders the games by how divided they were when toggled', async () => {
    const user = userEvent.setup()
    renderWithRouter(<PicksDashboard pool={pool()} />)
    expect(screen.getByRole('group', { name: 'Sort games' })).toBeInTheDocument()
    expectCardOrder(['Falcons at Packers', 'Colts at Commanders', 'Chiefs at Raiders'])

    await user.click(screen.getByRole('button', { name: 'Most divided' }))
    expectCardOrder(['Colts at Commanders', 'Falcons at Packers', 'Chiefs at Raiders'])

    await user.click(screen.getByRole('button', { name: 'Schedule' }))
    expectCardOrder(['Falcons at Packers', 'Colts at Commanders', 'Chiefs at Raiders'])
  })
})
