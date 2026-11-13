import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router-dom'
import { CenteredCard } from './CenteredCard'

interface NotFoundCardProps {
  title: string
  message: string
  /** The one thing to do next, as a real link. */
  actionLabel: string
  to: string
}

/** The shared look of every "can't find that" screen: a heading, a sentence, and one primary way forward. */
export function NotFoundCard({ title, message, actionLabel, to }: NotFoundCardProps) {
  return (
    <CenteredCard>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 800 }}>
        {title}
      </Typography>
      <Typography color="textSecondary" sx={{ mb: 3 }}>
        {message}
      </Typography>
      <Button component={RouterLink} to={to} variant="contained" size="large">
        {actionLabel}
      </Button>
    </CenteredCard>
  )
}
