import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Pool } from '../data/types'
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

function renderPicks(p: Pool = pool(), extra: Partial<Parameters<typeof GamePicks>[0]> = {}) {
  const onBack = vi.fn()
  const onSelectParticipant = vi.fn()
  render(<GamePicks pool={p} gameId={GAME_ID} onBack={onBack} onSelectParticipant={onSelectParticipant} {...extra} />)
  return { onBack, onSelectParticipant }
}

describe('GamePicks', () => {
  it('titles the page with the matchup and week', () => {
    renderPicks()

    expect(screen.getByRole('heading', { level: 1, name: 'Steelers @ Browns' })).toBeInTheDocument()
    expect(screen.getByText(/Season 2026/)).toBeInTheDocument()
  })

  it('groups participants under the team they picked, sorted by name', () => {
    renderPicks()

    const away = within(screen.getByTestId('pickers-away'))
    const home = within(screen.getByTestId('pickers-home'))
    expect(away.getByRole('heading', { name: 'Picked Steelers' })).toBeInTheDocument()
    expect(away.getAllByRole('button').map((b) => b.textContent)).toEqual(['Bob', 'Zed'])
    expect(home.getByRole('heading', { name: 'Picked Browns' })).toBeInTheDocument()
    expect(home.getAllByRole('button').map((b) => b.textContent)).toEqual(['Amy'])
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

  it('opens a participant when their name is selected', async () => {
    const user = userEvent.setup()
    const { onSelectParticipant } = renderPicks()

    await user.click(within(screen.getByTestId('pickers-home')).getByRole('button', { name: 'Amy' }))

    expect(onSelectParticipant).toHaveBeenCalledWith('Amy')
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

  it('uses a custom back label and calls onBack', async () => {
    const user = userEvent.setup()
    const { onBack } = renderPicks(pool(), { backLabel: 'Back to Kiko' })

    await user.click(screen.getByRole('button', { name: 'Back to Kiko' }))

    expect(onBack).toHaveBeenCalled()
  })

  it('shows a fallback with a way back for a game that is not in the pool', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    render(<GamePicks pool={pool()} gameId="Jets@Bills" onBack={onBack} onSelectParticipant={vi.fn()} />)

    expect(screen.getByText(/couldn't find that game/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /back to dashboard/i }))
    expect(onBack).toHaveBeenCalled()
  })
})
