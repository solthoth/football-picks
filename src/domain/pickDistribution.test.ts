import { describe, expect, it } from 'vitest'
import type { GameResult, Participant, Pool } from '../data/types'
import { computePickDistribution, sortByDivided } from './pickDistribution'
import type { GameDistribution } from './pickDistribution'

const GAME = { id: 'Falcons@Packers', away: 'Falcons', home: 'Packers' }

function participants(game: string, picks: (string | undefined)[]): Participant[] {
  return picks.map((pick, i) => ({
    name: `P${i + 1}`,
    picks: pick === undefined ? {} : { [game]: pick },
    tieBreakerTotalScore: null,
  }))
}

/** `awayCount` Falcons picks, `homeCount` Packers picks, `absent` blanks. */
function splitPool(awayCount: number, homeCount: number, absent = 0, overrides: Partial<Pool> = {}): Pool {
  const picks = [
    ...Array<string>(awayCount).fill('Falcons'),
    ...Array<string>(homeCount).fill('Packers'),
    ...Array<undefined>(absent).fill(undefined),
  ]
  return { season: 2026, week: 4, games: [GAME], participants: participants(GAME.id, picks), results: {}, ...overrides }
}

function result(overrides: Partial<GameResult>): GameResult {
  return { kickoffTime: null, status: 'scheduled', awayScore: null, homeScore: null, winner: null, ...overrides }
}

function only(pool: Pool): GameDistribution {
  return computePickDistribution(pool).games[0]
}

describe('computePickDistribution counts and percentages', () => {
  it('splits a basic 3 vs 7 week', () => {
    const game = only(splitPool(3, 7))
    expect(game).toMatchObject({ awayCount: 3, homeCount: 7, picked: 10, awayPct: 30, homePct: 70, leader: 'home', missing: 0, unrecognized: 0 })
  })

  it('rounds so the two sides always add to 100', () => {
    expect(only(splitPool(1, 2))).toMatchObject({ awayPct: 33, homePct: 67 })
    expect(only(splitPool(2, 1))).toMatchObject({ awayPct: 67, homePct: 33 })
    expect(only(splitPool(1, 7))).toMatchObject({ awayPct: 12, homePct: 88 })
    expect(only(splitPool(7, 1))).toMatchObject({ awayPct: 88, homePct: 12 })
  })

  it('adds to 100 with integers for every possible split up to 40 picks', () => {
    for (let picked = 1; picked <= 40; picked++) {
      for (let awayCount = 0; awayCount <= picked; awayCount++) {
        const game = only(splitPool(awayCount, picked - awayCount))
        expect((game.awayPct as number) + (game.homePct as number)).toBe(100)
        expect(Number.isInteger(game.awayPct)).toBe(true)
        expect(Number.isInteger(game.homePct)).toBe(true)
      }
    }
  })

  it('is mirror-symmetric: swapping the counts swaps the percentages', () => {
    for (let picked = 1; picked <= 40; picked++) {
      for (let awayCount = 0; awayCount <= picked; awayCount++) {
        const a = only(splitPool(awayCount, picked - awayCount))
        const b = only(splitPool(picked - awayCount, awayCount))
        expect(a.awayPct).toBe(b.homePct)
        expect(a.homePct).toBe(b.awayPct)
      }
    }
  })

  it('reports an even split as a 50/50 tie', () => {
    expect(only(splitPool(5, 5))).toMatchObject({ awayPct: 50, homePct: 50, leader: 'tie' })
    expect(only(splitPool(1, 1))).toMatchObject({ awayPct: 50, homePct: 50, leader: 'tie' })
  })

  it('reports a unanimous pick as 100/0', () => {
    expect(only(splitPool(4, 0))).toMatchObject({ awayPct: 100, homePct: 0, leader: 'away' })
    expect(only(splitPool(0, 4))).toMatchObject({ awayPct: 0, homePct: 100, leader: 'home' })
  })

  it('has null percentages and no NaN when nobody picked the game', () => {
    const game = only(splitPool(0, 0, 3))
    expect(game).toMatchObject({ picked: 0, awayPct: null, homePct: null, leader: null, crowd: 'pending', missing: 3 })
    expect(JSON.stringify(game)).not.toMatch(/NaN/)
  })

  it('uses the picks actually made as the denominator when some are missing', () => {
    const game = only(splitPool(3, 5, 2))
    expect(game).toMatchObject({ picked: 8, missing: 2, awayPct: 37, homePct: 63 })
  })

  it('counts a pick naming neither team as unrecognized, not as picked', () => {
    const pool = splitPool(2, 3, 1)
    pool.participants.push({ name: 'Typo', picks: { [GAME.id]: 'Packerz' }, tieBreakerTotalScore: null })
    const game = only(pool)
    expect(game).toMatchObject({ unrecognized: 1, picked: 5, missing: 1 })
    expect(game.missing + game.unrecognized + game.picked).toBe(computePickDistribution(pool).participantCount)
  })

  it('treats whitespace and case variants of a team name as unrecognized', () => {
    const pool = splitPool(1, 1)
    for (const [i, pick] of ['packers', ' Packers', 'FALCONS', 'Falcons '].entries()) {
      pool.participants.push({ name: `V${i}`, picks: { [GAME.id]: pick }, tieBreakerTotalScore: null })
    }
    const game = only(pool)
    expect(game).toMatchObject({ unrecognized: 4, picked: 2, missing: 0 })
  })

  it('handles an empty roster and an empty slate', () => {
    const noParticipants = computePickDistribution(splitPool(0, 0))
    expect(noParticipants.participantCount).toBe(0)
    expect(noParticipants.games[0]).toMatchObject({ picked: 0, missing: 0, awayPct: null })
    expect(noParticipants.summary).toEqual({ mostPopular: null, mostDivided: null })

    expect(computePickDistribution(splitPool(2, 2, 0, { games: [] })).games).toEqual([])
  })
})

