import Avatar from '@mui/material/Avatar'
import type { SxProps, Theme } from '@mui/material/styles'

/** Gold, silver and bronze for the top three; every colour keeps WCAG AA contrast with its text. */
function rankAvatarSx(rank: number | null): SxProps<Theme> {
  if (rank === 1) return { bgcolor: 'warning.main', color: 'warning.contrastText' }
  if (rank === 2) return { bgcolor: 'grey.400', color: 'common.black' }
  if (rank === 3) return { bgcolor: '#cd7f32', color: 'common.black' }
  return { bgcolor: 'grey.300', color: 'common.black' }
}

/** A rank in a coloured circle, or a neutral dash while nobody is ranked yet. */
export function RankAvatar({ rank, size, fontSize }: { rank: number | null; size: number; fontSize: number }) {
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
