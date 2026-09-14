import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import Avatar from '@mui/material/Avatar'
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
import type { SxProps, Theme } from '@mui/material/styles'
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
  return { bgcolor: 'grey.200', color: 'text.secondary' }
}

export function ParticipantList({ pool, onSelect, onBack }: ParticipantListProps) {
  const leaderboard = buildLeaderboard(pool)
  const { winnerName } = determineWeekWinner(pool)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Container component="main" maxWidth="sm" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBackIosNewIcon fontSize="small" />} onClick={onBack} sx={{ mb: 1, ml: -1 }}>
        Change season/week
      </Button>

      <Typography variant="h4" component="h1" gutterBottom>
        Season {pool.season} &middot; Week {pool.week}
      </Typography>
      <Typography color="textSecondary">Select a participant to see their picks.</Typography>

      {isMobile ? (
        <Stack spacing={1.5} sx={{ mt: 2 }}>
          {leaderboard.map((entry) => (
            <Card key={entry.name} variant="outlined" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5 }}>
              <Avatar sx={{ width: 32, height: 32, fontSize: 15, fontWeight: 700, flexShrink: 0, ...rankAvatarSx(entry.rank) }}>
                {entry.rank}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  onClick={() => onSelect(entry.name)}
                  sx={{ textTransform: 'none', minWidth: 0, px: 1, justifyContent: 'flex-start' }}
                >
                  <Typography noWrap component="span" sx={{ fontWeight: 600 }}>
                    {entry.name}
                  </Typography>
                </Button>
                {entry.name === winnerName && <WinnerBadge />}
              </Box>
              <Chip label={`${entry.correct} / ${entry.totalGames}`} size="small" sx={{ flexShrink: 0 }} />
            </Card>
          ))}
        </Stack>
      ) : (
        <TableContainer sx={{ mt: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Rank</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Correct</TableCell>
                <TableCell>Pending</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaderboard.map((entry) => (
                <TableRow key={entry.name} hover>
                  <TableCell>
                    <Avatar sx={{ width: 32, height: 32, fontSize: 15, fontWeight: 700, ...rankAvatarSx(entry.rank) }}>
                      {entry.rank}
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Button onClick={() => onSelect(entry.name)} sx={{ textTransform: 'none', fontWeight: 600 }}>
                        {entry.name}
                      </Button>
                      {entry.name === winnerName && <WinnerBadge />}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip label={`${entry.correct} / ${entry.totalGames}`} size="small" />
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
