import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import BoltIcon from '@mui/icons-material/Bolt'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import { alpha, darken } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { useId } from 'react'
import type { GameDistribution, Side } from '../domain/pickDistribution'
import { CardOverlayButton } from './CardOverlayButton'
import { PickSplitBar } from './PickSplitBar'
import { TeamLogo } from './TeamLogo'

interface GamePickCardProps {
  game: GameDistribution
  /** When set, the whole card is a button that opens the who-picked-what view for this game. */
  onSelect?: (gameId: string) => void
}

function formatKickoff(kickoffTime: string | null): string | null {
  if (!kickoffTime) return null
  const date = new Date(kickoffTime)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' }).format(date)
}

function statusText(game: GameDistribution): string | null {
  if (game.status !== 'final' && game.status !== 'in_progress') return null
  const label = game.status === 'final' ? 'FINAL' : 'LIVE'
  if (game.awayScore === null || game.homeScore === null) return label
  return `${label} ${game.awayScore}-${game.homeScore}`
}

const visuallyHiddenSx = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: '1px',
  margin: '-1px',
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: '1px',
} as const

/**
 * Small warning-coloured text. `warning.dark` is only 3.8:1 on a white card, so
 * light mode darkens it to clear WCAG AA (4.5:1, also on the live card's tint);
 * dark mode uses `warning.light`, which is already bright on the dark surface.
 */
function warningTextColor(theme: Theme): string {
  return theme.palette.mode === 'dark' ? theme.palette.warning.light : darken(theme.palette.warning.dark, 0.3)
}

