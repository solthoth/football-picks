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

  it('shows a congratulations banner for a winner', () => {
    render(<WinnerCelebration participantName="Monica" isWinner={true} />)
    expect(screen.getByText(/congratulations, monica/i)).toBeInTheDocument()
  })

  it('shows no banner for a non-winner', () => {
    render(<WinnerCelebration participantName="Greg" isWinner={false} />)
    expect(screen.queryByText(/congratulations/i)).not.toBeInTheDocument()
  })

  it('fires a confetti burst for a winner', async () => {
    render(<WinnerCelebration participantName="Monica" isWinner={true} />)
    await waitFor(() => expect(confettiMock).toHaveBeenCalled())
  })

  it('does not fire confetti for a non-winner', async () => {
    render(<WinnerCelebration participantName="Greg" isWinner={false} />)
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(confettiMock).not.toHaveBeenCalled()
  })

  it('respects prefers-reduced-motion and skips confetti', () => {
    mockMatchMediaMatches(true)
    render(<WinnerCelebration participantName="Monica" isWinner={true} />)
    expect(confettiMock).not.toHaveBeenCalled()
    // The banner itself is not a motion effect, so it still shows.
    expect(screen.getByText(/congratulations, monica/i)).toBeInTheDocument()
  })
})
