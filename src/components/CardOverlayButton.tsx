import ButtonBase from '@mui/material/ButtonBase'

interface CardOverlayButtonProps {
  label: string
  onClick: () => void
}

/** Makes a whole `position: relative` card clickable without nesting its content inside a button. */
export function CardOverlayButton({ label, onClick }: CardOverlayButtonProps) {
  return (
    <ButtonBase
      aria-label={label}
      onClick={onClick}
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
