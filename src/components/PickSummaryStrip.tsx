import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Stack from '@mui/material/Stack'
import { alpha } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import type { PickSummary } from '../domain/pickDistribution'
import { TeamLogo } from './TeamLogo'

interface PickSummaryStripProps {
  summary: PickSummary
  participantCount: number
}

type TileColor = 'primary' | 'secondary' | 'info'

interface StripItemProps {
  label: string
  color: TileColor
  value: ReactNode
  caption?: string
}

/**
 * A row on phones, a `SummaryTile`-style card from md up. The wrapper holds
 * only `dt`/`dd` children (a `div` group inside a `dl` is valid HTML), laid out
 * with grid so the label and its value/caption line up without extra wrappers.
 */
function StripItem({ label, color, value, caption }: StripItemProps) {
  return (
    <Card
      variant="outlined"
      component="div"
      sx={(theme) => ({
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        columnGap: 1,
        alignItems: 'center',
        py: 1,
        px: 0,
        border: 0,
        borderRadius: 0,
        bgcolor: 'transparent',
        '&:not(:last-of-type)': { borderBottom: 1, borderColor: 'divider' },
        [theme.breakpoints.up('md')]: {
          display: 'block',
          p: 2,
          border: 1,
          borderColor: 'divider',
          borderTop: 4,
          borderTopColor: theme.palette[color].main,
          borderRadius: 1,
          bgcolor: alpha(theme.palette[color].main, 0.07),
        },
      })}
    >
      <Typography
        component="dt"
        sx={(theme) => ({
          gridColumn: 1,
          gridRow: caption ? '1 / span 2' : 1,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          fontSize: { xs: '0.75rem', md: '0.875rem' },
          color: 'text.secondary',
          [theme.breakpoints.up('md')]: { color: theme.palette[color].main, mb: 0.5 },
        })}
      >
        {label}
      </Typography>
      <Typography
        component="dd"
        sx={{
          gridColumn: 2,
          minWidth: 0,
          m: 0,
          textAlign: { xs: 'right', md: 'left' },
          fontWeight: 700,
          lineHeight: 1.2,
          fontVariantNumeric: 'tabular-nums',
          fontSize: { xs: '1.125rem', md: '1.5rem' },
        }}
      >
        {value}
      </Typography>
      {caption && (
        <Typography
          component="dd"
          color="textSecondary"
          sx={{ gridColumn: 2, minWidth: 0, m: 0, textAlign: { xs: 'right', md: 'left' }, fontSize: { xs: '0.75rem', md: '0.875rem' } }}
        >
          {caption}
        </Typography>
      )}
    </Card>
  )
}

export function PickSummaryStrip({ summary, participantCount }: PickSummaryStripProps) {
  const { mostPopular, mostDivided } = summary
  // "Most popular" is omitted when every game with picks was an even split.
  const itemCount = 1 + (mostPopular ? 1 : 0) + (mostDivided ? 1 : 0)

  return (
    <Box
      component="dl"
      role="group"
      aria-label="Week summary"
      sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: `repeat(${itemCount}, 1fr)` }, gap: { xs: 0, md: 2 }, m: 0, mt: 3 }}
    >
      <StripItem label="Participants" color="primary" value={participantCount} caption="in this week's pool" />
      {mostPopular && (
        <StripItem
          label="Most popular pick"
          color="secondary"
          value={
            <Stack component="span" direction="row" spacing={0.75} sx={{ alignItems: 'center', justifyContent: { xs: 'flex-end', md: 'flex-start' } }}>
              <Box component="span" aria-hidden sx={{ display: 'flex' }}>
                <TeamLogo team={mostPopular.team} size={24} />
              </Box>
              <span>
                {mostPopular.team} {mostPopular.pct}%
              </span>
            </Stack>
          }
          caption={`${mostPopular.count} of ${mostPopular.picked} - ${mostPopular.away} @ ${mostPopular.home}`}
        />
      )}
      {mostDivided && (
        <StripItem
          label="Most divided game"
          color="info"
          value={`${mostDivided.away} @ ${mostDivided.home}`}
          caption={`${mostDivided.awayPct}% / ${mostDivided.homePct}%`}
        />
      )}
    </Box>
  )
}
