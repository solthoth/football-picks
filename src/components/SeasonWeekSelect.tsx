import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useMemo, useState } from 'react'
import type { Pool } from '../data/types'

interface SeasonWeekSelectProps {
  pools: Pool[]
  onSelect: (season: number, week: number) => void
}

export function SeasonWeekSelect({ pools, onSelect }: SeasonWeekSelectProps) {
  const seasons = useMemo(() => [...new Set(pools.map((p) => p.season))].sort((a, b) => b - a), [pools])
  const [season, setSeason] = useState<number | undefined>(seasons[0])

  const weeks = useMemo(
    () =>
      pools
        .filter((p) => p.season === season)
        .map((p) => p.week)
        .sort((a, b) => a - b),
    [pools, season],
  )
  const [week, setWeek] = useState<number | undefined>(weeks[0])

  if (pools.length === 0) {
    return (
      <Container component="main" maxWidth="sm" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Football Picks
        </Typography>
        <Typography color="textSecondary">No pool data is available yet.</Typography>
      </Container>
    )
  }

  function handleSeasonChange(value: string) {
    const nextSeason = Number(value)
    setSeason(nextSeason)
    const nextWeeks = pools
      .filter((p) => p.season === nextSeason)
      .map((p) => p.week)
      .sort((a, b) => a - b)
    setWeek(nextWeeks[0])
  }

  return (
    <Container component="main" maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Football Picks
      </Typography>
      <Typography color="textSecondary">Select a season and week to see how everyone did.</Typography>

      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault()
          if (season !== undefined && week !== undefined) onSelect(season, week)
        }}
        sx={{ mt: 3 }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
          <TextField
            select
            id="season-select"
            label="Season"
            value={season ?? ''}
            onChange={(e) => handleSeasonChange(e.target.value)}
            slotProps={{ select: { native: true } }}
            sx={{ minWidth: 140 }}
          >
            {seasons.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </TextField>

          <TextField
            select
            id="week-select"
            label="Week"
            value={week ?? ''}
            onChange={(e) => setWeek(Number(e.target.value))}
            slotProps={{ select: { native: true } }}
            sx={{ minWidth: 140 }}
          >
            {weeks.map((w) => (
              <option key={w} value={w}>
                Week {w}
              </option>
            ))}
          </TextField>

          <Button type="submit" variant="contained" size="large" sx={{ height: 56 }}>
            View Week
          </Button>
        </Stack>
      </Box>
    </Container>
  )
}
