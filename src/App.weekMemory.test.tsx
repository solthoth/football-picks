import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Pool } from './data/types'

const { pools } = vi.hoisted(() => {
  const week = (n: number): Pool => ({
    season: 2026,
    week: n,
    games: [{ id: 'game_01', away: 'Patriots', home: 'Seahawks' }],
    participants: [{ name: 'Steve', picks: { game_01: 'Seahawks' }, tieBreakerTotalScore: 44 }],
    results: { game_01: { kickoffTime: null, status: 'final', awayScore: 10, homeScore: 13, winner: 'Seahawks' } },
  })
  return { pools: [week(1), week(2), week(3)] }
})

vi.mock('./data/pools', () => ({ pools }))

const { default: App } = await import('./App')
const { resetLastViewedWeek } = await import('./data/lastViewedWeek')

function renderApp(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>,
  )
}

const selectedWeek = () => screen.getByRole('option', { selected: true })

describe('the home page remembers the week you were looking at', () => {
  beforeEach(() => {
    resetLastViewedWeek()
  })

  it('defaults to the latest week when no week has been viewed yet', () => {
    renderApp('/')

    expect(selectedWeek()).toHaveAccessibleName('Week 3')
  })

  it('preselects the week you came from after "Change season/week"', async () => {
    const user = userEvent.setup()
    renderApp('/season/2026/week/1')

    await user.click(screen.getByRole('link', { name: /change season\/week/i }))

    expect(selectedWeek()).toHaveAccessibleName('Week 1')
  })

  it('remembers the week while you are deeper in the app, not only on the standings page', async () => {
    const user = userEvent.setup()
    renderApp('/season/2026/week/2/dashboard')

    await user.click(screen.getByRole('link', { name: /back to standings/i }))
    await user.click(screen.getByRole('link', { name: /change season\/week/i }))

    expect(selectedWeek()).toHaveAccessibleName('Week 2')
  })

  it("shows the remembered week's player count and pot, not the default week's", async () => {
    const user = userEvent.setup()
    renderApp('/season/2026/week/1')

    await user.click(screen.getByRole('link', { name: /change season\/week/i }))

    expect(screen.getByText('1 player')).toBeInTheDocument()
  })
})

describe('moving between weeks from the standings page', () => {
  beforeEach(() => {
    resetLastViewedWeek()
  })

  it('goes to the next week and back without a trip home', async () => {
    const user = userEvent.setup()
    renderApp('/season/2026/week/2')

    await user.click(screen.getByRole('link', { name: 'Week 3 (next week)' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Season 2026 · Week 3' })).toBeInTheDocument()
    expect(document.title).toBe('Week 3 standings (2026) · Football Picks')
    expect(screen.queryByRole('link', { name: /next week/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Week 2 (previous week)' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Season 2026 · Week 2' })).toBeInTheDocument()
  })

  it('reopens the home page on the week you moved to', async () => {
    const user = userEvent.setup()
    renderApp('/season/2026/week/3')

    await user.click(screen.getByRole('link', { name: 'Week 2 (previous week)' }))
    await user.click(screen.getByRole('link', { name: /change season\/week/i }))

    expect(selectedWeek()).toHaveAccessibleName('Week 2')
  })
})
