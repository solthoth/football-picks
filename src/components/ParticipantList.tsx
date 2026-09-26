import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
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
import type { SxProps, Theme } from '@mui/material/styles'
import { scoresAsOfLabel } from '../data/liveScores'
import type { Pool } from '../data/types'
import { buildLeaderboard } from '../domain/standings'
import { determineWeekWinner } from '../domain/weekWinner'
import { WinnerBadge } from './WinnerBadge'

interface ParticipantListProps {
  pool: Pool
  onSelect: (participantName: string) => void
  onBack: () => void
}

function rankAvatarSx(rank: number): SxProps<Theme> {
  if (rank === 1) return { bgcolor: 'warning.main', color: 'warning.contrastText' }
  if (rank === 2) return { bgcolor: 'grey.400', color: 'common.black' }
  if (rank === 3) return { bgcolor: '#cd7f32', color: 'common.white' }
  return { bgcolor: 'grey.300', color: 'common.black' }
}

export function ParticipantList({ pool, onSelect, onBack }: ParticipantListProps) {
  const leaderboard = buildLeaderboard(pool)
  const { winnerNames } = determineWeekWinner(pool)
  const scoresAsOf = scoresAsOfLabel(pool)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Container component="main" maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      <Button startIcon={<ArrowBackIosNewIcon fontSize="small" />} onClick={onBack} sx={{ mb: 1, ml: -1 }}>
        Change season/week
      </Button>

      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: '2rem', md: '3rem' } }}>
        Season {pool.season} &middot; Week {pool.week}
      </Typography>
      <Typography color="textSecondary" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>Select a participant to see their picks.</Typography>
      {scoresAsOf && (
        <Typography variant="caption" color="textSecondary" component="p">
          {scoresAsOf}
        </Typography>
      )}

      {isMobile ? (
        <Stack spacing={1.5} sx={{ mt: 2 }}>
          {leaderboard.map((entry) => (
            <Card key={entry.name} variant="outlined">
              <CardActionArea
                onClick={() => onSelect(entry.name)}
                sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, minHeight: 68 }}
              >
                <Avatar sx={{ width: 40, height: 40, fontSize: 18, fontWeight: 700, flexShrink: 0, ...rankAvatarSx(entry.rank) }}>
                  {entry.rank}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography noWrap sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
                    {entry.name}
                  </Typography>
                  {winnerNames.includes(entry.name) && <WinnerBadge />}
                </Box>
                <Chip label={`${entry.correct} / ${entry.totalGames}`} sx={{ flexShrink: 0, fontWeight: 700, fontSize: '1rem', height: 32 }} />
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      ) : (
        <TableContainer sx={{ mt: 4 }}>
          <Table sx={{ '& .MuiTableCell-root': { fontSize: '1.25rem', py: 2, px: 2.5 } }}>
            <TableHead>
              <TableRow sx={{ '& .MuiTableCell-root': { fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.secondary' } }}>
                <TableCell>Rank</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Correct</TableCell>
                <TableCell>Pending</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaderboard.map((entry) => (
                <TableRow
                  key={entry.name}
                  hover
                  onClick={() => onSelect(entry.name)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelect(entry.name)
                    }
                  }}
                  sx={{ cursor: 'pointer', '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 } }}
                >
                  <TableCell>
                    <Avatar sx={{ width: 44, height: 44, fontSize: 20, fontWeight: 700, ...rankAvatarSx(entry.rank) }}>
                      {entry.rank}
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Typography sx={{ fontWeight: 700, color: 'primary.main', fontSize: 'inherit' }}>{entry.name}</Typography>
                      {winnerNames.includes(entry.name) && <WinnerBadge />}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip label={`${entry.correct} / ${entry.totalGames}`} sx={{ fontWeight: 700, fontSize: '1.125rem', height: 36 }} />
                  </TableCell>
                  <TableCell>{entry.pending} pending</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  )
}
