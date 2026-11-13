import ButtonBase from '@mui/material/ButtonBase'
import { Link as RouterLink } from 'react-router-dom'

interface CardOverlayLinkProps {
  label: string
  to: string
  state?: unknown
}

/** Makes a whole `position: relative` card a real link without nesting its content inside an anchor. */
export function CardOverlayLink({ label, to, state }: CardOverlayLinkProps) {
  return (
    <ButtonBase
      component={RouterLink}
      to={to}
      state={state}
      aria-label={label}
      sx={{
        position: 'absolute',
        inset: 0,
        borderRadius: 'inherit',
        '&:hover': { bgcolor: 'action.hover' },
        '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 },
      }}
    />
  )
}
