import { describe, expect, it } from 'vitest'
import { buildPools } from './buildPools'

const PICKS_WEEK_1 = `
pool:
  season: 2026
  week: 1
  pot: 100
games:
  - id: game_01
    away: Patriots
    home: Seahawks
  - id: game_02
    away: 49ers
    home: Rams
participants:
  - name: Steve
    picks:
      game_01: Seahawks
      game_02: Rams
    tie_breaker_total_score: 44
  - name: Greg
    picks:
      game_01: Patriots
      game_02: 49ers
    tie_breaker_total_score: 40
`

const RESULTS_WEEK_1_EARLY = `
pool:
  season: 2026
  week: 1
game_01:
  kickoff_time: "2026-09-10T17:00:00Z"
  status: "final"
  away_score: 10
  home_score: 13
  winner: "Seahawks"
game_02:
  kickoff_time: null
  status: "scheduled"
  away_score: null
  home_score: null
  winner: null
`

const RESULTS_WEEK_1_LATER = `
pool:
  season: 2026
  week: 1
game_01:
  kickoff_time: "2026-09-10T17:00:00Z"
  status: "final"
  away_score: 10
  home_score: 13
  winner: "Seahawks"
game_02:
  kickoff_time: "2026-09-11T17:00:00Z"
  status: "final"
  away_score: 27
  home_score: 7
  winner: "49ers"
`

const PICKS_WEEK_2 = `
pool:
  season: 2026
  week: 2
games:
  - id: game_01
    away: Bears
    home: Packers
participants:
  - name: Steve
    picks:
      game_01: Packers
    tie_breaker_total_score: 20
`

describe('buildPools', () => {
  it('merges a picks file with its matching results file by season/week', () => {
    const [pool] = buildPools({
      'data/nfl_pool_week-1.yaml': PICKS_WEEK_1,
      'data/nfl_pool_week-1_results-20260910.yaml': RESULTS_WEEK_1_EARLY,
    })

    expect(pool.season).toBe(2026)
    expect(pool.week).toBe(1)
    expect(pool.pot).toBe(100)
    expect(pool.games).toHaveLength(2)
    expect(pool.participants.map((p) => p.name)).toEqual(['Steve', 'Greg'])
    expect(pool.results.game_01).toEqual({
      kickoffTime: '2026-09-10T17:00:00Z',
      status: 'final',
      awayScore: 10,
      homeScore: 13,
      winner: 'Seahawks',
    })
  })

  it('picks the results file with the greatest date suffix when several exist for the same week', () => {
    const [pool] = buildPools({
      'data/nfl_pool_week-1.yaml': PICKS_WEEK_1,
      'data/nfl_pool_week-1_results-20260910.yaml': RESULTS_WEEK_1_EARLY,
      'data/nfl_pool_week-1_results-20260911.yaml': RESULTS_WEEK_1_LATER,
    })

    expect(pool.results.game_02?.status).toBe('final')
    expect(pool.results.game_02?.winner).toBe('49ers')
  })

  it('leaves results empty when no results file exists yet for a week', () => {
    const [pool] = buildPools({
      'data/nfl_pool_week-1.yaml': PICKS_WEEK_1,
    })

    expect(pool.results).toEqual({})
  })

  it('returns one pool per season/week, sorted by season desc then week asc', () => {
    const pools = buildPools({
      'data/nfl_pool_week-1.yaml': PICKS_WEEK_1,
      'data/nfl_pool_week-2.yaml': PICKS_WEEK_2,
    })

    expect(pools.map((p) => [p.season, p.week])).toEqual([
      [2026, 1],
      [2026, 2],
    ])
  })

  it('ignores files that are neither picks nor results files', () => {
    const pools = buildPools({
      'data/nfl_pool_week-1.yaml': PICKS_WEEK_1,
      'data/not-pool-data.yaml': 'foo: bar\n',
    })

    expect(pools).toHaveLength(1)
  })

  it('ignores files that fail to parse as YAML', () => {
    const pools = buildPools({
      'data/nfl_pool_week-1.yaml': PICKS_WEEK_1,
      'data/broken.yaml': '{ this is not: valid yaml: [',
    })

    expect(pools).toHaveLength(1)
  })

  it('defaults an unrecognized result status to "scheduled"', () => {
    const [pool] = buildPools({
      'data/nfl_pool_week-1.yaml': PICKS_WEEK_1,
      'data/nfl_pool_week-1_results-20260910.yaml': `
pool:
  season: 2026
  week: 1
game_01:
  kickoff_time: null
  status: "postponed"
  away_score: null
  home_score: null
  winner: null
`,
    })

    expect(pool.results.game_01?.status).toBe('scheduled')
  })
})
