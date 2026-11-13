import CancelIcon from '@mui/icons-material/Cancel'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
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
import Typography from '@mui/material/Typography'
import { useId } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { scoresAsOfLabel } from '../data/liveScores'
import type { Pool } from '../data/types'
import { groupPicksForGame } from '../domain/gamePicks'
import { computePickDistribution } from '../domain/pickDistribution'
import type { Side } from '../domain/pickDistribution'
import { determineWeekWinner } from '../domain/weekWinner'
import { BackLink } from './BackLink'
import type { BackState } from './backNavigation'
import { NotFoundCard } from './NotFoundCard'
import { GamePickCard } from './GamePickCard'
import { SeasonWeekLabel } from './SeasonWeekLabel'
import { ShareButton } from './ShareButton'
import { TeamLogo } from './TeamLogo'
import { WinnerBadge } from './WinnerBadge'

interface GamePicksProps {
  pool: Pool
  gameId: string
  /** Set (by the screen we came from) to return there instead of to the dashboard; a plain click then pops history. */
  backLabel?: string
}

interface PickerGroupProps {
  side: Side
  team: string
  names: string[]
  /** true/false once the game is final with a winner; null while undecided. */
  won: boolean | null
  winnerNames: string[]
  /** Path of the week these picks belong to, e.g. /season/2026/week/4. */
  weekPath: string
  /** "Away @ Home", used to label the way back from a participant page. */
  matchup: string
}

function PickerGroup({ side, team, names, won, winnerNames, weekPath, matchup }: PickerGroupProps) {
  const headingId = useId()
  const accent = won === true ? 'success.main' : won === false ? 'error.main' : 'divider'

  return (
    <Card
      variant="outlined"
      component="section"
      aria-labelledby={headingId}
      data-testid={`pickers-${side}`}
      sx={{ borderTop: 4, borderTopColor: accent, minWidth: 0 }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', p: 2 }}>
        <TeamLogo team={team} size={40} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography id={headingId} variant="h6" component="h2" noWrap sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            Picked {team}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {side === 'home' ? 'Home' : 'Away'}
            {won === true && ' · Won'}
            {won === false && ' · Lost'}
          </Typography>
        </Box>
        {won === true && <CheckCircleIcon aria-hidden color="success" />}
        {won === false && <CancelIcon aria-hidden color="error" />}
        <Chip label={names.length} size="small" sx={{ fontWeight: 700 }} aria-label={`${names.length} picked ${team}`} />
      </Stack>

      {names.length === 0 ? (
        <Typography color="textSecondary" sx={{ px: 2, pb: 2 }}>
          Nobody picked the {team}.
        </Typography>
      ) : (
        <List disablePadding sx={{ borderTop: 1, borderColor: 'divider' }}>
          {names.map((name) => (
            <ListItem key={name} disablePadding divider>
              <ListItemButton
                component={RouterLink}
                to={`${weekPath}/participant/${encodeURIComponent(name)}`}
                state={{ backLabel: `Back to ${matchup}` } satisfies BackState}
                sx={{ minHeight: 52, px: 2 }}
              >
                <ListItemText primary={name} slotProps={{ primary: { sx: { fontWeight: 600, fontSize: '1.125rem' } } }} />
                {winnerNames.includes(name) && (
                  <Box sx={{ mr: 1 }}>
                    <WinnerBadge />
                  </Box>
                )}
                <ChevronRightIcon aria-hidden color="action" />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}
    </Card>
  )
}

export function GamePicks({ pool, gameId, backLabel }: GamePicksProps) {
  const weekPath = `/season/${pool.season}/week/${pool.week}`
  const back = { to: `${weekPath}/dashboard`, label: backLabel ?? 'Back to dashboard', pop: backLabel !== undefined }
  const groups = groupPicksForGame(pool, gameId)
  const distribution = groups ? computePickDistribution(pool).games.find((g) => g.gameId === gameId) : undefined

  if (!groups || !distribution) {
    return (
      <NotFoundCard
        title="Game not found"
        message="Couldn't find that game in this week's pool."
        actionLabel="See this week's games"
        to={`${weekPath}/dashboard`}
      />
    )
  }

  const { game } = groups
  const { winnerNames } = determineWeekWinner(pool)
  const scoresAsOf = scoresAsOfLabel(pool)
  const matchup = `${game.away} @ ${game.home}`
  const shareUrl = `${window.location.origin}${weekPath}/game/${encodeURIComponent(game.id)}`
  const wonOn = (side: Side): boolean | null => (distribution.winnerSide ? distribution.winnerSide === side : null)

  return (
    <Container component="main" maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 4 }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <BackLink {...back} sx={{ ml: -1 }} />
          <ShareButton
            url={shareUrl}
            title={`${game.away} at ${game.home} picks`}
            text={`See who picked ${game.away} and ${game.home} in Season ${pool.season}, Week ${pool.week}`}
          />
        </Stack>

        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: '2rem', md: '3rem' } }}>
          {game.away} @ {game.home}
        </Typography>
        <Typography color="textSecondary" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
          <SeasonWeekLabel season={pool.season} week={pool.week} /> &middot; Select a participant to see their picks.
        </Typography>
        {scoresAsOf && (
          <Typography variant="caption" color="textSecondary" component="p">
            {scoresAsOf}
          </Typography>
        )}

        <Box sx={{ mt: 3 }}>
          <GamePickCard game={distribution} />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: { xs: 2, md: 2.5 }, mt: 3, alignItems: 'start' }}>
          <PickerGroup side="away" team={game.away} names={groups.away} won={wonOn('away')} winnerNames={winnerNames} weekPath={weekPath} matchup={matchup} />
          <PickerGroup side="home" team={game.home} names={groups.home} won={wonOn('home')} winnerNames={winnerNames} weekPath={weekPath} matchup={matchup} />
        </Box>

        {groups.noPick.length > 0 && (
          <Typography color="textSecondary" sx={{ mt: 3 }}>
            No pick: {groups.noPick.join(', ')}
          </Typography>
        )}
        {groups.unrecognized.length > 0 && (
          <Typography color="textSecondary" sx={{ mt: 1 }}>
            Unrecognized pick: {groups.unrecognized.map((u) => `${u.name} (${u.pick})`).join(', ')}
          </Typography>
        )}
      </Paper>
    </Container>
  )
}
