import Box from '@mui/material/Box'
import { alpha } from '@mui/material/styles'

export function AmbientBackground() {
  return (
    <Box aria-hidden sx={{ position: 'fixed', inset: 0, zIndex: -1, overflow: 'hidden', pointerEvents: 'none' }}>
      <Box
        sx={(theme) => ({
          position: 'absolute',
          width: 480,
          height: 480,
          borderRadius: '50%',
          top: '-12%',
          left: '50%',
          transform: 'translateX(-25%)',
          bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.16 : 0.1),
          filter: 'blur(100px)',
        })}
      />
      <Box
        sx={(theme) => ({
          position: 'absolute',
          width: 380,
          height: 380,
          borderRadius: '50%',
          bottom: '-10%',
          left: '50%',
          transform: 'translateX(-60%)',
          bgcolor: alpha(theme.palette.warning.main, theme.palette.mode === 'dark' ? 0.12 : 0.08),
          filter: 'blur(100px)',
        })}
      />
    </Box>
  )
}
