import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import SavingsIcon from '@mui/icons-material/Savings'
import SportsFootballIcon from '@mui/icons-material/SportsFootball'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import { alpha } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, WheelEvent } from 'react'
import type { Pool } from '../data/types'
import { CenteredCard } from './CenteredCard'

interface SeasonWeekSelectProps {
  pools: Pool[]
  onSelect: (season: number, week: number) => void
}

function weeksForSeason(pools: Pool[], season: number | undefined): number[] {
  return pools
    .filter((p) => p.season === season)
    .map((p) => p.week)
    .sort((a, b) => a - b)
}

function EmptyState() {
  return (
    <CenteredCard>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 800 }}>
        Football Picks
      </Typography>
      <Typography color="textSecondary">No pool data is available yet.</Typography>
    </CenteredCard>
  )
}

export function SeasonWeekSelect({ pools, onSelect }: SeasonWeekSelectProps) {
  const seasons = useMemo(() => [...new Set(pools.map((p) => p.season))].sort((a, b) => b - a), [pools])
  const [season, setSeason] = useState<number | undefined>(seasons[0])

  const weeks = useMemo(() => weeksForSeason(pools, season), [pools, season])
  const [week, setWeek] = useState<number | undefined>(weeks[weeks.length - 1])

  const itemRefs = useRef(new Map<number, HTMLDivElement>())

  useEffect(() => {
    if (week === undefined) return
    const item = itemRefs.current.get(week)
    const rail = item?.parentElement
    if (!item || !rail) return
    const target = item.offsetLeft - rail.clientWidth / 2 + item.offsetWidth / 2
    rail.scrollTo?.({ left: target })
  }, [season, week])

  const selectedPool = pools.find((p) => p.season === season && p.week === week)

  if (pools.length === 0) return <EmptyState />

  function handleSeasonSelect(nextSeason: number) {
    if (nextSeason === season) return
    setSeason(nextSeason)
    const nextWeeks = weeksForSeason(pools, nextSeason)
    setWeek(nextWeeks[nextWeeks.length - 1])
  }

  function handleSelectWeek(w: number) {
    setWeek(w)
    if (season !== undefined) onSelect(season, w)
  }

  function moveFocus(target: number | undefined) {
    if (target === undefined) return
    itemRefs.current.get(target)?.focus()
  }

  function handleItemKeyDown(e: KeyboardEvent<HTMLDivElement>, w: number) {
    const index = weeks.indexOf(w)
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        handleSelectWeek(w)
        return
      case 'ArrowRight':
        e.preventDefault()
        moveFocus(weeks[Math.min(index + 1, weeks.length - 1)])
        return
      case 'ArrowLeft':
        e.preventDefault()
        moveFocus(weeks[Math.max(index - 1, 0)])
        return
      case 'Home':
        e.preventDefault()
        moveFocus(weeks[0])
        return
      case 'End':
        e.preventDefault()
        moveFocus(weeks[weeks.length - 1])
    }
  }

  function handleWheel(e: WheelEvent<HTMLDivElement>) {
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
    e.currentTarget.scrollLeft += e.deltaY
  }

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2, py: 6 }}>
      <Paper component="main" variant="outlined" sx={{ width: '100%', maxWidth: 480, p: { xs: 3, sm: 5 }, borderRadius: 4 }}>
        <Stack spacing={0.75} sx={{ alignItems: 'center', textAlign: 'center', mb: 4 }}>
          <Box
            sx={(theme) => ({
              width: 60,
              height: 60,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              mb: 0.5,
            })}
          >
            <SportsFootballIcon color="primary" sx={{ fontSize: 32 }} />
          </Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
            Football Picks
          </Typography>
          <Typography color="textSecondary">Tap a week to see picks and standings.</Typography>
        </Stack>

        {seasons.length > 1 && (
          <Box sx={{ mb: 3 }}>
            <Typography
              id="season-select-label"
              variant="overline"
              color="textSecondary"
              component="p"
              sx={{ fontWeight: 700, letterSpacing: '0.08em', mb: 1, textAlign: 'center' }}
            >
              Season
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              role="group"
              aria-labelledby="season-select-label"
              sx={{ flexWrap: 'wrap', justifyContent: 'center' }}
            >
              {seasons.map((s) => (
                <Chip
                  key={s}
                  label={s}
                  clickable
                  onClick={() => handleSeasonSelect(s)}
                  color={s === season ? 'primary' : 'default'}
                  variant={s === season ? 'filled' : 'outlined'}
                  sx={{ height: 40, px: 0.5, fontSize: '0.95rem', fontWeight: 700 }}
                />
              ))}
            </Stack>
          </Box>
        )}

        <Typography
          id="week-select-label"
          variant="overline"
          color="textSecondary"
          component="p"
          sx={{ fontWeight: 700, letterSpacing: '0.08em', mb: 1, textAlign: 'center' }}
        >
          Week
        </Typography>

        <Box
          role="listbox"
          aria-labelledby="week-select-label"
          aria-orientation="horizontal"
          onWheel={handleWheel}
          sx={{
            display: 'flex',
            gap: 1.5,
            overflowX: 'auto',
            scrollSnapType: 'x proximity',
            py: 0.5,
            px: 0.5,
            mx: -0.5,
            justifyContent: weeks.length <= 4 ? 'center' : 'flex-start',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            ...(weeks.length > 4 && {
              maskImage: 'linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)',
            }),
          }}
        >
          {weeks.map((w) => {
            const isSelected = w === week
            return (
              <Box
                key={w}
                ref={(el: HTMLDivElement | null) => {
                  if (el) itemRefs.current.set(w, el)
                  else itemRefs.current.delete(w)
                }}
                role="option"
                aria-selected={isSelected}
                aria-label={`Week ${w}`}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => handleSelectWeek(w)}
                onKeyDown={(e) => handleItemKeyDown(e, w)}
                sx={(theme) => ({
                  flex: '0 0 auto',
                  scrollSnapAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.25,
                  width: 76,
                  height: 88,
                  borderRadius: 3,
                  cursor: 'pointer',
                  userSelect: 'none',
                  border: '2px solid',
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.12) : 'background.paper',
                  boxShadow: isSelected ? `0 4px 14px ${alpha(theme.palette.primary.main, 0.35)}` : 'none',
                  transform: isSelected ? 'translateY(-2px)' : 'none',
                  transition: 'transform 150ms ease, box-shadow 150ms ease, background-color 150ms ease, border-color 150ms ease',
                  '&:hover': { borderColor: 'primary.main', transform: 'translateY(-2px)' },
                  '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 3 },
                })}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontSize: '0.65rem',
                    color: isSelected ? 'primary.main' : 'text.secondary',
                  }}
                >
                  Week
                </Typography>
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: '1.75rem',
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                    color: isSelected ? 'primary.main' : 'text.primary',
                  }}
                >
                  {w}
                </Typography>
              </Box>
            )
          })}
        </Box>

        {selectedPool && (
          <Stack direction="row" spacing={1} sx={{ mt: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Chip
              icon={<PeopleAltIcon />}
              label={`${selectedPool.participants.length} ${selectedPool.participants.length === 1 ? 'player' : 'players'}`}
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
            {selectedPool.pot !== undefined && (
              <Chip icon={<SavingsIcon />} label={`$${selectedPool.pot} pot`} variant="outlined" sx={{ fontWeight: 600 }} />
            )}
          </Stack>
        )}
      </Paper>
    </Box>
  )
}
