import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import GlobalStyles from '@mui/material/GlobalStyles'
import { keyframes } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { HOLD_MS, usePullToRefresh } from '../hooks/usePullToRefresh'
import type { PullPhase } from '../hooks/usePullToRefresh'

const fill = keyframes`from { transform: scaleX(0) } to { transform: scaleX(1) }`

const LABELS: Record<PullPhase, string> = {
  idle: '',
  pulling: 'Pull down and hold to refresh',
  armed: 'Keep holding to refresh',
  refreshing: 'Refreshing…',
}

interface Props {
  onRefresh?: () => void
}

/** Swipe-and-hold-to-reload gesture plus its floating indicator. Mount once, near the app root. */
export function PullToRefresh({ onRefresh }: Props) {
  const { phase, indicatorRef } = usePullToRefresh({ onRefresh })

  return (
    <>
      {/* Turn off the browser's own pull-to-refresh so it can't fight ours. */}
      <GlobalStyles styles={{ html: { overscrollBehaviorY: 'contain' } }} />
      <Box
        ref={indicatorRef}
        role="status"
        aria-live="polite"
        sx={(theme) => ({
          position: 'fixed',
          top: 'calc(env(safe-area-inset-top, 0px) + 8px)',
          left: '50%',
          zIndex: theme.zIndex.modal + 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 0.75,
          overflow: 'hidden',
          borderRadius: 999,
          bgcolor: 'background.paper',
          boxShadow: 3,
          pointerEvents: 'none',
          visibility: phase === 'idle' ? 'hidden' : 'visible',
          opacity: phase === 'idle' ? 0 : 1,
          transform: 'translateX(-50%) translateY(calc(var(--pull-offset, 0px) - 100%))',
          // Track the finger 1:1 while pulling; ease only the snap-back.
          transition: phase === 'idle' ? 'transform 150ms ease-out, opacity 150ms, visibility 150ms' : 'none',
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        })}
      >
        {phase === 'refreshing' ? <CircularProgress size={16} /> : <ArrowDownwardIcon fontSize="small" color="action" />}
        <Typography variant="body2">{LABELS[phase]}</Typography>
        {phase === 'armed' && (
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              left: 0,
              bottom: 0,
              height: 3,
              width: '100%',
              bgcolor: 'primary.main',
              transformOrigin: 'left',
              animation: `${fill} ${HOLD_MS}ms linear forwards`,
              '@media (prefers-reduced-motion: reduce)': { animation: 'none', transform: 'scaleX(1)' },
            }}
          />
        )}
      </Box>
    </>
  )
}
