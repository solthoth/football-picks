import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { useEffect } from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'

interface Options {
  initialEntries?: string[]
  initialIndex?: number
}

/**
 * Renders `ui` inside a MemoryRouter and exposes where it navigated:
 * - `visited`: every pathname the router has been at, in order (so a test can assert "navigated exactly once").
 * - `location` / `locationState` test ids in the DOM for the current path and router state.
 */
export function renderWithRouter(ui: ReactElement, { initialEntries = ['/'], initialIndex }: Options = {}) {
  const visited: string[] = []

  function Probe() {
    const location = useLocation()
    useEffect(() => {
      visited.push(location.pathname)
    }, [location])
    return (
      <>
        <div data-testid="location">{location.pathname}</div>
        <div data-testid="location-state">{JSON.stringify(location.state)}</div>
      </>
    )
  }

  const result = render(
    <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
      {ui}
      <Probe />
    </MemoryRouter>,
  )
  return { ...result, visited }
}
