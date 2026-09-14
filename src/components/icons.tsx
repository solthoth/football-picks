interface IconProps {
  className?: string
}

const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

export function XIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  )
}

export function TrophyIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M7 4h10v4a5 5 0 01-10 0V4z" />
      <path d="M7 5H4a1 1 0 00-1 1c0 3 2 5 4 5M17 5h3a1 1 0 011 1c0 3-2 5-4 5" />
      <path d="M12 13v4M8 21h8" />
    </svg>
  )
}
