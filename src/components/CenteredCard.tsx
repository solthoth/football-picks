import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import type { ReactNode } from 'react'

interface CenteredCardProps {
  children: ReactNode
}

export function CenteredCard({ children }: CenteredCardProps) {
  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2, py: 6 }}>
      <Paper
        component="main"
        variant="outlined"
        sx={{ maxWidth: 420, width: '100%', p: 4, borderRadius: 4, textAlign: 'center' }}
      >
        {children}
      </Paper>
    </Box>
  )
}
