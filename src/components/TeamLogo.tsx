import Box from '@mui/material/Box'
import { getTeamLogo } from '../data/teamLogos'

interface TeamLogoProps {
  team: string | undefined | null
  size?: number
}

export function TeamLogo({ team, size = 20 }: TeamLogoProps) {
  const logo = getTeamLogo(team)
  if (!logo) return null

  return (
    <Box
      component="img"
      src={logo}
      alt={`${team} logo`}
      sx={{ width: size, height: size, flexShrink: 0, objectFit: 'contain' }}
    />
  )
}
