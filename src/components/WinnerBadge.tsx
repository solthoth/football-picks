import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import Chip from '@mui/material/Chip'

export function WinnerBadge() {
  return <Chip icon={<EmojiEventsIcon />} label="Week Winner" color="warning" size="small" sx={{ fontWeight: 700 }} />
}
