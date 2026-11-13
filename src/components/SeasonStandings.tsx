import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
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
import { Link as RouterLink } from 'react-router-dom'
import { formatMoney } from '../domain/money'
import type { SeasonEntry, SeasonStandings as Standings, WeekSummary } from '../domain/seasonStandings'
import { PageHeader } from './PageHeader'
import { RankAvatar } from './RankAvatar'

interface SeasonStandingsProps {
  season: number
  standings: Standings
  /** True while the first load of live scores is still running. */
  loading?: boolean
  /** Weeks whose live scores could not be loaded, so the totals may be missing their results. */
  failedWeeks?: number[]
}

/** "Week 3", "Weeks 3 and 4", "Weeks 2, 3 and 4". */
function describeWeeks(weeks: number[]): string {
  if (weeks.length === 1) return `Week ${weeks[0]}`
  return `Weeks ${weeks.slice(0, -1).join(', ')} and ${weeks[weeks.length - 1]}`
}

function winsAndMoney(entry: SeasonEntry): string {
  return `${entry.weeksWon} ${entry.weeksWon === 1 ? 'win' : 'wins'} · ${formatMoney(entry.winnings)}`
}

function weekOutcome(week: WeekSummary): string {
  if (!week.decided) return 'Not decided yet'
  const names = week.winners.join(' & ')
  if (week.pot === undefined) return names
  return `${names} · ${formatMoney(week.share)}${week.winners.length > 1 ? ' each' : ''}`
}

export function SeasonStandings({ season, standings, loading = false, failedWeeks = [] }: SeasonStandingsProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { entries, weeks } = standings
  const unranked = entries.length > 0 && entries.every((entry) => entry.rank === null)
  const shareUrl = `${window.location.origin}/season/${season}`

  return (
    <Container component="main" maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 4 }}>
        <PageHeader
          back={{ to: '/', label: 'Change season/week' }}
          share={{ url: shareUrl, title: `Season ${season} standings`, text: `See the Season ${season} standings` }}
        />

        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: '2rem', md: '3rem' } }}>
          Season {season}
        </Typography>
        <Typography color="textSecondary" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
          Winnings and picks across every week.
        </Typography>
        {standings.weeksTotal > 0 && (
          <Typography variant="caption" color="textSecondary" component="p">
            {`Winners decided for ${standings.weeksDecided} of ${standings.weeksTotal} weeks · ${formatMoney(standings.totalPaidOut)} paid out`}
          </Typography>
        )}

        {loading && (
          <Typography role="status" variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            Loading the latest scores…
          </Typography>
        )}
        {failedWeeks.length > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {`Couldn't load the latest scores for ${describeWeeks(failedWeeks)}, so these totals may be incomplete.`}
          </Alert>
        )}
        {unranked && (
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Rankings start once the first game is final.
          </Typography>
        )}

        {entries.length === 0 ? (
          <Typography color="textSecondary" sx={{ mt: 3 }}>
            No picks have been submitted for this season yet.
          </Typography>
        ) : isMobile ? (
          <Stack spacing={1.5} sx={{ mt: 3 }}>
            {entries.map((entry) => (
              <Card key={entry.name} variant="outlined" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, minHeight: 68 }}>
                <RankAvatar rank={entry.rank} size={40} fontSize={18} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: { xs: '1.125rem', sm: '1.25rem' }, overflowWrap: 'anywhere' }}>
                    {entry.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {winsAndMoney(entry)}
                  </Typography>
                </Box>
                <Chip label={`${entry.correct} / ${entry.decided}`} sx={{ flexShrink: 0, fontWeight: 700, fontSize: '1rem', height: 32 }} />
              </Card>
            ))}
          </Stack>
        ) : (
          <TableContainer sx={{ mt: 4 }}>
            <Table aria-label="Season standings" sx={{ '& .MuiTableCell-root': { fontSize: '1.25rem', py: 2, px: 2.5 } }}>
              <TableHead>
                <TableRow
                  sx={{ '& .MuiTableCell-root': { fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.secondary' } }}
                >
                  <TableCell>Rank</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Weeks won</TableCell>
                  <TableCell align="right">Winnings</TableCell>
                  <TableCell align="right">Correct</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.name}>
                    <TableCell>
                      <RankAvatar rank={entry.rank} size={44} fontSize={20} />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{entry.name}</TableCell>
                    <TableCell align="right">{entry.weeksWon}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {formatMoney(entry.winnings)}
                    </TableCell>
                    <TableCell align="right">
                      <Chip label={`${entry.correct} / ${entry.decided}`} sx={{ fontWeight: 700, fontSize: '1.125rem', height: 36 }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {weeks.length > 0 && (
          <>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mt: 5, mb: 1 }}>
              Week by week
            </Typography>
            <List aria-label="Week by week" disablePadding sx={{ borderTop: 1, borderColor: 'divider' }}>
              {weeks.map((week) => (
                <ListItem key={week.week} disablePadding divider>
                  <ListItemButton component={RouterLink} to={`/season/${season}/week/${week.week}`} sx={{ minHeight: 52, px: 1 }}>
                    <ListItemText
                      primary={`Week ${week.week}`}
                      secondary={weekOutcome(week)}
                      slotProps={{ primary: { sx: { fontWeight: 600, fontSize: '1.125rem' } } }}
                    />
                    <ChevronRightIcon aria-hidden color="action" />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Paper>
    </Container>
  )
}
