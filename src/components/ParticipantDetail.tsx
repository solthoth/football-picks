import AccessTimeIcon from '@mui/icons-material/AccessTime'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import CancelIcon from '@mui/icons-material/Cancel'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import { useTheme } from '@mui/material/styles'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import type { GameStatus, Pool } from '../data/types'
import { getPickOutcomes, summarizeOutcomes } from '../domain/standings'
import { determineWeekWinner } from '../domain/weekWinner'
import { WinnerBadge } from './WinnerBadge'

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

function OutcomeIcon({ correct, fontSize = 'small' }: { correct: boolean | null; fontSize?: 'small' | 'inherit' }) {
  if (correct === true) return <CheckCircleIcon color="success" fontSize={fontSize} />
  if (correct === false) return <CancelIcon color="error" fontSize={fontSize} />
  return <AccessTimeIcon color="disabled" fontSize={fontSize} />
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

  return (
    <Container component="main" maxWidth="sm" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBackIosNewIcon fontSize="small" />} onClick={onBack} sx={{ mb: 1, ml: -1 }}>
        Back to participants
      </Button>

      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="h4" component="h1">
          {participant.name}
        </Typography>
        {isWinner && <WinnerBadge />}
      </Stack>
      <Typography color="textSecondary" gutterBottom>
        Season {pool.season} &middot; Week {pool.week}
      </Typography>

      <Stack direction="row" spacing={1} role="group" aria-label="Pick summary" sx={{ flexWrap: 'wrap', mt: 2 }}>
        <Chip icon={<CheckCircleIcon />} label={`${summary.correct} Correct`} color="success" variant="outlined" />
        <Chip icon={<CancelIcon />} label={`${summary.incorrect} Incorrect`} color="error" variant="outlined" />
        <Chip icon={<AccessTimeIcon />} label={`${summary.pending} Pending`} variant="outlined" />
      </Stack>
      <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
        out of {summary.totalGames} games
      </Typography>

      {participant.tieBreakerTotalScore !== null && (
        <Chip
          label={`Tiebreaker guess (combined score): ${participant.tieBreakerTotalScore}`}
          variant="outlined"
          sx={{ mt: 2 }}
        />
      )}

      {isMobile ? (
        <Stack spacing={1.5} sx={{ mt: 3 }}>
          {outcomes.map((outcome) => {
            const result = pool.results[outcome.gameId]
            return (
              <Card
                key={outcome.gameId}
                variant="outlined"
                sx={{ borderLeftWidth: 4, borderLeftColor: `${outcomeColor(outcome.correct)}.main`, p: 2 }}
              >
                <Typography sx={{ fontWeight: 600, mb: 1 }}>
                  {outcome.away} @ {outcome.home}
                </Typography>
                <Stack spacing={0.5}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="textSecondary">
                      PICK
                    </Typography>
                    <Typography variant="body2">{outcome.pickedTeam ?? '—'}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="textSecondary">
                      RESULT
                    </Typography>
                    <Typography variant="body2">
                      {statusLabel(outcome.status, result?.awayScore ?? null, result?.homeScore ?? null)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="textSecondary">
                      OUTCOME
                    </Typography>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                      <OutcomeIcon correct={outcome.correct} />
                      <Typography variant="body2" color={outcomeColor(outcome.correct)} sx={{ fontWeight: 600 }}>
                        {correctLabel(outcome.correct)}
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>
              </Card>
            )
          })}
        </Stack>
      ) : (
        <TableContainer sx={{ mt: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Matchup</TableCell>
                <TableCell>Pick</TableCell>
                <TableCell>Result</TableCell>
                <TableCell>Outcome</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {outcomes.map((outcome) => {
                const result = pool.results[outcome.gameId]
                return (
                  <TableRow key={outcome.gameId} hover>
                    <TableCell>
                      {outcome.away} @ {outcome.home}
                    </TableCell>
                    <TableCell>{outcome.pickedTeam ?? '—'}</TableCell>
                    <TableCell>{statusLabel(outcome.status, result?.awayScore ?? null, result?.homeScore ?? null)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <OutcomeIcon correct={outcome.correct} />
                        <Typography variant="body2" color={outcomeColor(outcome.correct)} sx={{ fontWeight: 600 }}>
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
