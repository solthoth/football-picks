import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { Pool } from '../data/types'
import { renderWithRouter } from '../testUtils/renderWithRouter'
import { expectNotTruncated } from '../testUtils/truncation'
import { GamePicks } from './GamePicks'

const GAME_ID = 'Steelers@Browns'

function pool(overrides: Partial<Pool> = {}): Pool {
  return {
    season: 2026,
    week: 4,
    games: [{ id: GAME_ID, away: 'Steelers', home: 'Browns' }],
    participants: [
      { name: 'Zed', picks: { [GAME_ID]: 'Steelers' }, tieBreakerTotalScore: null },
      { name: 'Amy', picks: { [GAME_ID]: 'Browns' }, tieBreakerTotalScore: null },
      { name: 'Bob', picks: { [GAME_ID]: 'Steelers' }, tieBreakerTotalScore: null },
      { name: 'Cat', picks: {}, tieBreakerTotalScore: null },
    ],
    results: {},
    ...overrides,
  }
}

function renderPicks(p: Pool = pool(), extra: Partial<Parameters<typeof GamePicks>[0]> = {}, router = {}) {
  return renderWithRouter(<GamePicks pool={p} gameId={GAME_ID} {...extra} />, router)
}

describe('GamePicks', () => {
  it('titles the page with the matchup and week', () => {
    renderPicks()

    expect(screen.getByRole('heading', { level: 1, name: 'Steelers @ Browns' })).toBeInTheDocument()
    expect(screen.getByText(/Season 2026/)).toBeInTheDocument()
  })

  it('has a subtitle that is only the season and week, with no instruction mixed in', () => {
    renderPicks()

    const subtitle = screen.getByText('Week 4').parentElement as HTMLElement
    expect(subtitle).toHaveTextContent(/^Season 2026 · Week 4$/)
    expect(screen.queryByText(/select a participant/i)).not.toBeInTheDocument()
  })

  it('groups participants under the team they picked, sorted by name', () => {
    renderPicks()

    const away = within(screen.getByTestId('pickers-away'))
    const home = within(screen.getByTestId('pickers-home'))
    expect(away.getByRole('heading', { name: 'Picked Steelers' })).toBeInTheDocument()
    expect(away.getAllByRole('link').map((b) => b.textContent)).toEqual(['Bob', 'Zed'])
    expect(home.getByRole('heading', { name: 'Picked Browns' })).toBeInTheDocument()
    expect(home.getAllByRole('link').map((b) => b.textContent)).toEqual(['Amy'])
  })

  it('lets a long "Picked <team>" heading wrap instead of cutting the team name off', () => {
    renderPicks()

    expectNotTruncated(screen.getByRole('heading', { name: 'Picked Steelers' }))
    expectNotTruncated(screen.getByRole('heading', { name: 'Picked Browns' }))
  })

  it('lists participants without a pick separately, outside both groups', () => {
    renderPicks()

    expect(screen.getByText('No pick: Cat')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cat' })).not.toBeInTheDocument()
  })

  it('says so when nobody picked a side', () => {
    renderPicks(pool({ participants: [{ name: 'Zed', picks: { [GAME_ID]: 'Steelers' }, tieBreakerTotalScore: null }] }))

    expect(within(screen.getByTestId('pickers-home')).getByText('Nobody picked the Browns.')).toBeInTheDocument()
  })

  it('links each participant to their picks', () => {
    renderPicks()

    expect(within(screen.getByTestId('pickers-home')).getByRole('link', { name: 'Amy' })).toHaveAttribute(
      'href',
      '/season/2026/week/4/participant/Amy',
    )
  })

  it('tells the participant page to offer a way back to this game', async () => {
    const user = userEvent.setup()
    renderPicks()

    await user.click(within(screen.getByTestId('pickers-home')).getByRole('link', { name: 'Amy' }))

    expect(screen.getByTestId('location-state')).toHaveTextContent('{"backLabel":"Back to Steelers @ Browns"}')
  })

  it('marks the winning and losing groups once the game is final', () => {
    renderPicks(
      pool({ results: { [GAME_ID]: { kickoffTime: null, status: 'final', awayScore: 24, homeScore: 27, winner: 'Browns' } } }),
    )

    expect(screen.getByTestId('pickers-home')).toHaveTextContent('Won')
    expect(screen.getByTestId('pickers-away')).toHaveTextContent('Lost')
  })

  it('does not mark either group while the game is undecided', () => {
    renderPicks()

    expect(screen.queryByText(/Won|Lost/)).not.toBeInTheDocument()
  })

  it('keeps back and share in a sticky header', () => {
    renderPicks()

    expect(screen.getByRole('link', { name: 'Back to dashboard' }).closest('header')).toHaveStyle({ position: 'sticky' })
    expect(screen.getByRole('button', { name: /share/i }).closest('header')).toHaveStyle({ position: 'sticky' })
  })

  it('links back to the dashboard by default', () => {
    renderPicks()

    expect(screen.getByRole('link', { name: 'Back to dashboard' })).toHaveAttribute('href', '/season/2026/week/4/dashboard')
  })

  it('uses a custom back label and returns to the previous screen', async () => {
    const user = userEvent.setup()
    renderPicks(pool(), { backLabel: 'Back to Kiko' }, { initialEntries: ['/kiko', '/game'], initialIndex: 1 })

    await user.click(screen.getByRole('link', { name: 'Back to Kiko' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/kiko')
  })

  it('shows a titled fallback that leads to the week\'s games for a game that is not in the pool', () => {
    renderWithRouter(<GamePicks pool={pool()} gameId="Jets@Bills" />)

    expect(screen.getByRole('heading', { level: 1, name: 'Game not found' })).toBeInTheDocument()
    expect(screen.getByText(/couldn't find that game/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: "See this week's games" })).toHaveAttribute('href', '/season/2026/week/4/dashboard')
  })
})
