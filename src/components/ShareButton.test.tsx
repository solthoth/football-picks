import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ShareButton } from './ShareButton'

describe('ShareButton', () => {
  afterEach(() => {
    delete (navigator as { share?: typeof navigator.share }).share
  })

  it('copies the link to the clipboard when the Web Share API is unavailable', async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)

    render(<ShareButton url="https://example.com/foo" title="Foo" text="Check out Foo" />)
    await user.click(screen.getByRole('button', { name: /share/i }))

    expect(writeText).toHaveBeenCalledWith('https://example.com/foo')
    expect(await screen.findByText('Link copied to clipboard')).toBeInTheDocument()
  })

  it('shows an error message when copying to the clipboard fails', async () => {
    const user = userEvent.setup()
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'))

    render(<ShareButton url="https://example.com/foo" title="Foo" text="Check out Foo" />)
    await user.click(screen.getByRole('button', { name: /share/i }))

    expect(await screen.findByText("Couldn't copy the link")).toBeInTheDocument()
  })

  it('uses the native share sheet when available instead of the clipboard', async () => {
    const user = userEvent.setup()
    const share = vi.fn().mockResolvedValue(undefined)
    navigator.share = share
    const writeText = vi.spyOn(navigator.clipboard, 'writeText')

    render(<ShareButton url="https://example.com/foo" title="Foo" text="Check out Foo" />)
    await user.click(screen.getByRole('button', { name: /share/i }))

    expect(share).toHaveBeenCalledWith({ title: 'Foo', text: 'Check out Foo', url: 'https://example.com/foo' })
    expect(writeText).not.toHaveBeenCalled()
  })
})
