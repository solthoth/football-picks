import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import Button from '@mui/material/Button'
import type { SxProps, Theme } from '@mui/material/styles'
import type { MouseEvent } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'

interface BackLinkProps {
  /** Where the link goes (and where a new tab / copied link lands). */
  to: string
  label: string
  /** Set when the user arrived from another screen in the app: a plain click then pops history instead of pushing. */
  pop?: boolean
  sx?: SxProps<Theme>
}

/** A real link, so it can be opened in a new tab or copied; a plain click still behaves like a browser "back" when it should. */
export function BackLink({ to, label, pop = false, sx }: BackLinkProps) {
  const navigate = useNavigate()

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
    if (!pop || event.defaultPrevented || event.button !== 0 || modified) return
    event.preventDefault()
    navigate(-1)
  }

  return (
    <Button component={RouterLink} to={to} onClick={handleClick} startIcon={<ArrowBackIosNewIcon fontSize="small" />} sx={sx}>
      {label}
    </Button>
  )
}
