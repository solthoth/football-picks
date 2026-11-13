import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router-dom'
import { CenteredCard } from '../components/CenteredCard'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function NotFoundPool() {
  useDocumentTitle('Week not found')

  return (
    <CenteredCard>
      <Typography gutterBottom>That season/week isn't available.</Typography>
      <Link component={RouterLink} to="/">
        Start over
      </Link>
    </CenteredCard>
  )
}
