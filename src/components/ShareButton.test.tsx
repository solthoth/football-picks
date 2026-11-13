import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { guaranteedHeightPx, MIN_TOUCH_TARGET_PX } from '../testUtils/layout'
import { mockMatchMediaMatches } from '../testUtils/mockMatchMedia'
import { renderWithTheme } from '../testUtils/renderWithTheme'
import { ShareButton } from './ShareButton'

describe('ShareButton', () => {
  afterEach(() => {
    delete (navigator as { share?: typeof navigator.share }).share
    mockMatchMediaMatches(false)
    vi.restoreAllMocks()
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

  it('uses the native share sheet on a touch device instead of the clipboard', async () => {
    mockMatchMediaMatches(true) // (pointer: coarse)
    const user = userEvent.setup()
    const share = vi.fn().mockResolvedValue(undefined)
    navigator.share = share
    const writeText = vi.spyOn(navigator.clipboard, 'writeText')

    render(<ShareButton url="https://example.com/foo" title="Foo" text="Check out Foo" />)
    await user.click(screen.getByRole('button', { name: /share/i }))

    expect(share).toHaveBeenCalledWith({ title: 'Foo', text: 'Check out Foo', url: 'https://example.com/foo' })
    expect(writeText).not.toHaveBeenCalled()
  })

  it('on a desktop pointer copies the link and says so, even though the browser offers a share sheet', async () => {
    // Desktop Chrome, Edge and Safari expose navigator.share, but the OS sheet gives no confirmation and is
    // not what someone on a laptop expects from "Share".
    mockMatchMediaMatches(false)
    const user = userEvent.setup()
    const share = vi.fn().mockResolvedValue(undefined)
    navigator.share = share
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)

    render(<ShareButton url="https://example.com/foo" title="Foo" text="Check out Foo" />)
    await user.click(screen.getByRole('button', { name: /share/i }))

    expect(writeText).toHaveBeenCalledWith('https://example.com/foo')
    expect(share).not.toHaveBeenCalled()
    expect(await screen.findByText('Link copied to clipboard')).toBeInTheDocument()
  })

  it('on a desktop pointer falls back to the share sheet if the link cannot be copied', async () => {
    mockMatchMediaMatches(false)
    const user = userEvent.setup()
    const share = vi.fn().mockResolvedValue(undefined)
    navigator.share = share
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'))

    render(<ShareButton url="https://example.com/foo" title="Foo" text="Check out Foo" />)
    await user.click(screen.getByRole('button', { name: /share/i }))

    expect(share).toHaveBeenCalledWith({ title: 'Foo', text: 'Check out Foo', url: 'https://example.com/foo' })
    expect(screen.queryByText("Couldn't copy the link")).not.toBeInTheDocument()
  })

  it('on a touch device with no share sheet still copies the link', async () => {
    mockMatchMediaMatches(true)
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)

    render(<ShareButton url="https://example.com/foo" title="Foo" text="Check out Foo" />)
    await user.click(screen.getByRole('button', { name: /share/i }))

    expect(writeText).toHaveBeenCalledWith('https://example.com/foo')
    expect(await screen.findByText('Link copied to clipboard')).toBeInTheDocument()
  })

  it('says nothing when the share sheet is dismissed on a touch device', async () => {
    mockMatchMediaMatches(true)
    const user = userEvent.setup()
    navigator.share = vi.fn().mockRejectedValue(new DOMException('dismissed', 'AbortError'))

    render(<ShareButton url="https://example.com/foo" title="Foo" text="Check out Foo" />)
    await user.click(screen.getByRole('button', { name: /share/i }))

    expect(screen.queryByText(/copy|copied/i)).not.toBeInTheDocument()
  })

  it('is never squeezed or wrapped by a long neighbour in the header row', () => {
    render(<ShareButton url="https://example.com/foo" title="Foo" text="Check out Foo" />)

    expect(screen.getByRole('button', { name: /share/i })).toHaveStyle({ flexShrink: '0', whiteSpace: 'nowrap' })
  })

  it('is a comfortable touch target', () => {
    renderWithTheme(<ShareButton url="https://example.com/foo" title="Foo" text="Check out Foo" />)

    expect(guaranteedHeightPx(screen.getByRole('button', { name: /share/i }))).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX)
  })
})
