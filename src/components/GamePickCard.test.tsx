import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { GameDistribution } from '../domain/pickDistribution'
import { textContrast } from '../testUtils/contrast'
import { renderWithRouter } from '../testUtils/renderWithRouter'
import { GamePickCard } from './GamePickCard'
import { PickSplitBar } from './PickSplitBar'

function game(overrides: Partial<GameDistribution> = {}): GameDistribution {
  return {
    gameId: 'Falcons@Packers',
    away: 'Falcons',
    home: 'Packers',
    awayCount: 3,
    homeCount: 7,
    picked: 10,
    missing: 0,
    unrecognized: 0,
    awayPct: 30,
    homePct: 70,
    leader: 'home',
    status: 'scheduled',
    kickoffTime: null,
    awayScore: null,
    homeScore: null,
    winnerSide: null,
    crowd: 'pending',
    ...overrides,
  }
}

describe('PickSplitBar', () => {
  const props = { away: 'Falcons', home: 'Packers', awayCount: 3, homeCount: 7, picked: 10, awayPct: 30, homePct: 70, winnerSide: null } as const

  it('exposes the split as a meter with a full-sentence value text', () => {
    render(<PickSplitBar {...props} />)

    const meter = screen.getByRole('meter')
    expect(meter).toHaveAccessibleName('Pick split for Falcons at Packers')
    expect(meter).toHaveAttribute('aria-valuenow', '30')
    expect(meter).toHaveAttribute('aria-valuemin', '0')
    expect(meter).toHaveAttribute('aria-valuemax', '100')
    expect(meter).toHaveAttribute('aria-valuetext', 'Falcons 3 of 10 (30%), Packers 7 of 10 (70%)')
  })

  it('renders no segment for a 0% side', () => {
    render(<PickSplitBar {...props} awayCount={0} homeCount={10} awayPct={0} homePct={100} />)

    expect(screen.queryByTestId('split-segment-away')).not.toBeInTheDocument()
    expect(screen.getByTestId('split-segment-home')).toBeInTheDocument()
  })

  it('dims the losing segment and leaves the winner at full strength', () => {
    const { rerender } = render(<PickSplitBar {...props} winnerSide="away" />)
    expect(screen.getByTestId('split-segment-away')).toHaveStyle({ opacity: '1' })
    expect(screen.getByTestId('split-segment-home')).toHaveStyle({ opacity: '0.45' })

    rerender(<PickSplitBar {...props} winnerSide="home" />)
    expect(screen.getByTestId('split-segment-away')).toHaveStyle({ opacity: '0.45' })
    expect(screen.getByTestId('split-segment-home')).toHaveStyle({ opacity: '1' })
  })

  it('dims neither segment without a winner', () => {
    render(<PickSplitBar {...props} />)
    expect(screen.getByTestId('split-segment-away')).toHaveStyle({ opacity: '1' })
    expect(screen.getByTestId('split-segment-home')).toHaveStyle({ opacity: '1' })
  })

  it('renders an empty state instead of a meter when nobody picked', () => {
    render(<PickSplitBar {...props} awayCount={0} homeCount={0} picked={0} awayPct={null} homePct={null} />)

    expect(screen.queryByRole('meter')).not.toBeInTheDocument()
    expect(screen.getByText('No picks for this game')).toBeInTheDocument()
  })
})

