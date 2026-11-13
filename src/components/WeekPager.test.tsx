import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { guaranteedHeightPx, MIN_TOUCH_TARGET_PX } from '../testUtils/layout'
import { renderWithRouter } from '../testUtils/renderWithRouter'
import { WeekPager } from './WeekPager'

describe('WeekPager', () => {
  it('links to the previous and next weeks, labelled for both sighted and assistive-technology users', () => {
    renderWithRouter(<WeekPager season={2026} week={5} weeks={[3, 4, 5, 6, 7]} />)

    const nav = screen.getByRole('navigation', { name: 'Switch week' })
    expect(nav).toContainElement(screen.getByRole('link', { name: 'Week 4 (previous week)' }))
    expect(screen.getByRole('link', { name: 'Week 4 (previous week)' })).toHaveAttribute('href', '/season/2026/week/4')
    expect(screen.getByRole('link', { name: 'Week 6 (next week)' })).toHaveAttribute('href', '/season/2026/week/6')
    expect(screen.getByText('Week 4')).toBeInTheDocument()
    expect(screen.getByText('Week 6')).toBeInTheDocument()
  })

  it('skips weeks that are not in the data', () => {
    renderWithRouter(<WeekPager season={2026} week={5} weeks={[1, 2, 5, 8]} />)

    expect(screen.getByRole('link', { name: 'Week 2 (previous week)' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Week 8 (next week)' })).toBeInTheDocument()
  })

  it('has no previous link on the first week, and no next link on the last', () => {
    const { unmount } = renderWithRouter(<WeekPager season={2026} week={1} weeks={[1, 2, 3]} />)
    expect(screen.queryByRole('link', { name: /previous week/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /next week/ })).toBeInTheDocument()
    unmount()

    renderWithRouter(<WeekPager season={2026} week={3} weeks={[1, 2, 3]} />)
    expect(screen.queryByRole('link', { name: /next week/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /previous week/ })).toBeInTheDocument()
  })

  it('renders nothing when there is no other week to go to', () => {
    renderWithRouter(<WeekPager season={2026} week={1} weeks={[1]} />)

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('uses comfortable touch targets', () => {
    renderWithRouter(<WeekPager season={2026} week={5} weeks={[4, 5, 6]} />)

    for (const link of screen.getAllByRole('link')) {
      expect(guaranteedHeightPx(link)).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX)
    }
  })

  it('navigates when a link is used', async () => {
    const user = userEvent.setup()
    renderWithRouter(<WeekPager season={2026} week={5} weeks={[4, 5, 6]} />)

    await user.click(screen.getByRole('link', { name: 'Week 6 (next week)' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/season/2026/week/6')
  })
})
