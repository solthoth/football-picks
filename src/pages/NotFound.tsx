import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router-dom'
import { CenteredCard } from '../components/CenteredCard'

export function NotFound() {
  return (
    <CenteredCard>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 800 }}>
        Page not found
      </Typography>
      <Typography color="textSecondary" gutterBottom>
        That page doesn't exist.
      </Typography>
      <Link component={RouterLink} to="/">
        Go to Football Picks
      </Link>
    </CenteredCard>
  )
}
