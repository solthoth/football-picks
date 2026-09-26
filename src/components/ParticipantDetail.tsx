import AccessTimeIcon from '@mui/icons-material/AccessTime'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import CancelIcon from '@mui/icons-material/Cancel'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import SportsFootballIcon from '@mui/icons-material/SportsFootball'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import { alpha, useTheme } from '@mui/material/styles'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import type { ReactNode } from 'react'
import type { GameStatus, Pool } from '../data/types'
import { getPickOutcomes, summarizeOutcomes } from '../domain/standings'
import { determineWeekWinner } from '../domain/weekWinner'
import { TeamLogo } from './TeamLogo'
import { WinnerBadge } from './WinnerBadge'
import { WinnerCelebration } from './WinnerCelebration'

interface ParticipantDetailProps {
  pool: Pool
  participantName: string
  onBack: () => void
}

function statusLabel(status: GameStatus | 'unknown', awayScore: number | null, homeScore: number | null): string {
  switch (status) {
    case 'final':
      return `Final ${awayScore ?? '?'}-${homeScore ?? '?'}`
    case 'in_progress':
      return `In progress ${awayScore ?? '?'}-${homeScore ?? '?'}`
    case 'scheduled':
      return 'Not started'
    case 'unknown':
      return 'No result yet'
  }
}

function correctLabel(correct: boolean | null): string {
  if (correct === true) return 'Correct'
  if (correct === false) return 'Incorrect'
  return 'Pending'
}

function outcomeColor(correct: boolean | null): 'success' | 'error' | 'textSecondary' {
  if (correct === true) return 'success'
  if (correct === false) return 'error'
  return 'textSecondary'
}

function OutcomeIcon({ correct, fontSize = 'small' }: { correct: boolean | null; fontSize?: 'small' | 'medium' | 'large' | 'inherit' }) {
  if (correct === true) return <CheckCircleIcon color="success" fontSize={fontSize} />
  if (correct === false) return <CancelIcon color="error" fontSize={fontSize} />
  return <AccessTimeIcon color="disabled" fontSize={fontSize} />
}

type TileColor = 'success' | 'error' | 'grey' | 'primary'

interface SummaryTileProps {
  label: string
  value: number
  icon: ReactNode
  color: TileColor
  caption?: string
}