describe('computePickDistribution results', () => {
  const finalWith = (winner: string | null, overrides: Partial<GameResult> = {}) =>
    result({ status: 'final', awayScore: 24, homeScore: 17, winner, ...overrides })

  it('flags an upset when the minority side wins', () => {
    const game = only(splitPool(3, 7, 0, { results: { [GAME.id]: finalWith('Falcons') } }))
    expect(game).toMatchObject({ winnerSide: 'away', crowd: 'upset', status: 'final', awayScore: 24, homeScore: 17 })
  })

  it('flags crowd-right when the majority side wins', () => {
    const game = only(splitPool(3, 7, 0, { results: { [GAME.id]: finalWith('Packers') } }))
    expect(game).toMatchObject({ winnerSide: 'home', crowd: 'crowd-right' })
  })

  it('calls a final game with tied counts a split', () => {
    const game = only(splitPool(5, 5, 0, { results: { [GAME.id]: finalWith('Packers') } }))
    expect(game.crowd).toBe('split')
  })

  it('ignores a winner field on games that are not final', () => {
    for (const status of ['scheduled', 'in_progress'] as const) {
      const game = only(splitPool(3, 7, 0, { results: { [GAME.id]: result({ status, winner: 'Falcons' }) } }))
      expect(game).toMatchObject({ winnerSide: null, crowd: 'pending', status })
    }
  })

  it('is pending for a final game with no winner', () => {
    const game = only(splitPool(3, 7, 0, { results: { [GAME.id]: finalWith(null) } }))
    expect(game).toMatchObject({ winnerSide: null, crowd: 'pending', status: 'final' })
  })

  it('is pending when the winner names neither team', () => {
    const game = only(splitPool(3, 7, 0, { results: { [GAME.id]: finalWith('Bears') } }))
    expect(game).toMatchObject({ winnerSide: null, crowd: 'pending' })
  })

  it('has no marker when nobody picked a game that finished', () => {
    const game = only(splitPool(0, 0, 2, { results: { [GAME.id]: finalWith('Packers') } }))
    expect(game).toMatchObject({ winnerSide: 'home', crowd: 'pending' })
  })

  it('claims no crowd verdict when any pick for the game was unrecognized', () => {
    const pool = splitPool(3, 7, 0, { results: { [GAME.id]: finalWith('Falcons') } })
    pool.participants.push({ name: 'Typo', picks: { [GAME.id]: 'Packerz' }, tieBreakerTotalScore: null })
    expect(only(pool)).toMatchObject({ unrecognized: 1, winnerSide: 'away', crowd: 'pending' })

    const tied = splitPool(5, 5, 0, { results: { [GAME.id]: finalWith('Packers') } })
    tied.participants.push({ name: 'Typo', picks: { [GAME.id]: 'Packerz' }, tieBreakerTotalScore: null })
    expect(only(tied).crowd).toBe('pending')
  })

  it('reports an unknown status and null details when there is no result entry', () => {
    expect(only(splitPool(3, 7))).toMatchObject({ status: 'unknown', kickoffTime: null, awayScore: null, homeScore: null, winnerSide: null })
  })
})

