import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import { Link as RouterLink } from 'react-router-dom'

interface WeekPagerProps {
  season: number
  week: number
  /** Every week that exists in this season (any order). Gaps are skipped. */
  weeks: number[]
}

/** Links to the previous and next weeks that exist, so weeks can be compared without a trip back to the picker. */
export function WeekPager({ season, week, weeks }: WeekPagerProps) {
  const previous = weeks.filter((w) => w < week).sort((a, b) => b - a)[0]
  const next = weeks.filter((w) => w > week).sort((a, b) => a - b)[0]
  if (previous === undefined && next === undefined) return null

  const path = (w: number) => `/season/${season}/week/${w}`

  return (
    <Stack component="nav" aria-label="Switch week" direction="row" sx={{ justifyContent: 'space-between', mt: 2 }}>
      {previous !== undefined ? (
        <Button
          component={RouterLink}
          to={path(previous)}
          rel="prev"
          aria-label={`Week ${previous} (previous week)`}
          variant="outlined"
          size="small"
          startIcon={<ChevronLeftIcon />}
        >
          Week {previous}
        </Button>
      ) : (
        <span />
      )}
      {next !== undefined && (
        <Button
          component={RouterLink}
          to={path(next)}
          rel="next"
          aria-label={`Week ${next} (next week)`}
          variant="outlined"
          size="small"
          endIcon={<ChevronRightIcon />}
          sx={{ ml: 'auto' }}
        >
          Week {next}
        </Button>
      )}
    </Stack>
  )
}