describe('GamePickCard', () => {
  it('shows percentages, counts, and a heading naming the matchup', () => {
    render(<GamePickCard game={game()} />)

    expect(screen.getByRole('heading', { level: 2 })).toHaveAccessibleName('Falcons at Packers')
    expect(screen.getByRole('article')).toHaveAccessibleName('Falcons at Packers')
    expect(screen.getByText('30%')).toBeInTheDocument()
    expect(screen.getByText('70%')).toBeInTheDocument()
    expect(screen.getByText('3 of 10')).toBeInTheDocument()
    expect(screen.getByText('7 of 10')).toBeInTheDocument()
  })

  it('shows dashes and the empty message for a game nobody picked, with no meter', () => {
    render(
      <GamePickCard
        game={game({ awayCount: 0, homeCount: 0, picked: 0, missing: 4, awayPct: null, homePct: null, leader: null })}
      />,
    )

    expect(screen.queryByRole('meter')).not.toBeInTheDocument()
    expect(screen.getByText('No picks for this game')).toBeInTheDocument()
    expect(screen.getAllByText('-')).toHaveLength(2)
    expect(screen.getAllByText('no picks')).toHaveLength(2)
    expect(screen.getAllByText('0 of 0')).toHaveLength(2)
    expect(screen.queryByText(/no pick$/)).not.toBeInTheDocument()
  })

  it('notes missing picks only when there are some', () => {
    const { rerender } = render(<GamePickCard game={game()} />)
    expect(screen.queryByText(/no pick/i)).not.toBeInTheDocument()

    rerender(<GamePickCard game={game({ awayCount: 3, homeCount: 5, picked: 8, missing: 2, awayPct: 37, homePct: 63 })} />)
    expect(screen.getByText('8 of 10 picked - 2 no pick')).toBeInTheDocument()
  })

  it('notes unrecognized picks only when there are some', () => {
    const { rerender } = render(<GamePickCard game={game()} />)
    expect(screen.queryByText(/unrecognized/i)).not.toBeInTheDocument()

    rerender(<GamePickCard game={game({ unrecognized: 1 })} />)
    expect(screen.getByText('1 unrecognized pick')).toBeInTheDocument()
  })

  it('says a tied game split evenly', () => {
    render(<GamePickCard game={game({ awayCount: 5, homeCount: 5, awayPct: 50, homePct: 50, leader: 'tie' })} />)
    expect(screen.getByText('Split evenly')).toBeInTheDocument()
  })

  it('marks an upset and the winning minority team', () => {
    render(<GamePickCard game={game({ status: 'final', awayScore: 24, homeScore: 17, winnerSide: 'away', crowd: 'upset' })} />)

    expect(screen.getByText('Upset - crowd was wrong')).toBeInTheDocument()
    expect(screen.getByText('FINAL 24-17')).toBeInTheDocument()
    expect(within(screen.getByTestId('team-away')).getByTestId('CheckCircleIcon')).toBeInTheDocument()
    expect(within(screen.getByTestId('team-home')).queryByTestId('CheckCircleIcon')).not.toBeInTheDocument()
  })

  it('announces the winner once, via hidden status text, and keeps the icon decorative', () => {
    render(<GamePickCard game={game({ status: 'final', awayScore: 24, homeScore: 17, winnerSide: 'away', crowd: 'upset' })} />)

    expect(screen.getByText(', Falcons won')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'Winner' })).not.toBeInTheDocument()
    expect(within(screen.getByTestId('team-away')).getByTestId('CheckCircleIcon')).toHaveAttribute('aria-hidden', 'true')
  })

  it('hides the team logos from assistive technology so names are read once', () => {
    render(<GamePickCard game={game()} />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('marks a final the crowd called correctly', () => {
    render(<GamePickCard game={game({ status: 'final', awayScore: 10, homeScore: 20, winnerSide: 'home', crowd: 'crowd-right' })} />)

    expect(screen.getByText('Crowd was right')).toBeInTheDocument()
    expect(screen.getByText(', Packers won')).toBeInTheDocument()
    expect(within(screen.getByTestId('team-home')).getByTestId('CheckCircleIcon')).toBeInTheDocument()
  })

  it('shows no crowd chip when a final game was split evenly, only the note', () => {
    render(
      <GamePickCard
        game={game({
          status: 'final',
          awayScore: 17,
          homeScore: 24,
          awayCount: 5,
          homeCount: 5,
          picked: 10,
          awayPct: 50,
          homePct: 50,
          leader: 'tie',
          winnerSide: 'home',
          crowd: 'split',
        })}
      />,
    )

    expect(screen.getByText('FINAL 17-24')).toBeInTheDocument()
    expect(screen.getByText('Split evenly')).toBeInTheDocument()
    expect(screen.queryByText(/crowd was|upset/i)).not.toBeInTheDocument()
  })

  it('shows no crowd chip when the data is unreliable, even for a decided final', () => {
    // The domain reports 'pending' whenever a pick was unrecognized; the card must not invent a chip.
    render(
      <GamePickCard game={game({ status: 'final', awayScore: 24, homeScore: 17, winnerSide: 'away', unrecognized: 2, crowd: 'pending' })} />,
    )

    expect(screen.queryByText(/crowd was|upset/i)).not.toBeInTheDocument()
    expect(screen.getByText('2 unrecognized picks')).toBeInTheDocument()
    expect(screen.getByText(', Falcons won')).toBeInTheDocument()
  })

  it('shows the live score with no result chip on a game in progress', () => {
    render(<GamePickCard game={game({ status: 'in_progress', awayScore: 10, homeScore: 7 })} />)

    expect(screen.getByText('LIVE 10-7')).toBeInTheDocument()
    expect(screen.queryByText(/crowd was/i)).not.toBeInTheDocument()
    expect(screen.queryByTestId('CheckCircleIcon')).not.toBeInTheDocument()
  })

  it('shows no score or chip for a scheduled game', () => {
    render(<GamePickCard game={game()} />)

    expect(screen.queryByText(/FINAL|LIVE/)).not.toBeInTheDocument()
    expect(screen.queryByText(/crowd was|upset/i)).not.toBeInTheDocument()
  })
})

describe('GamePickCard link', () => {
  it('is not a link unless a destination is given', () => {
    render(<GamePickCard game={game()} />)

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('makes the whole card a real link to the destination', () => {
    renderWithRouter(<GamePickCard game={game()} to="/season/2026/week/4/game/Falcons%40Packers" />)

    expect(screen.getByRole('link', { name: 'See who picked Falcons at Packers' })).toHaveAttribute(
      'href',
      '/season/2026/week/4/game/Falcons%40Packers',
    )
  })

  it('passes router state along when the card is opened', async () => {
    const user = userEvent.setup()
    renderWithRouter(<GamePickCard game={game()} to="/next" linkState={{ backLabel: 'Back to dashboard' }} />)

    await user.click(screen.getByRole('link', { name: 'See who picked Falcons at Packers' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/next')
    expect(screen.getByTestId('location-state')).toHaveTextContent('{"backLabel":"Back to dashboard"}')
  })
})


describe('GamePickCard text contrast', () => {
  it.each([
    ['light', '#ffffff'],
    ['dark', '#121212'],
  ] as const)('keeps the LIVE label and the "See who picked" hint readable on the live card in %s mode', (mode, surface) => {
    renderWithRouter(<GamePickCard game={game({ status: 'in_progress', awayScore: 10, homeScore: 7 })} to="/next" />, { mode })

    expect(textContrast(screen.getByText('LIVE 10-7'), surface), 'LIVE label').toBeGreaterThanOrEqual(4.5)
    expect(textContrast(screen.getByText('See who picked each team'), surface), 'link hint').toBeGreaterThanOrEqual(4.5)
  })

  it('keeps the "See who picked" hint readable on an ordinary card too', () => {
    renderWithRouter(<GamePickCard game={game()} to="/next" />)

    expect(textContrast(screen.getByText('See who picked each team'))).toBeGreaterThanOrEqual(4.5)
  })
})
