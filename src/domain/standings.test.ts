import { describe, expect, it } from 'vitest'
import type { Pool } from '../data/types'
import { buildLeaderboard, getPickOutcomes, summarizeOutcomes } from './standings'

const pool: Pool = {
  season: 2026,
  week: 1,
  games: [
    { id: 'game_01', away: 'Patriots', home: 'Seahawks' },
    { id: 'game_02', away: '49ers', home: 'Rams' },
    { id: 'game_03', away: 'Falcons', home: 'Steelers' },
  ],
  participants: [
    {
      name: 'Steve',
      picks: { game_01: 'Seahawks', game_02: 'Rams', game_03: 'Falcons' },
      tieBreakerTotalScore: 44,
    },
    {
      name: 'Greg',
      picks: { game_01: 'Patriots', game_02: 'Rams', game_03: 'Steelers' },
      tieBreakerTotalScore: 40,
    },
  ],
  results: {
    game_01: { kickoffTime: null, status: 'final', awayScore: 10, homeScore: 13, winner: 'Seahawks' },
    game_02: { kickoffTime: null, status: 'final', awayScore: 27, homeScore: 7, winner: '49ers' },
    game_03: { kickoffTime: null, status: 'in_progress', awayScore: 3, homeScore: 0, winner: null },
  },
}

describe('getPickOutcomes', () => {
  it('marks a pick correct when it matches the final winner', () => {
    const outcomes = getPickOutcomes(pool, pool.participants[0])
    expect(outcomes.find((o) => o.gameId === 'game_01')?.correct).toBe(true)
  })

  it('marks a pick incorrect when it does not match the final winner', () => {
    const outcomes = getPickOutcomes(pool, pool.participants[0])
    expect(outcomes.find((o) => o.gameId === 'game_02')?.correct).toBe(false)
  })

  it('leaves a pick undecided while the game is not final', () => {
    const outcomes = getPickOutcomes(pool, pool.participants[0])
    const game3 = outcomes.find((o) => o.gameId === 'game_03')
    expect(game3?.correct).toBeNull()
    expect(game3?.status).toBe('in_progress')
  })

  it('reports "unknown" status when no result exists for a game at all', () => {
    const poolWithoutResults: Pool = { ...pool, results: {} }
    const outcomes = getPickOutcomes(poolWithoutResults, pool.participants[0])
    expect(outcomes.every((o) => o.status === 'unknown' && o.correct === null)).toBe(true)
  })
})

describe('summarizeOutcomes', () => {
  it('tallies correct/incorrect/pending counts', () => {
    const outcomes = getPickOutcomes(pool, pool.participants[0])
    const summary = summarizeOutcomes('Steve', outcomes)
    expect(summary).toEqual({ name: 'Steve', correct: 1, incorrect: 1, pending: 1, totalGames: 3 })
  })
})

describe('buildLeaderboard', () => {
  it('ranks participants by correct picks, most correct first', () => {
    const leaderboard = buildLeaderboard(pool)
    // Steve: game_01 correct (Seahawks), game_02 incorrect (Rams vs 49ers) -> 1 correct
    // Greg: game_01 incorrect (Patriots vs Seahawks), game_02 incorrect (Rams vs 49ers) -> 0 correct
    expect(leaderboard.map((e) => [e.name, e.correct, e.rank])).toEqual([
      ['Steve', 1, 1],
      ['Greg', 0, 2],
    ])
  })

  it('gives tied participants the same rank', () => {
    const tiedPool: Pool = {
      ...pool,
      participants: [
        { name: 'Zed', picks: { game_01: 'Seahawks', game_02: 'Rams', game_03: 'Steelers' }, tieBreakerTotalScore: 0 },
        { name: 'Amy', picks: { game_01: 'Seahawks', game_02: 'Rams', game_03: 'Falcons' }, tieBreakerTotalScore: 0 },
      ],
    }
    // Both get game_01 correct and game_02 incorrect (1 correct each) -> tied at rank 1, alphabetical order
    const leaderboard = buildLeaderboard(tiedPool)
    expect(leaderboard.map((e) => [e.name, e.rank])).toEqual([
      ['Amy', 1],
      ['Zed', 1],
    ])
  })

  it('gives the next distinct rank to the next distinct score', () => {
    const poolWithClearWinner: Pool = {
      ...pool,
      participants: [
        { name: 'Winner', picks: { game_01: 'Seahawks', game_02: '49ers', game_03: 'Falcons' }, tieBreakerTotalScore: 0 },
        { name: 'Loser', picks: { game_01: 'Patriots', game_02: 'Rams', game_03: 'Steelers' }, tieBreakerTotalScore: 0 },
      ],
    }
    const leaderboard = buildLeaderboard(poolWithClearWinner)
    expect(leaderboard.map((e) => [e.name, e.rank])).toEqual([
      ['Winner', 1],
      ['Loser', 2],
    ])
  })
})
