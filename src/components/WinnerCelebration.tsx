import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import Alert from '@mui/material/Alert'
import Fade from '@mui/material/Fade'
import Snackbar from '@mui/material/Snackbar'
import { useEffect, useState } from 'react'

interface WinnerCelebrationProps {
  participantName: string
  /** The week being viewed, named in the banner. */
  week: number
  isWinner: boolean
}

/** Fires the two-burst confetti. Returns a cleanup that cancels whatever has not fired yet (e.g. on leaving the page). */
function fireConfetti(): () => void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}

  let cancelled = false
  let secondBurst: ReturnType<typeof setTimeout> | undefined

  import('canvas-confetti').then(({ default: confetti }) => {
    if (cancelled) return
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } })
    secondBurst = setTimeout(() => confetti({ particleCount: 80, spread: 110, startVelocity: 45, origin: { y: 0.5 } }), 150)
  })

  return () => {
    cancelled = true
    clearTimeout(secondBurst)
  }
}

/**
 * Pops up a banner naming the week's winner and fires a confetti burst on every load of a winning
 * participant's page. The wording is third person because the page is viewed by the whole pool,
 * not just the winner.
 */
export function WinnerCelebration({ participantName, week, isWinner }: WinnerCelebrationProps) {
  const [open, setOpen] = useState(false)

  // Open the banner the first time a given participant is shown as a winner,
  // adjusted during render per https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  // (rather than as a setState-in-effect, which cascades an extra render).
  const [announcedFor, setAnnouncedFor] = useState<string | null>(null)
  if (isWinner && announcedFor !== participantName) {
    setAnnouncedFor(participantName)
    setOpen(true)
  }

  // The confetti burst is a genuine external side effect (dynamic import,
  // canvas drawing), so it belongs in an effect. Leaving the page cancels
  // whatever has not fired yet, so a burst never lands on the next screen.
  useEffect(() => {
    if (isWinner) return fireConfetti()
  }, [participantName, isWinner])

  return (
    <Snackbar
      open={open}
      autoHideDuration={2500}
      onClose={() => setOpen(false)}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      slots={{ transition: Fade }}
    >
      <Alert severity="success" variant="filled" icon={<EmojiEventsIcon />} onClose={() => setOpen(false)} sx={{ fontWeight: 600 }}>
        {participantName} won Week {week}!
      </Alert>
    </Snackbar>
  )
}
