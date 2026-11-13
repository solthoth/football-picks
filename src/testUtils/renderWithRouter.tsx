import { ThemeProvider } from '@mui/material/styles'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { useEffect } from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { createAppTheme } from '../theme'
import type { ThemeMode } from '../theme'

interface Options {
  initialEntries?: string[]
  initialIndex?: number
  mode?: ThemeMode
}

/**
 * Renders `ui` under the app theme inside a MemoryRouter and exposes where it navigated:
 * - `visited`: every pathname the router has been at, in order (so a test can assert "navigated exactly once").
 * - `location` / `locationState` test ids in the DOM for the current path and router state.
 */
export function renderWithRouter(ui: ReactElement, { initialEntries = ['/'], initialIndex, mode = 'light' }: Options = {}) {
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
    <ThemeProvider theme={createAppTheme(mode)}>
      <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
        {ui}
        <Probe />
      </MemoryRouter>
    </ThemeProvider>,
  )
  return { ...result, visited }
}
