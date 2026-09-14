import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router-dom'

export function NotFoundPool() {
  return (
    <Container component="main" maxWidth="sm" sx={{ py: 4 }}>
      <Typography gutterBottom>That season/week isn't available.</Typography>
      <Link component={RouterLink} to="/">
        Start over
      </Link>
    </Container>
  )
}
