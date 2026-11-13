import { describe, expect, it } from 'vitest'
import type { Pool } from '../data/types'
import { buildSeasonStandings } from './seasonStandings'

// Three games; game "g3" is the tiebreaker (it is last, and no kickoff times are known). Every pick is either
// right ("A") or wrong ("H") for each game, which keeps the fixtures readable.
const GAMES = [
  { id: 'g1', away: 'A1', home: 'H1' },
  { id: 'g2', away: 'A2', home: 'H2' },
  { id: 'g3', away: 'A3', home: 'H3' },
]

type Right = [boolean, boolean, boolean]
interface Person {
  right: Right
  guess?: number | null
}

function weekPool(week: number, pot: number | undefined, people: Record<string, Person>, g1Status: 'final' | 'in_progress' | 'scheduled' = 'final'): Pool {
  const result = (status: 'final' | 'in_progress' | 'scheduled', winner: string) => ({
    kickoffTime: null,
    status,
    awayScore: status === 'scheduled' ? null : 20,
    homeScore: status === 'scheduled' ? null : 10,
    winner: status === 'final' ? winner : null,
  })
  return {
    season: 2026,
    week,
    pot,
    games: GAMES,
    participants: Object.entries(people).map(([name, { right, guess }]) => ({
      name,
      picks: { g1: right[0] ? 'A1' : 'H1', g2: right[1] ? 'A2' : 'H2', g3: right[2] ? 'A3' : 'H3' },
      tieBreakerTotalScore: guess === undefined ? 30 : guess,
    })),
    results: { g1: result(g1Status, 'A1'), g2: result('final', 'A2'), g3: result('final', 'A3') },
  }
}

const row = (standings: ReturnType<typeof buildSeasonStandings>, name: string) => standings.entries.find((e) => e.name === name)

describe('buildSeasonStandings', () => {
  it('counts a week win and pays the whole pot to a sole winner', () => {
    const standings = buildSeasonStandings([weekPool(1, 150, { A: { right: [true, true, true] }, B: { right: [true, false, false] } })])

    expect(row(standings, 'A')).toMatchObject({ weeksWon: 1, winnings: 150, correct: 3, decided: 3 })
    expect(row(standings, 'B')).toMatchObject({ weeksWon: 0, winnings: 0, correct: 1, decided: 3 })
    expect(standings.weeks).toEqual([{ week: 1, winners: ['A'], pot: 150, share: 150, decided: true }])
  })

  it('adds wins, winnings and correct picks across weeks, however the weeks are ordered', () => {
    const standings = buildSeasonStandings([
      weekPool(2, 195, { A: { right: [false, false, false] }, B: { right: [true, true, true] } }),
      weekPool(1, 150, { A: { right: [true, true, true] }, B: { right: [false, false, false] } }),
    ])

    expect(row(standings, 'A')).toMatchObject({ weeksWon: 1, winnings: 150, correct: 3, decided: 6 })
    expect(row(standings, 'B')).toMatchObject({ weeksWon: 1, winnings: 195, correct: 3, decided: 6 })
    expect(standings.weeks.map((w) => w.week)).toEqual([1, 2])
    expect(standings).toMatchObject({ weeksDecided: 2, weeksTotal: 2, totalPaidOut: 345 })
  })

  it('splits the pot between co-winners and counts the win for each', () => {
    const same: Person = { right: [true, true, true], guess: 30 }
    const standings = buildSeasonStandings([weekPool(1, 150, { A: same, B: same, C: { right: [false, false, false] } })])

    expect(row(standings, 'A')).toMatchObject({ weeksWon: 1, winnings: 75 })
    expect(row(standings, 'B')).toMatchObject({ weeksWon: 1, winnings: 75 })
    expect(row(standings, 'C')).toMatchObject({ weeksWon: 0, winnings: 0 })
    expect(standings.weeks[0]).toMatchObject({ winners: ['A', 'B'], share: 75, decided: true })
    expect(standings.totalPaidOut).toBe(150)
  })

  it('counts picks from a week that is not decided yet, but gives out no win', () => {
    const standings = buildSeasonStandings([weekPool(1, 150, { A: { right: [true, true, true] }, B: { right: [true, false, true] } }, 'in_progress')])

    expect(row(standings, 'A')).toMatchObject({ weeksWon: 0, winnings: 0, correct: 2, decided: 2 })
    expect(row(standings, 'B')).toMatchObject({ weeksWon: 0, winnings: 0, correct: 1, decided: 2 })
    expect(standings.weeks[0]).toMatchObject({ winners: [], decided: false })
    expect(standings).toMatchObject({ weeksDecided: 0, weeksTotal: 1, totalPaidOut: 0 })
  })

  it('still counts the win when a week has no pot recorded, with no money attached', () => {
    const standings = buildSeasonStandings([weekPool(1, undefined, { A: { right: [true, true, true] }, B: { right: [false, false, false] } })])

    expect(row(standings, 'A')).toMatchObject({ weeksWon: 1, winnings: 0 })
    expect(standings.weeks[0]).toMatchObject({ winners: ['A'], pot: undefined, share: 0 })
  })

  it('includes people who missed a week, counting only the weeks they played', () => {
    const standings = buildSeasonStandings([
      weekPool(1, 150, { A: { right: [true, true, true] } }),
      weekPool(2, 150, { A: { right: [true, true, true] }, Late: { right: [true, true, true] } }),
    ])

    expect(row(standings, 'Late')).toMatchObject({ decided: 3, correct: 3 })
    expect(row(standings, 'A')).toMatchObject({ decided: 6, correct: 6 })
  })
})