const captionSx = { fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' } as const

interface TeamCellProps {
  side: Side
  team: string
  isWinner: boolean
}

function TeamCell({ side, team, isWinner }: TeamCellProps) {
  const isHome = side === 'home'
  return (
    <Stack
      component="span"
      direction={isHome ? 'row-reverse' : 'row'}
      spacing={1.25}
      data-testid={`team-${side}`}
      sx={{ alignItems: 'center', minWidth: 0, textAlign: isHome ? 'right' : 'left' }}
    >
      <Box component="span" aria-hidden sx={{ display: 'flex', '& img': { width: { xs: 40, md: 48 }, height: { xs: 40, md: 48 } } }}>
        <TeamLogo team={team} size={48} />
      </Box>
      <Box component="span" sx={{ display: 'block', minWidth: 0 }}>
        <Stack component="span" direction={isHome ? 'row-reverse' : 'row'} spacing={0.5} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Typography component="span" noWrap sx={{ fontWeight: 700, fontSize: '1.125rem', minWidth: 0 }}>
            {team}
          </Typography>
          {isWinner && (
            // Decorative: screen readers get the hidden ", X won" text on the status row instead.
            <CheckCircleIcon aria-hidden fontSize="small" color="success" />
          )}
        </Stack>
        <Typography variant="caption" color="textSecondary" component="span" sx={{ display: 'block' }}>
          {isHome ? 'Home' : 'Away'}
        </Typography>
      </Box>
    </Stack>
  )
}

interface PercentProps {
  pct: number | null
  count: number
  picked: number
  emphasized: boolean
  align: 'left' | 'right'
}

function Percent({ pct, count, picked, emphasized, align }: PercentProps) {
  return (
    <Box sx={{ textAlign: align, minWidth: 0 }}>
      <Typography
        component="div"
        sx={{
          fontSize: { xs: '2rem', md: '2.25rem' },
          fontWeight: 800,
          lineHeight: 1.1,
          fontVariantNumeric: 'tabular-nums',
          color: emphasized ? 'text.primary' : 'text.secondary',
        }}
      >
        {pct === null ? (
          <>
            <span aria-hidden>-</span>
            <Box component="span" sx={visuallyHiddenSx}>
              no picks
            </Box>
          </>
        ) : (
          `${pct}%`
        )}
      </Typography>
      <Typography variant="caption" color="textSecondary" component="div" sx={{ fontVariantNumeric: 'tabular-nums' }}>
        {count} of {picked}
      </Typography>
    </Box>
  )
}

export function GamePickCard({ game, onSelect }: GamePickCardProps) {
  const headingId = useId()
  const kickoff = formatKickoff(game.kickoffTime)
  const status = statusText(game)
  const live = game.status === 'in_progress'
  const participantCount = game.picked + game.missing + game.unrecognized
  const winnerTeam = game.winnerSide === 'away' ? game.away : game.winnerSide === 'home' ? game.home : null

  // With a known winner it carries the emphasis; otherwise the majority side does.
  const awayEmphasized = game.winnerSide ? game.winnerSide === 'away' : game.leader !== 'home'
  const homeEmphasized = game.winnerSide ? game.winnerSide === 'home' : game.leader !== 'away'

  const showPickedNote = game.missing > 0 && game.picked > 0
  const hasFooter =
    game.crowd === 'crowd-right' || game.crowd === 'upset' || game.leader === 'tie' || showPickedNote || game.unrecognized > 0

  return (
    <Card
      variant="outlined"
      component="article"
      aria-labelledby={headingId}
      sx={(theme) => ({
        p: { xs: 2, md: 2.5 },
        position: 'relative',
        ...(live && { bgcolor: alpha(theme.palette.warning.main, 0.12), borderColor: alpha(theme.palette.warning.main, 0.5) }),
      })}
    >
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', minHeight: 20, mb: 1.5 }}>
        <Typography variant="caption" color="textSecondary" sx={captionSx}>
          {kickoff}
        </Typography>
        {status && (
          <Typography
            variant="caption"
            sx={(theme) => ({ ...captionSx, fontVariantNumeric: 'tabular-nums', color: live ? warningTextColor(theme) : theme.palette.text.secondary })}
          >
            {status}
            {winnerTeam && <Box component="span" sx={visuallyHiddenSx}>{`, ${winnerTeam} won`}</Box>}
          </Typography>
        )}
      </Stack>

      <Typography
        id={headingId}
        variant="body1"
        component="h2"
        aria-label={`${game.away} at ${game.home}`}
        sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1.5 }}
      >
        <TeamCell side="away" team={game.away} isWinner={game.winnerSide === 'away'} />
        <TeamCell side="home" team={game.home} isWinner={game.winnerSide === 'home'} />
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1 }}>
        <Percent pct={game.awayPct} count={game.awayCount} picked={game.picked} emphasized={awayEmphasized} align="left" />
        <Percent pct={game.homePct} count={game.homeCount} picked={game.picked} emphasized={homeEmphasized} align="right" />
      </Box>

      <PickSplitBar
        away={game.away}
        home={game.home}
        awayCount={game.awayCount}
        homeCount={game.homeCount}
        picked={game.picked}
        awayPct={game.awayPct}
        homePct={game.homePct}
        winnerSide={game.winnerSide}
      />

      {hasFooter && (
        <Stack direction="row" spacing={1} sx={{ mt: 1.5, alignItems: 'center', flexWrap: 'wrap', rowGap: 0.75 }}>
          {game.crowd === 'crowd-right' && (
            <Chip size="small" variant="outlined" color="success" icon={<CheckCircleIcon />} label="Crowd was right" />
          )}
          {game.crowd === 'upset' && (
            <Chip
              size="small"
              variant="outlined"
              icon={<BoltIcon />}
              label="Upset - crowd was wrong"
              sx={(theme) => ({
                color: warningTextColor(theme),
                borderColor: theme.palette.warning.main,
                '& .MuiChip-icon': { color: 'inherit' },
              })}
            />
          )}
          {game.leader === 'tie' && (
            <Typography variant="caption" color="textSecondary">
              Split evenly
            </Typography>
          )}
          {showPickedNote && (
            <Typography variant="caption" color="textSecondary">
              {game.picked} of {participantCount} picked - {game.missing} no pick
            </Typography>
          )}
          {game.unrecognized > 0 && (
            <Stack direction="row" spacing={0.5} sx={(theme) => ({ alignItems: 'center', color: warningTextColor(theme) })}>
              <WarningAmberIcon aria-hidden sx={{ fontSize: 16 }} />
              <Typography variant="caption" sx={{ color: 'inherit' }}>
                {game.unrecognized} unrecognized {game.unrecognized === 1 ? 'pick' : 'picks'}
              </Typography>
            </Stack>
          )}
        </Stack>
      )}

      {onSelect && (
        <>
          <Stack direction="row" spacing={0.25} sx={{ mt: 1.5, alignItems: 'center', justifyContent: 'flex-end', color: 'primary.main' }}>
            <Typography variant="caption" aria-hidden sx={{ fontWeight: 700 }}>
              See who picked each team
            </Typography>
            <ChevronRightIcon aria-hidden fontSize="small" />
          </Stack>
          <CardOverlayButton label={`See who picked ${game.away} at ${game.home}`} onClick={() => onSelect(game.gameId)} />
        </>
      )}
    </Card>
  )
}
