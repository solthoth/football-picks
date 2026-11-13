import ShareIcon from '@mui/icons-material/Share'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import { useState } from 'react'

interface ShareButtonProps {
  url: string
  title: string
  text: string
}

/** TypeScript's DOM types say navigator.share always exists; at runtime it does not (older browsers, non-secure contexts). */
function hasShareSheet(): boolean {
  return typeof navigator.share === 'function'
}

/** A touch screen (coarse primary pointer), where the OS share sheet is the expected way to share. */
function isTouchDevice(): boolean {
  return window.matchMedia?.('(pointer: coarse)').matches ?? false
}

export function ShareButton({ url, title, text }: ShareButtonProps) {
  const [message, setMessage] = useState<string | null>(null)

  async function openShareSheet() {
    try {
      await navigator.share({ title, text, url })
    } catch {
      // User dismissed the native share sheet; nothing to do.
    }
  }

  async function handleShare() {
    // On a phone or tablet the OS share sheet is what people expect. Desktop Chrome, Edge and Safari also offer
    // navigator.share, but there it opens an OS sheet with no confirmation, so copy the link and say so instead.
    if (hasShareSheet() && isTouchDevice()) {
      await openShareSheet()
      return
    }

    try {
      await navigator.clipboard.writeText(url)
      setMessage('Link copied to clipboard')
    } catch {
      // Copying can be blocked (e.g. an insecure context); the share sheet is a better fallback than an error.
      if (hasShareSheet()) {
        await openShareSheet()
        return
      }
      setMessage("Couldn't copy the link")
    }
  }

  return (
    <>
      <Button
        startIcon={<ShareIcon fontSize="small" />}
        onClick={handleShare}
        variant="outlined"
        size="small"
        sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
      >
        Share
      </Button>
      <Snackbar open={message !== null} autoHideDuration={2500} onClose={() => setMessage(null)} message={message} />
    </>
  )
}
