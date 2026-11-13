import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockMatchMediaMatches } from '../testUtils/mockMatchMedia'
import { WinnerCelebration } from './WinnerCelebration'

const confettiMock = vi.fn()
vi.mock('canvas-confetti', () => ({ default: confettiMock }))

describe('WinnerCelebration', () => {
  afterEach(() => {
    confettiMock.mockClear()
    mockMatchMediaMatches(false)
  })

  it('announces the winner and the week in the third person', () => {
    render(<WinnerCelebration participantName="Monica" week={9} isWinner={true} />)
    expect(screen.getByText('Monica won Week 9!')).toBeInTheDocument()
  })

  it("does not address whoever is looking at the page as if they were the winner", () => {
    render(<WinnerCelebration participantName="Monica" week={9} isWinner={true} />)
    expect(screen.queryByText(/congratulations|you're|you are/i)).not.toBeInTheDocument()
  })

  it('shows no banner for a non-winner', () => {
    render(<WinnerCelebration participantName="Greg" week={9} isWinner={false} />)
    expect(screen.queryByText(/won week/i)).not.toBeInTheDocument()
  })

  it('fires a confetti burst for a winner', async () => {
    render(<WinnerCelebration participantName="Monica" week={9} isWinner={true} />)
    await waitFor(() => expect(confettiMock).toHaveBeenCalled())
  })

  it('fires confetti on every load of a winner page, not just the first (existing behaviour, deliberately kept)', async () => {
    const first = render(<WinnerCelebration participantName="Monica" week={9} isWinner={true} />)
    await waitFor(() => expect(confettiMock).toHaveBeenCalled())
    first.unmount()
    confettiMock.mockClear()

    render(<WinnerCelebration participantName="Monica" week={9} isWinner={true} />)
    await waitFor(() => expect(confettiMock).toHaveBeenCalled())
  })

  it('fires both bursts when the page stays open', async () => {
    render(<WinnerCelebration participantName="Monica" week={9} isWinner={true} />)

    await waitFor(() => expect(confettiMock).toHaveBeenCalledTimes(2))
  })

  it('cancels the pending second burst when the page is left, so nothing fires on the next screen', async () => {
    const { unmount } = render(<WinnerCelebration participantName="Monica" week={9} isWinner={true} />)
    await waitFor(() => expect(confettiMock).toHaveBeenCalledTimes(1))

    unmount()
    confettiMock.mockClear()
    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(confettiMock).not.toHaveBeenCalled()
  })

  it('fires nothing if the page is left before the confetti library has loaded', async () => {
    const { unmount } = render(<WinnerCelebration participantName="Monica" week={9} isWinner={true} />)

    unmount()
    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(confettiMock).not.toHaveBeenCalled()
  })

  it('does not fire confetti for a non-winner', async () => {
    render(<WinnerCelebration participantName="Greg" week={9} isWinner={false} />)
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(confettiMock).not.toHaveBeenCalled()
  })

  it('respects prefers-reduced-motion and skips confetti', () => {
    mockMatchMediaMatches(true)
    render(<WinnerCelebration participantName="Monica" week={9} isWinner={true} />)
    expect(confettiMock).not.toHaveBeenCalled()
    // The banner itself is not a motion effect, so it still shows.
    expect(screen.getByText('Monica won Week 9!')).toBeInTheDocument()
  })
})
