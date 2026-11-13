import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { guaranteedHeightPx, MIN_TOUCH_TARGET_PX } from '../testUtils/layout'
import { renderWithRouter } from '../testUtils/renderWithRouter'
import { NotFoundCard } from './NotFoundCard'

function renderCard() {
  return renderWithRouter(
    <NotFoundCard title="Game not found" message="Couldn't find that game in this week's pool." actionLabel="See this week's games" to="/season/2026/week/4/dashboard" />,
  )
}

describe('NotFoundCard', () => {
  it('has a level-1 heading, a message and exactly one way forward', () => {
    renderCard()

    expect(screen.getByRole('heading', { level: 1, name: 'Game not found' })).toBeInTheDocument()
    expect(screen.getByText("Couldn't find that game in this week's pool.")).toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('offers the way forward as a real link to the given place', () => {
    renderCard()

    expect(screen.getByRole('link', { name: "See this week's games" })).toHaveAttribute('href', '/season/2026/week/4/dashboard')
  })

  it('styles the way forward as the primary button, at a comfortable touch size', () => {
    renderCard()

    const action = screen.getByRole('link', { name: "See this week's games" })
    expect(action).toHaveClass('MuiButton-contained')
    expect(guaranteedHeightPx(action)).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX)
  })
})
