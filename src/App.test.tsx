import { render, screen } from '@testing-library/react'
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

    await user.click(screen.getByRole('button', { name: /view week/i }))
    expect(screen.getByTestId('location')).toHaveTextContent('/season/2026/week/1')
    expect(screen.getByRole('heading', { name: /season 2026.*week 1/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Steve' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/season/2026/week/1/participant/Steve')
    expect(screen.getByRole('heading', { name: 'Steve' })).toBeInTheDocument()
  })

  it('renders a deep-linked participant detail page directly, as a bookmark would', () => {
    renderApp('/season/2026/week/1/participant/Steve')

    expect(screen.getByRole('heading', { name: 'Steve' })).toBeInTheDocument()
    expect(screen.getByText(/1 correct, 0 incorrect, 0 pending/i)).toBeInTheDocument()
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

  it('shows a not-found fallback for a season/week that does not exist', () => {
    renderApp('/season/1999/week/1')
    expect(screen.getByText(/isn't available/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /start over/i })).toHaveAttribute('href', '/')
  })

  it("shows a fallback within the pool's context for a participant that does not exist", () => {
    renderApp('/season/2026/week/1/participant/Nobody')
    expect(screen.getByText(/couldn't find nobody/i)).toBeInTheDocument()
  })
})