function SummaryTile({ label, value, icon, color, caption }: SummaryTileProps) {
  return (
    <Card
      variant="outlined"
      sx={(theme) => {
        const main = color === 'grey' ? theme.palette.text.secondary : theme.palette[color].main
        return {
          borderTop: 4,
          borderTopColor: main,
          bgcolor: alpha(main, 0.07),
          px: { xs: 1.5, md: 2.5 },
          py: { xs: 1.25, md: 2 },
        }
      }}
    >
      <Stack
        direction="row"
        spacing={0.75}
        sx={(theme) => ({
          alignItems: 'center',
          color: color === 'grey' ? 'text.secondary' : theme.palette[color].main,
          '& .MuiSvgIcon-root': { fontSize: { xs: 18, md: 24 } },
        })}
      >
        {icon}
        <Typography
          component="dt"
          sx={{ fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'inherit', fontSize: { xs: '0.75rem', md: '0.875rem' } }}
        >
          {label}
        </Typography>
      </Stack>
      <Typography
        component="dd"
        sx={{ m: 0, fontWeight: 700, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums', fontSize: { xs: '2.5rem', md: '3.5rem' } }}
      >
        {value}
      </Typography>
      {caption && (
        <Typography color="textSecondary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
          {caption}
        </Typography>
      )}
    </Card>
  )
}

export function ParticipantDetail({ pool, participantName, onBack }: ParticipantDetailProps) {
  const participant = pool.participants.find((p) => p.name === participantName)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  if (!participant) {
    return (
      <Container component="main" maxWidth="sm" sx={{ py: 4 }}>
        <Button startIcon={<ArrowBackIosNewIcon fontSize="small" />} onClick={onBack} sx={{ mb: 1, ml: -1 }}>
          Back
        </Button>
        <Typography>Couldn't find {participantName} in this week's pool.</Typography>
      </Container>
    )
  }

  const outcomes = getPickOutcomes(pool, participant)
  const summary = summarizeOutcomes(participant.name, outcomes)
  const { winnerNames } = determineWeekWinner(pool)
  const isWinner = winnerNames.includes(participant.name)
  const gamesCaption = `of ${summary.totalGames} games`

  return (
    <Container component="main" maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <WinnerCelebration participantName={participant.name} isWinner={isWinner} />

      <Button startIcon={<ArrowBackIosNewIcon fontSize="small" />} onClick={onBack} sx={{ mb: 1, ml: -1 }}>
        Back to participants
      </Button>

      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700, fontSize: { xs: '2rem', md: '3rem' } }}>
          {participant.name}
        </Typography>
        {isWinner && <WinnerBadge />}
      </Stack>
      <Typography color="textSecondary" gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
        Season {pool.season} &middot; Week {pool.week}
      </Typography>

      <Box
        component="dl"
        role="group"
        aria-label="Pick summary"
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: `repeat(${participant.tieBreakerTotalScore !== null ? 4 : 3}, 1fr)` },
          gap: { xs: 1.5, md: 2 },
          m: 0,
          mt: 3,
        }}
      >
        <SummaryTile label="Correct" value={summary.correct} icon={<CheckCircleIcon />} color="success" caption={gamesCaption} />
        <SummaryTile label="Incorrect" value={summary.incorrect} icon={<CancelIcon />} color="error" caption={gamesCaption} />
        <SummaryTile label="Pending" value={summary.pending} icon={<AccessTimeIcon />} color="grey" caption={gamesCaption} />
        {participant.tieBreakerTotalScore !== null && (
          <SummaryTile
            label="Tiebreaker guess"
            value={participant.tieBreakerTotalScore}
            icon={<SportsFootballIcon />}
            color="primary"
            caption="combined score"
          />
        )}
      </Box>

      {isMobile ? (
        <Stack spacing={1.5} sx={{ mt: 3 }}>
          {outcomes.map((outcome) => {
            const result = pool.results[outcome.gameId]
            const color = outcomeColor(outcome.correct)
            return (
              <Card
                key={outcome.gameId}
                variant="outlined"
                sx={{ borderLeftWidth: 6, borderLeftColor: `${color}.main`, p: 2 }}
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
                  <TeamLogo team={outcome.away} size={24} />
                  <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
                    {outcome.away} @ {outcome.home}
                  </Typography>
                  <TeamLogo team={outcome.home} size={24} />
                </Stack>

                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                  <TeamLogo team={outcome.pickedTeam} size={56} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="overline" color="textSecondary" sx={{ lineHeight: 1.4, display: 'block' }}>
                      Pick
                    </Typography>
                    <Typography component="p" noWrap sx={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.2 }}>
                      {outcome.pickedTeam ?? '—'}
                    </Typography>
                  </Box>
                  <Stack sx={{ alignItems: 'center', flexShrink: 0, minWidth: 72 }}>
                    <OutcomeIcon correct={outcome.correct} fontSize="large" />
                    <Typography variant="body2" color={outcomeColor(outcome.correct)} sx={{ fontWeight: 700, mt: 0.25 }}>
                      {correctLabel(outcome.correct)}
                    </Typography>
                  </Stack>
                </Stack>

                <Typography variant="body2" color="textSecondary" sx={{ mt: 1.5 }}>
                  {statusLabel(outcome.status, result?.awayScore ?? null, result?.homeScore ?? null)}
                </Typography>
              </Card>
            )
          })}
        </Stack>
      ) : (
        <TableContainer sx={{ mt: 4 }}>
          <Table sx={{ '& .MuiTableCell-root': { fontSize: '1.125rem', py: 2, px: 2.5 } }}>
            <TableHead>
              <TableRow sx={{ '& .MuiTableCell-root': { fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.secondary' } }}>
                <TableCell>Matchup</TableCell>
                <TableCell sx={{ bgcolor: 'action.hover' }}>Pick</TableCell>
                <TableCell>Result</TableCell>
                <TableCell>Outcome</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {outcomes.map((outcome) => {
                const result = pool.results[outcome.gameId]
                return (
                  <TableRow key={outcome.gameId} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'nowrap' }}>
                        <TeamLogo team={outcome.away} size={36} />
                        <Typography component="span" color="textSecondary" sx={{ whiteSpace: 'nowrap', fontSize: 'inherit' }}>
                          {outcome.away} @ {outcome.home}
                        </Typography>
                        <TeamLogo team={outcome.home} size={36} />
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ bgcolor: 'action.hover' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <TeamLogo team={outcome.pickedTeam} size={48} />
                        <Typography component="span" sx={{ fontWeight: 700, fontSize: '1.375rem' }}>
                          {outcome.pickedTeam ?? '—'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{statusLabel(outcome.status, result?.awayScore ?? null, result?.homeScore ?? null)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <OutcomeIcon correct={outcome.correct} fontSize="medium" />
                        <Typography color={outcomeColor(outcome.correct)} sx={{ fontWeight: 700, fontSize: 'inherit' }}>
                          {correctLabel(outcome.correct)}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  )
}
