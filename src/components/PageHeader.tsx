import Stack from '@mui/material/Stack'
import { BackLink } from './BackLink'
import { ShareButton } from './ShareButton'

interface PageHeaderProps {
  back: { to: string; label: string; pop?: boolean }
  share: { url: string; title: string; text: string }
}

/**
 * The back link and share button at the top of a page. It sticks to the top of the screen so they stay
 * reachable on long pages (a participant page is 3.5 phone screens tall). It spans the card's padding and
 * has an opaque background so content scrolling underneath does not show through; the z-index keeps it above
 * page content but below dialogs, banners and menus.
 */
export function PageHeader({ back, share }: PageHeaderProps) {
  return (
    <Stack
      component="header"
      direction="row"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        mx: { xs: -2.5, md: -4 },
        px: { xs: 2.5, md: 4 },
        py: 0.5,
        mb: 2,
      }}
    >
      <BackLink {...back} sx={{ ml: -1 }} />
      <ShareButton {...share} />
    </Stack>
  )
}
