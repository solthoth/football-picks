import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { Pool } from './data/types'

const { pools } = vi.hoisted(() => {
  const pools: Pool[] = [
    {
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
    },
  ]
  return { pools }
})

vi.mock('./data/pools', () => ({ pools }))

const { default: App } = await import('./App')

function LocationDisplay() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

function renderApp(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
      <LocationDisplay />
    </MemoryRouter>,
  )
}

describe('App routing', () => {
  it('shows the landing page at "/"', () => {
    renderApp('/')
    expect(screen.getByRole('heading', { name: /football picks/i })).toBeInTheDocument()
  })

  it('navigates to a per-week URL when a week is selected, then to a per-participant URL', async () => {
    const user = userEvent.setup()
    renderApp('/')

    await user.click(screen.getByRole('option', { name: 'Week 1' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/season/2026/week/1')
    expect(screen.getByRole('heading', { name: /season 2026.*week 1/i })).toBeInTheDocument()

    await user.click(screen.getByText('Steve').closest('tr') as HTMLElement)
    expect(screen.getByTestId('location')).toHaveTextContent('/season/2026/week/1/participant/Steve')
    expect(screen.getByRole('heading', { name: 'Steve' })).toBeInTheDocument()
  })

  it('renders a deep-linked participant detail page directly, as a bookmark would', () => {
    renderApp('/season/2026/week/1/participant/Steve')

    expect(screen.getByRole('heading', { name: 'Steve' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /pick summary/i })).toHaveTextContent(/correct\s*1/i)
  })

  it('renders a deep-linked participant list page directly, as a bookmark would', () => {
    renderApp('/season/2026/week/1')

    expect(screen.getByRole('heading', { name: /season 2026.*week 1/i })).toBeInTheDocument()
  })

  it('navigates back from detail to list, and from list to selection', async () => {
    const user = userEvent.setup()
    renderApp('/season/2026/week/1/participant/Steve')

    await user.click(screen.getByRole('button', { name: /back to participants/i }))
    expect(screen.getByTestId('location')).toHaveTextContent('/season/2026/week/1')

    await user.click(screen.getByRole('button', { name: /change season\/week/i }))
    expect(screen.getByTestId('location')).toHaveTextContent('/')
    expect(screen.getByRole('heading', { name: /football picks/i })).toBeInTheDocument()
  })

  it('navigates from the standings to the pick dashboard and back', async () => {
    const user = userEvent.setup()
    renderApp('/season/2026/week/1')

    await user.click(screen.getByRole('button', { name: /see how the pool picked/i }))
    expect(screen.getByTestId('location')).toHaveTextContent('/season/2026/week/1/dashboard')
    expect(screen.getByRole('heading', { level: 2, name: 'Patriots at Seahawks' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /back to standings/i }))
    expect(screen.getByTestId('location').textContent).toBe('/season/2026/week/1')
    expect(screen.getByRole('button', { name: /see how the pool picked/i })).toBeInTheDocument()
  })

  it('renders a deep-linked pick dashboard directly, as a bookmark would', () => {
    renderApp('/season/2026/week/1/dashboard')

    expect(screen.getByRole('heading', { level: 1, name: /season 2026.*week 1/i })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /week summary/i })).toBeInTheDocument()
  })

  it('walks dashboard -> game -> participant, then back through each screen', async () => {
    const user = userEvent.setup()
    renderApp('/season/2026/week/1/dashboard')

    await user.click(screen.getByRole('button', { name: 'See who picked Patriots at Seahawks' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/season/2026/week/1/game/game_01')
    expect(screen.getByRole('heading', { level: 1, name: 'Patriots @ Seahawks' })).toBeInTheDocument()
    expect(within(screen.getByTestId('pickers-away')).getByRole('button', { name: 'Greg' })).toBeInTheDocument()
    expect(within(screen.getByTestId('pickers-home')).getByRole('button', { name: /^Steve/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^Steve/ }))
    expect(screen.getByTestId('location')).toHaveTextContent('/season/2026/week/1/participant/Steve')

    await user.click(screen.getByRole('button', { name: 'Back to Patriots @ Seahawks' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/season/2026/week/1/game/game_01')

    await user.click(screen.getByRole('button', { name: 'Back to dashboard' }))
    expect(screen.getByTestId('location').textContent).toBe('/season/2026/week/1/dashboard')
  })

  it('opens a game from a participant page and returns to that participant', async () => {
    const user = userEvent.setup()
    renderApp('/season/2026/week/1/participant/Steve')

    await user.click(screen.getAllByRole('row')[1])
    expect(screen.getByTestId('location')).toHaveTextContent('/season/2026/week/1/game/game_01')

    await user.click(screen.getByRole('button', { name: 'Back to Steve' }))
    expect(screen.getByTestId('location').textContent).toBe('/season/2026/week/1/participant/Steve')
  })

  it('renders a deep-linked game page, with back falling through to the dashboard', async () => {
    const user = userEvent.setup()
    renderApp('/season/2026/week/1/game/game_01')

    expect(screen.getByRole('heading', { level: 1, name: 'Patriots @ Seahawks' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Back to dashboard' }))
    expect(screen.getByTestId('location').textContent).toBe('/season/2026/week/1/dashboard')
  })

  it('shows a fallback for a game that does not exist in the week', () => {
    renderApp('/season/2026/week/1/game/nope')
    expect(screen.getByText(/couldn't find that game/i)).toBeInTheDocument()
  })

  it('shows the not-found fallback for a dashboard of a season/week that does not exist', () => {
    renderApp('/season/1999/week/1/dashboard')
    expect(screen.getByText(/isn't available/i)).toBeInTheDocument()
  })

  it('shows a not-found fallback for a season/week that does not exist', () => {
    renderApp('/season/1999/week/1')
    expect(screen.getByText(/isn't available/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /start over/i })).toHaveAttribute('href', '/')
  })

  it("shows a fallback within the pool's context for a participant that does not exist", () => {
    renderApp('/season/2026/week/1/participant/Nobody')
    expect(screen.getByText(/couldn't find nobody/i)).toBeInTheDocument()
  })

  it('shows a generic not-found page for a URL that matches no route at all', () => {
    renderApp('/this/route/does/not/exist')
    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /football picks/i })).toHaveAttribute('href', '/')
  })
})
