import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router-dom'

export function NotFound() {
  return (
    <Container component="main" maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Page not found
      </Typography>
      <Typography color="textSecondary" gutterBottom>
        That page doesn't exist.
      </Typography>
      <Link component={RouterLink} to="/">
        Go to Football Picks
      </Link>
    </Container>
  )
}
