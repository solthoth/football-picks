import ShareIcon from '@mui/icons-material/Share'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import { useState } from 'react'

interface ShareButtonProps {
  url: string
  title: string
  text: string
}

export function ShareButton({ url, title, text }: ShareButtonProps) {
  const [message, setMessage] = useState<string | null>(null)

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url })
      } catch {
        // User dismissed the native share sheet; nothing to do.
      }
      return
    }

    try {
      await navigator.clipboard.writeText(url)
      setMessage('Link copied to clipboard')
    } catch {
      setMessage("Couldn't copy the link")
    }
  }

  return (
    <>
      <Button startIcon={<ShareIcon fontSize="small" />} onClick={handleShare} variant="outlined" size="small">
        Share
      </Button>
      <Snackbar open={message !== null} autoHideDuration={2500} onClose={() => setMessage(null)} message={message} />
    </>
  )
}
