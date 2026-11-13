import Box from '@mui/material/Box'

interface SeasonWeekLabelProps {
  season: number
  week: number
}

const noBreak = { whiteSpace: 'nowrap' } as const

/**
 * "Season 2026 · Week 10", wrapped so a narrow screen breaks between the two halves instead of
 * stranding the week number on its own line. Plain spaces are kept (unlike a non-breaking space)
 * so the text still copies, searches and reads normally.
 */
export function SeasonWeekLabel({ season, week }: SeasonWeekLabelProps) {
  return (
    <>
      <Box component="span" sx={noBreak}>
        Season {season}
      </Box>{' '}
      &middot;{' '}
      <Box component="span" sx={noBreak}>
        Week {week}
      </Box>
    </>
  )
}
