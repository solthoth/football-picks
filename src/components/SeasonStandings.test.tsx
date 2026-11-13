import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import type { SeasonStandings as Standings } from '../domain/seasonStandings'
import { guaranteedHeightPx, MIN_TOUCH_TARGET_PX } from '../testUtils/layout'
import { mockMatchMediaMatches } from '../testUtils/mockMatchMedia'
import { renderWithRouter } from '../testUtils/renderWithRouter'
import { SeasonStandings } from './SeasonStandings'

const standings: Standings = {
  entries: [
    { name: 'Ben', rank: 1, weeksWon: 1, winnings: 195, correct: 5, decided: 6 },
    { name: 'Amy', rank: 2, weeksWon: 1, winnings: 150, correct: 4, decided: 6 },
    { name: 'Cal', rank: 3, weeksWon: 0, winnings: 0, correct: 2, decided: 6 },
  ],
  weeks: [
    { week: 1, winners: ['Amy'], pot: 150, share: 150, decided: true },
    { week: 2, winners: ['Ben'], pot: 195, share: 195, decided: true },
    { week: 3, winners: [], pot: 150, share: 0, decided: false },
  ],
  weeksDecided: 2,
  weeksTotal: 3,
  totalPaidOut: 345,
}

const render = (props: Partial<Parameters<typeof SeasonStandings>[0]> = {}) =>
  renderWithRouter(<SeasonStandings season={2026} standings={standings} {...props} />)

describe('SeasonStandings', () => {
  afterEach(() => {
    mockMatchMediaMatches(false)
  })

  it('titles the page and summarises how much of the season has been decided', () => {
    render()

    expect(screen.getByRole('heading', { level: 1, name: 'Season 2026' })).toBeInTheDocument()
    expect(screen.getByText('Winners decided for 2 of 3 weeks · $345 paid out')).toBeInTheDocument()
  })

  it('lists everyone by rank with weeks won, winnings and correct picks', () => {
    render()

    const rows = within(screen.getByRole('table', { name: 'Season standings' })).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(3)
    expect(rows[0]).toHaveTextContent('1')
    expect(rows[0]).toHaveTextContent('Ben')
    expect(rows[0]).toHaveTextContent('$195')
    expect(rows[0]).toHaveTextContent('5 / 6')
    expect(rows[1]).toHaveTextContent('Amy')
    expect(rows[2]).toHaveTextContent('Cal')
    expect(rows[2]).toHaveTextContent('$0')
  })

  it('has a column for weeks won', () => {
    render()

    expect(screen.getByRole('columnheader', { name: 'Weeks won' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Winnings' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Correct' })).toBeInTheDocument()
  })

  it('uses cards instead of a table on phones, saying "1 win" and "2 wins" correctly', () => {
    mockMatchMediaMatches(true)
    render({ standings: { ...standings, entries: [{ ...standings.entries[0], weeksWon: 2 }, standings.entries[1], standings.entries[2]] } })

    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByText('2 wins · $195')).toBeInTheDocument()
    expect(screen.getByText('1 win · $150')).toBeInTheDocument()
    expect(screen.getByText('0 wins · $0')).toBeInTheDocument()
    expect(screen.getByText('5 / 6')).toBeInTheDocument()
  })

  it('shows a week-by-week list that links to each week and names the winners and money', () => {
    render()

    const list = screen.getByRole('list', { name: 'Week by week' })
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(within(items[0]).getByRole('link', { name: /Week 1/ })).toHaveAttribute('href', '/season/2026/week/1')
    expect(items[0]).toHaveTextContent('Amy · $150')
    expect(items[1]).toHaveTextContent('Ben · $195')
    expect(items[2]).toHaveTextContent('Not decided yet')
  })

  it('shows co-winners and what each of them received', () => {
    render({
      standings: { ...standings, weeks: [{ week: 4, winners: ['Amy', 'Ben'], pot: 195, share: 97.5, decided: true }] },
    })

    expect(screen.getByText('Amy & Ben · $97.50 each')).toBeInTheDocument()
  })

  it('makes the week links comfortable touch targets', () => {
    render()

    for (const link of within(screen.getByRole('list', { name: 'Week by week' })).getAllByRole('link')) {
      expect(guaranteedHeightPx(link)).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX)
    }
  })

  it('navigates to a week from the list', async () => {
    const user = userEvent.setup()
    render()

    await user.click(screen.getByRole('link', { name: /Week 2/ }))

    expect(screen.getByTestId('location')).toHaveTextContent('/season/2026/week/2')
  })

  it('has a sticky header with a link back to the season/week picker and a share button', () => {
    render()

    const back = screen.getByRole('link', { name: /change season\/week/i })
    expect(back).toHaveAttribute('href', '/')
    expect(back.closest('header')).toHaveStyle({ position: 'sticky' })
    expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument()
  })

  it('does not rank anyone, and says why, until some pick is decided', () => {
    render({
      standings: { ...standings, entries: standings.entries.map((e) => ({ ...e, rank: null })), weeksDecided: 0, totalPaidOut: 0 },
    })

    expect(screen.getAllByRole('img', { name: 'Not ranked yet' })).toHaveLength(3)
    expect(screen.getByText(/rankings start once the first game is final/i)).toBeInTheDocument()
  })

  it('says scores are loading while they are, and not otherwise', () => {
    const { unmount } = render({ loading: true })
    expect(screen.getByRole('status')).toHaveTextContent('Loading the latest scores…')
    unmount()

    render({ loading: false })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it.each([
    [[3], "Couldn't load the latest scores for Week 3, so these totals may be incomplete."],
    [[3, 4], "Couldn't load the latest scores for Weeks 3 and 4, so these totals may be incomplete."],
    [[2, 3, 4], "Couldn't load the latest scores for Weeks 2, 3 and 4, so these totals may be incomplete."],
  ])('warns that totals may be incomplete when weeks %j failed to load', (failedWeeks, message) => {
    render({ failedWeeks })

    expect(screen.getByRole('alert')).toHaveTextContent(message)
  })

  it('shows no warning when every week loaded', () => {
    render({ failedWeeks: [] })

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('says so when nobody has submitted picks yet', () => {
    render({ standings: { entries: [], weeks: [], weeksDecided: 0, weeksTotal: 0, totalPaidOut: 0 } })

    expect(screen.getByText(/no picks have been submitted for this season yet/i)).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
