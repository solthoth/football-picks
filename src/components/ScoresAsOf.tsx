import RefreshIcon from '@mui/icons-material/Refresh'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { scoresAsOfLabel } from '../data/liveScores'
import type { Pool } from '../data/types'
import { refreshLiveScores, useLiveScoresStatus } from '../data/useLivePool'

/**
 * "Scores as of Sun, 4:35 PM PST", with a refresh button beside it while games are unfinished. Scores poll every
 * minute and pull-to-refresh only exists on touch screens, so this is the way to check now with a mouse.
 */
export function ScoresAsOf({ pool }: { pool: Pool }) {
  const label = scoresAsOfLabel(pool)
  const { canRefresh, refreshing } = useLiveScoresStatus()
  if (!label && !canRefresh) return null

  return (
    <Stack direction="row" sx={{ alignItems: 'center', columnGap: 0.5 }}>
      {label && (
        <Typography variant="caption" color="textSecondary" component="p">
          {label}
        </Typography>
      )}
      {canRefresh && (
        <IconButton
          aria-label={refreshing ? 'Refreshing scores' : 'Refresh scores'}
          disabled={refreshing}
          onClick={refreshLiveScores}
          size="small"
          // A 44px target, pulled back with negative margins so it does not make the caption row taller.
          sx={{ width: 44, height: 44, my: -1.25 }}
        >
          {refreshing ? <CircularProgress size={18} /> : <RefreshIcon fontSize="small" />}
        </IconButton>
      )}
    </Stack>
  )
}
