import BarChartIcon from '@mui/icons-material/BarChart'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import MuiLink from '@mui/material/Link'
import Paper from '@mui/material/Paper'
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
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { scoresAsOfLabel } from '../data/liveScores'
import type { Pool } from '../data/types'
import { buildLeaderboard } from '../domain/standings'
import { determineWeekWinner } from '../domain/weekWinner'
import { BackLink } from './BackLink'
import { ShareButton } from './ShareButton'
import { WinnerBadge } from './WinnerBadge'

interface ParticipantListProps {
  pool: Pool
}

function rankAvatarSx(rank: number | null): SxProps<Theme> {
  if (rank === 1) return { bgcolor: 'warning.main', color: 'warning.contrastText' }
  if (rank === 2) return { bgcolor: 'grey.400', color: 'common.black' }
  if (rank === 3) return { bgcolor: '#cd7f32', color: 'common.white' }
  return { bgcolor: 'grey.300', color: 'common.black' }
}

function RankAvatar({ rank, size, fontSize }: { rank: number | null; size: number; fontSize: number }) {
  const sx = { width: size, height: size, fontSize, fontWeight: 700, flexShrink: 0, ...rankAvatarSx(rank) }
  if (rank === null) {
    return (
      <Avatar role="img" aria-label="Not ranked yet" sx={sx}>
        &ndash;
      </Avatar>
    )
  }
  return <Avatar sx={sx}>{rank}</Avatar>
}

export function ParticipantList({ pool }: ParticipantListProps) {
  const navigate = useNavigate()
  const weekPath = `/season/${pool.season}/week/${pool.week}`
  const participantPath = (name: string) => `${weekPath}/participant/${encodeURIComponent(name)}`
  const leaderboard = buildLeaderboard(pool)
  const { winnerNames } = determineWeekWinner(pool)
  const unranked = leaderboard.every((entry) => entry.rank === null)
  const scoresAsOf = scoresAsOfLabel(pool)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const shareUrl = `${window.location.origin}${weekPath}`

  return (
    <Container component="main" maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 4 }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <BackLink to="/" label="Change season/week" sx={{ ml: -1 }} />
          <ShareButton
            url={shareUrl}
            title={`Season ${pool.season} Week ${pool.week} standings`}
            text={`See the Season ${pool.season}, Week ${pool.week} standings`}
          />
        </Stack>

        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: '2rem', md: '3rem' } }}>
          Season {pool.season} &middot; Week {pool.week}
        </Typography>
        <Typography color="textSecondary" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>Select a participant to see their picks.</Typography>
        {scoresAsOf && (
          <Typography variant="caption" color="textSecondary" component="p">
            {scoresAsOf}
          </Typography>
        )}
        {unranked && (
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Rankings start once the first game is final.
          </Typography>
        )}
        <Button
          variant="outlined"
          size="large"
          startIcon={<BarChartIcon />}
          component={RouterLink}
          to={`${weekPath}/dashboard`}
          sx={{ mt: 2, width: { xs: '100%', sm: 'auto' } }}
        >
          See how the pool picked
        </Button>

        {isMobile ? (
          <Stack spacing={1.5} sx={{ mt: 2 }}>
            {leaderboard.map((entry) => (
              <Card key={entry.name} variant="outlined">
                <CardActionArea
                  component={RouterLink}
                  to={participantPath(entry.name)}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, minHeight: 68 }}
                >
                  <RankAvatar rank={entry.rank} size={40} fontSize={18} />
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
                    // Convenience only: the name link is the real, focusable target.
                    onClick={(event) => {
                      if ((event.target as HTMLElement).closest('a')) return
                      navigate(participantPath(entry.name))
                    }}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <RankAvatar rank={entry.rank} size={44} fontSize={20} />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <MuiLink
                          component={RouterLink}
                          to={participantPath(entry.name)}
                          underline="hover"
                          sx={{ fontWeight: 700, fontSize: 'inherit', '&:focus-visible': { outline: '2px solid', outlineOffset: 2 } }}
                        >
                          {entry.name}
                        </MuiLink>
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
      </Paper>
    </Container>
  )
}
