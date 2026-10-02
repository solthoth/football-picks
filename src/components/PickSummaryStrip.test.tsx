import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { PickSummary } from '../domain/pickDistribution'
import { PickSummaryStrip } from './PickSummaryStrip'

const summary: PickSummary = {
  mostPopular: { gameId: 'Chiefs@Raiders', away: 'Chiefs', home: 'Raiders', team: 'Chiefs', pct: 100, count: 10, picked: 10 },
  mostDivided: { gameId: 'Colts@Commanders', away: 'Colts', home: 'Commanders', awayPct: 50, homePct: 50 },
}

describe('PickSummaryStrip', () => {
  it('renders the participant count, most popular pick, and most divided game', () => {
    render(<PickSummaryStrip summary={summary} participantCount={10} />)

    const strip = screen.getByRole('group', { name: 'Week summary' })
    expect(within(strip).getByText('Participants')).toBeInTheDocument()
    expect(within(strip).getByText('10')).toBeInTheDocument()
    expect(within(strip).getByText("in this week's pool")).toBeInTheDocument()
    expect(within(strip).getByText('Most popular pick')).toBeInTheDocument()
    expect(within(strip).getByText('Chiefs 100%')).toBeInTheDocument()
    expect(within(strip).getByText('10 of 10 - Chiefs @ Raiders')).toBeInTheDocument()
    expect(within(strip).getByText('Most divided game')).toBeInTheDocument()
    expect(within(strip).getByText('Colts @ Commanders')).toBeInTheDocument()
    expect(within(strip).getByText('50% / 50%')).toBeInTheDocument()
  })

  it('hides the team logo from assistive technology', () => {
    render(<PickSummaryStrip summary={summary} participantCount={10} />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('uses a valid definition list: only dt/dd inside each group', () => {
    const { container } = render(<PickSummaryStrip summary={summary} participantCount={10} />)

    const list = container.querySelector('dl') as HTMLElement
    for (const group of Array.from(list.children)) {
      for (const child of Array.from(group.children)) expect(['DT', 'DD']).toContain(child.tagName)
    }
  })

  it('omits the most popular tile when there is none (every game tied)', () => {
    render(<PickSummaryStrip summary={{ ...summary, mostPopular: null }} participantCount={4} />)

    expect(screen.queryByText('Most popular pick')).not.toBeInTheDocument()
    expect(screen.getByText('Most divided game')).toBeInTheDocument()
    expect(screen.getByText('Participants')).toBeInTheDocument()
  })

  it('omits the most divided tile when there is none', () => {
    render(<PickSummaryStrip summary={{ ...summary, mostDivided: null }} participantCount={4} />)

    expect(screen.queryByText('Most divided game')).not.toBeInTheDocument()
    expect(screen.getByText('Most popular pick')).toBeInTheDocument()
  })
})