describe('computePickDistribution ordering', () => {
  const games = [
    { id: 'C@D', away: 'C', home: 'D' },
    { id: 'A@B', away: 'A', home: 'B' },
    { id: 'E@F', away: 'E', home: 'F' },
  ]
  const base: Pool = { season: 2026, week: 4, games, participants: [], results: {} }

  it('sorts by kickoff when every game has one, regardless of file order', () => {
    const pool: Pool = {
      ...base,
      results: {
        'C@D': result({ kickoffTime: '2026-09-27T20:00:00Z' }),
        'A@B': result({ kickoffTime: '2026-09-27T17:00:00Z' }),
        'E@F': result({ kickoffTime: '2026-09-28T00:20:00Z' }),
      },
    }
    expect(computePickDistribution(pool).games.map((g) => g.gameId)).toEqual(['A@B', 'C@D', 'E@F'])
  })

  it('keeps file order when any kickoff is unknown', () => {
    const pool: Pool = {
      ...base,
      results: { 'C@D': result({ kickoffTime: '2026-09-27T20:00:00Z' }), 'A@B': result({ kickoffTime: '2026-09-27T17:00:00Z' }) },
    }
    expect(computePickDistribution(pool).games.map((g) => g.gameId)).toEqual(['C@D', 'A@B', 'E@F'])
  })
})

describe('sortByDivided', () => {
  function dist(gameId: string, awayCount: number, homeCount: number): GameDistribution {
    return { ...only(splitPool(awayCount, homeCount)), gameId }
  }

  it('orders closest splits first, stable on ties, with unpicked games last', () => {
    const input = [dist('lopsided', 9, 1), dist('empty', 0, 0), dist('tieA', 5, 5), dist('mild', 4, 6), dist('tieB', 3, 3)]
    const snapshot = [...input]

    const sorted = sortByDivided(input)

    expect(sorted.map((g) => g.gameId)).toEqual(['tieA', 'tieB', 'mild', 'lopsided', 'empty'])
    expect(input).toEqual(snapshot)
    expect(sorted).not.toBe(input)
  })
})

