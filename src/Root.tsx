import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useMemo } from 'react'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { AmbientBackground } from './components/AmbientBackground.tsx'

export function Root() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
  const theme = useMemo(() => createTheme({ palette: { mode: prefersDarkMode ? 'dark' : 'light' } }), [prefersDarkMode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AmbientBackground />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  )
}
