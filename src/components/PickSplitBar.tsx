import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { Side } from '../domain/pickDistribution'

interface PickSplitBarProps {
  away: string
  home: string
  awayCount: number
  homeCount: number
  picked: number
  awayPct: number | null
  homePct: number | null
  winnerSide: Side | null
}

interface SegmentProps {
  side: Side
  pct: number
  color: 'primary.main' | 'secondary.main'
  dimmed: boolean
}

function Segment({ side, pct, color, dimmed }: SegmentProps) {
  // A 0% side renders nothing at all (not a sliver); a 100% side fills the track.
  if (pct <= 0) return null

  return (
    <Box
      data-testid={`split-segment-${side}`}
      sx={{
        flex: `0 1 ${pct}%`,
        minWidth: 0,
        bgcolor: color,
        opacity: dimmed ? 0.45 : 1,
      }}
    />
  )
}

export function PickSplitBar({ away, home, awayCount, homeCount, picked, awayPct, homePct, winnerSide }: PickSplitBarProps) {
  if (picked === 0 || awayPct === null || homePct === null) {
    return (
      <>
        <Box sx={{ height: 12, borderRadius: 6, border: 1, borderStyle: 'dashed', borderColor: 'divider', boxSizing: 'border-box' }} />
        <Typography variant="caption" color="textSecondary" component="p" sx={{ mt: 0.75 }}>
          No picks for this game
        </Typography>
      </>
    )
  }

  return (
    <Box
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={awayPct}
      aria-label={`Pick split for ${away} at ${home}`}
      aria-valuetext={`${away} ${awayCount} of ${picked} (${awayPct}%), ${home} ${homeCount} of ${picked} (${homePct}%)`}
      sx={{ display: 'flex', gap: '2px', height: 12, borderRadius: 6, overflow: 'hidden', bgcolor: 'action.hover' }}
    >
      <Segment side="away" pct={awayPct} color="primary.main" dimmed={winnerSide === 'home'} />
      <Segment side="home" pct={homePct} color="secondary.main" dimmed={winnerSide === 'away'} />
    </Box>
  )
}