describe('computePickDistribution summary', () => {
  function multiPool(picksPerGame: Record<string, string[]>): Pool {
    const ids = Object.keys(picksPerGame)
    const count = Math.max(...ids.map((id) => picksPerGame[id].length))
    return {
      season: 2026,
      week: 4,
      games: ids.map((id) => {
        const [away, home] = id.split('@')
        return { id, away, home }
      }),
      participants: Array.from({ length: count }, (_, i) => ({
        name: `P${i}`,
        picks: Object.fromEntries(ids.map((id) => [id, picksPerGame[id][i]]).filter(([, pick]) => pick !== undefined)),
        tieBreakerTotalScore: null,
      })),
      results: {},
    }
  }

  it('picks the highest single-side percentage as most popular, ties going to the earlier game', () => {
    const pool = multiPool({
      'A@B': ['A', 'A', 'A', 'B'],
      'C@D': ['D', 'D', 'D', 'D'],
      'E@F': ['E', 'E', 'E', 'E'],
    })
    expect(computePickDistribution(pool).summary.mostPopular).toEqual({ gameId: 'C@D', away: 'C', home: 'D', team: 'D', pct: 100, count: 4, picked: 4 })
  })

  it('picks the smallest gap as most divided, ties going to the earlier game', () => {
    const pool = multiPool({
      'A@B': ['A', 'A', 'A', 'B'],
      'C@D': ['C', 'C', 'D', 'D'],
      'E@F': ['E', 'F', 'E', 'F'],
    })
    expect(computePickDistribution(pool).summary.mostDivided).toEqual({ gameId: 'C@D', away: 'C', home: 'D', awayPct: 50, homePct: 50 })
  })

  it('skips tied games when choosing the most popular pick', () => {
    const pool = multiPool({
      'A@B': ['A', 'B'],
      'C@D': ['C', 'C'],
    })
    expect(computePickDistribution(pool).summary.mostPopular).toMatchObject({ gameId: 'C@D', team: 'C', pct: 100 })

    const allTied = multiPool({ 'A@B': ['A', 'B'], 'C@D': ['D', 'C'] })
    const { summary } = computePickDistribution(allTied)
    expect(summary.mostPopular).toBeNull()
    expect(summary.mostDivided).toMatchObject({ gameId: 'A@B', awayPct: 50, homePct: 50 })
  })

  it('does not count an exact 50% split as popular even though it is the leading pct', () => {
    // Only game is 50/50: no strict leader, so no most-popular tile.
    expect(computePickDistribution(multiPool({ 'A@B': ['A', 'B', 'A', 'B'] })).summary.mostPopular).toBeNull()
  })

  it('compares popularity exactly, preferring more picks on equal ratios', () => {
    const pool = multiPool({
      'A@B': ['A'],
      'C@D': ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D'],
    })
    expect(computePickDistribution(pool).summary.mostPopular).toMatchObject({ gameId: 'C@D', team: 'D', count: 10, picked: 10 })

    // Earlier game still wins when ratio and picked are both equal.
    const equal = multiPool({ 'A@B': ['A', 'A'], 'C@D': ['D', 'D'] })
    expect(computePickDistribution(equal).summary.mostPopular?.gameId).toBe('A@B')
  })

  it('uses the exact ratio, not the rounded pct, to rank popularity', () => {
    // 199 of 200 and 200 of 200 both display as 100%, but the latter is more popular.
    const pool = multiPool({
      'A@B': [...Array<string>(199).fill('A'), 'B'],
      'C@D': Array<string>(200).fill('D'),
    })
    const { games, summary } = computePickDistribution(pool)
    expect(games[0].awayPct).toBe(100)
    expect(summary.mostPopular).toMatchObject({ gameId: 'C@D', pct: 100, count: 200, picked: 200 })
  })

  it('ranks divided-ness by the exact gap ratio rather than rounded percentages', () => {
    // 51 vs 49 of 100 and 101 vs 99 of 200 both round to a 51/49 display, but the latter is closer.
    const pool = multiPool({
      'A@B': [...Array<string>(51).fill('A'), ...Array<string>(49).fill('B')],
      'C@D': [...Array<string>(101).fill('C'), ...Array<string>(99).fill('D')],
    })
    const { games, summary } = computePickDistribution(pool)
    expect(games.map((g) => g.awayPct)).toEqual([51, 51])
    expect(summary.mostDivided?.gameId).toBe('C@D')
    expect(sortByDivided(games).map((g) => g.gameId)).toEqual(['C@D', 'A@B'])
  })

  it('bases the summary on valid picks when unrecognized picks dominate a game', () => {
    const pool = multiPool({
      'A@B': ['A', 'Z', 'Z', 'Z', 'Z', 'Z'],
      'C@D': ['C', 'D', 'C', 'C', 'D', 'D'],
    })
    const { games, summary } = computePickDistribution(pool)
    expect(games[0]).toMatchObject({ picked: 1, unrecognized: 5, awayPct: 100, crowd: 'pending' })
    // 1 of 1 and the 3-3 split: the unanimous valid pick still wins popularity.
    expect(summary.mostPopular).toEqual({ gameId: 'A@B', away: 'A', home: 'B', team: 'A', pct: 100, count: 1, picked: 1 })
    expect(summary.mostDivided).toMatchObject({ gameId: 'C@D', awayPct: 50, homePct: 50 })
  })

  it('has no summary when every pick for every game is unrecognized', () => {
    const pool = multiPool({ 'A@B': ['Z', 'Y'], 'C@D': ['Z', 'Y'] })
    expect(computePickDistribution(pool).summary).toEqual({ mostPopular: null, mostDivided: null })
  })

  it('ignores games nobody picked', () => {
    const pool = multiPool({
      'A@B': ['A', 'B', 'B'],
      'C@D': [],
    })
    pool.games.push({ id: 'X@Y', away: 'X', home: 'Y' })
    const { summary } = computePickDistribution(pool)
    expect(summary.mostPopular?.gameId).toBe('A@B')
    expect(summary.mostDivided?.gameId).toBe('A@B')
  })
})

describe('computePickDistribution purity', () => {
  it('returns deep-equal output on repeat calls and leaves the pool untouched', () => {
    const pool = splitPool(3, 7, 1, { results: { [GAME.id]: result({ status: 'final', winner: 'Falcons', awayScore: 3, homeScore: 0 }) } })
    const snapshot = structuredClone(pool)

    expect(computePickDistribution(pool)).toEqual(computePickDistribution(pool))
    expect(pool).toEqual(snapshot)
  })
})
