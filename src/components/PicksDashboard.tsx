import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { useMemo, useState } from 'react'
import { scoresAsOfLabel } from '../data/liveScores'
import type { Pool } from '../data/types'
import { computePickDistribution, sortByDivided } from '../domain/pickDistribution'
import { GamePickCard } from './GamePickCard'
import { PickSummaryStrip } from './PickSummaryStrip'
import { ShareButton } from './ShareButton'

interface PicksDashboardProps {
  pool: Pool
  onBack: () => void
  onSelectGame?: (gameId: string) => void
}

type SortMode = 'schedule' | 'divided'

export function PicksDashboard({ pool, onBack, onSelectGame }: PicksDashboardProps) {
  const [sort, setSort] = useState<SortMode>('schedule')
  const distribution = useMemo(() => computePickDistribution(pool), [pool])
  const scoresAsOf = scoresAsOfLabel(pool)
  const shareUrl = `${window.location.origin}/season/${pool.season}/week/${pool.week}/dashboard`

  const hasGames = distribution.games.length > 0
  const hasParticipants = distribution.participantCount > 0
  const games = sort === 'divided' ? sortByDivided(distribution.games) : distribution.games
  const showStrip = distribution.participantCount >= 2 && distribution.summary.mostDivided !== null

  return (
    <Container component="main" maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 4 }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Button startIcon={<ArrowBackIosNewIcon fontSize="small" />} onClick={onBack} sx={{ ml: -1 }}>
            Back to standings
          </Button>
          <ShareButton
            url={shareUrl}
            title={`Season ${pool.season} Week ${pool.week} pick split`}
            text={`See how the pool picked in Season ${pool.season}, Week ${pool.week}`}
          />
        </Stack>

        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: '2rem', md: '3rem' } }}>
          Season {pool.season} &middot; Week {pool.week}
        </Typography>
        <Typography color="textSecondary" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
          How the pool picked every game.
        </Typography>
        {scoresAsOf && (
          <Typography variant="caption" color="textSecondary" component="p">
            {scoresAsOf}
          </Typography>
        )}

        {!hasGames ? (
          <Typography color="textSecondary" sx={{ mt: 3 }}>
            No games are listed for this week yet.
          </Typography>
        ) : !hasParticipants ? (
          <Typography color="textSecondary" sx={{ mt: 3 }}>
            No picks have been submitted for this week yet.
          </Typography>
        ) : (
          <>
            {showStrip && (
              <PickSummaryStrip summary={distribution.summary} participantCount={distribution.participantCount} />
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, mb: 1.5 }}>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={sort}
                onChange={(_, next: SortMode | null) => {
                  if (next) setSort(next)
                }}
                aria-label="Sort games"
              >
                <ToggleButton value="schedule" sx={{ minHeight: 40 }}>
                  Schedule
                </ToggleButton>
                <ToggleButton value="divided" sx={{ minHeight: 40 }}>
                  Most divided
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box
              component="ol"
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: { xs: 1.5, md: 2 },
                listStyle: 'none',
                m: 0,
                p: 0,
              }}
            >
              {games.map((game) => (
                <Box component="li" key={game.gameId} sx={{ minWidth: 0 }}>
                  <GamePickCard game={game} onSelect={onSelectGame} />
                </Box>
              ))}
            </Box>
          </>
        )}
      </Paper>
    </Container>
  )
}