describe('buildSeasonStandings ranking', () => {
  const wins = (...names: string[]) => names.map((name, i) => weekPool(i + 1, 100, { [name]: { right: [true, true, true] }, Zed: { right: [false, false, false] } }))

  it('ranks by winnings first, then weeks won, then correct picks, then name', () => {
    const standings = buildSeasonStandings([
      weekPool(1, 100, { Big: { right: [true, true, true] }, Many: { right: [false, false, false] }, Few: { right: [false, false, false] } }),
      weekPool(2, 100, { Many: { right: [true, true, true] }, Big: { right: [false, false, false] }, Few: { right: [false, false, false] } }),
      weekPool(3, 400, { Few: { right: [true, true, true] }, Big: { right: [false, false, false] }, Many: { right: [false, false, false] } }),
    ])

    // Few: $400 (1 win). Big and Many: $100 each (1 win each, 3 correct each, 3 more wrong) -> alphabetical.
    expect(standings.entries.map((e) => [e.name, e.winnings, e.rank])).toEqual([
      ['Few', 400, 1],
      ['Big', 100, 2],
      ['Many', 100, 2],
    ])
  })

  it('gives tied people the same rank and the next distinct rank to the next score', () => {
    const standings = buildSeasonStandings([...wins('A'), weekPool(2, 100, { B: { right: [true, true, true] }, Zed: { right: [false, false, false] }, A: { right: [false, false, false] } })])

    expect(standings.entries.map((e) => [e.name, e.rank])).toEqual([
      ['A', 1],
      ['B', 1],
      ['Zed', 3],
    ])
  })

  it('breaks a winnings tie by weeks won, then by correct picks', () => {
    const standings = buildSeasonStandings([
      weekPool(1, 100, { OneBig: { right: [true, true, true] }, TwoSmall: { right: [false, false, false] } }),
      weekPool(2, 50, { TwoSmall: { right: [true, true, true] }, OneBig: { right: [false, false, false] } }),
      weekPool(3, 50, { TwoSmall: { right: [true, true, true] }, OneBig: { right: [false, false, false] } }),
    ])

    // Both won $100; TwoSmall won in two weeks, so ranks ahead.
    expect(standings.entries.map((e) => e.name)).toEqual(['TwoSmall', 'OneBig'])
  })

  it('leaves everyone unranked, in alphabetical order, until some pick is decided', () => {
    const notStarted: Pool = {
      ...weekPool(1, 150, { Zed: { right: [true, true, true] }, Amy: { right: [true, true, true] } }),
      results: {
        g1: { kickoffTime: null, status: 'scheduled', awayScore: null, homeScore: null, winner: null },
        g2: { kickoffTime: null, status: 'scheduled', awayScore: null, homeScore: null, winner: null },
        g3: { kickoffTime: null, status: 'scheduled', awayScore: null, homeScore: null, winner: null },
      },
    }
    const standings = buildSeasonStandings([notStarted])

    expect(standings.entries.map((e) => [e.name, e.rank])).toEqual([
      ['Amy', null],
      ['Zed', null],
    ])
  })

  it('is empty for a season with no weeks', () => {
    expect(buildSeasonStandings([])).toEqual({ entries: [], weeks: [], weeksDecided: 0, weeksTotal: 0, totalPaidOut: 0 })
  })
})
