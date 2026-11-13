import { ThemeProvider } from '@mui/material/styles'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { createAppTheme } from '../theme'
import type { ThemeMode } from '../theme'

/** Renders `ui` under the same theme the app uses, so colour decisions made through the theme are what the test sees. */
export function renderWithTheme(ui: ReactElement, mode: ThemeMode = 'light') {
  return render(<ThemeProvider theme={createAppTheme(mode)}>{ui}</ThemeProvider>)
}
