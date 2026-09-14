import { describe, expect, it } from 'vitest'
import type { Pool } from '../data/types'
import { determineWeekWinner, getTiebreakerGame } from './weekWinner'

// game_03 is the tiebreaker (Monday) game: it kicks off latest, and by
// convention is also last in the games list.
const GAMES = [
  { id: 'game_01', away: 'Patriots', home: 'Seahawks' },
  { id: 'game_02', away: '49ers', home: 'Rams' },
  { id: 'game_03', away: 'Falcons', home: 'Steelers' },
]

function basePool(overrides: Partial<Pool>): Pool {
  return {
    season: 2026,
    week: 1,
    games: GAMES,
    participants: [],
    results: {},
    ...overrides,
  }
}

describe('getTiebreakerGame', () => {
  it('picks the game with the latest kickoff time when all are known', () => {
    const pool = basePool({
      results: {
        game_01: { kickoffTime: '2026-09-13T17:00:00Z', status: 'final', awayScore: 1, homeScore: 0, winner: 'Patriots' },
        game_02: { kickoffTime: '2026-09-13T20:00:00Z', status: 'final', awayScore: 1, homeScore: 0, winner: '49ers' },
        game_03: { kickoffTime: '2026-09-14T23:00:00Z', status: 'scheduled', awayScore: null, homeScore: null, winner: null },
      },
    })
    expect(getTiebreakerGame(pool)?.id).toBe('game_03')
  })

  it('falls back to the last listed game when any kickoff time is unknown', () => {
    const pool = basePool({ results: {} })
    expect(getTiebreakerGame(pool)?.id).toBe('game_03')
  })

  it('returns undefined for a pool with no games', () => {
    expect(getTiebreakerGame(basePool({ games: [] }))).toBeUndefined()
  })
})

describe('determineWeekWinner', () => {
  it('returns no winner while a non-tiebreaker game is still in progress', () => {
    const pool = basePool({
      participants: [
        { name: 'A', picks: { game_01: 'Seahawks', game_02: 'Rams', game_03: 'Falcons' }, tieBreakerTotalScore: 40 },
      ],
      results: {
        game_01: { kickoffTime: null, status: 'in_progress', awayScore: 0, homeScore: 0, winner: null },
        game_02: { kickoffTime: null, status: 'final', awayScore: 20, homeScore: 10, winner: '49ers' },
        game_03: { kickoffTime: null, status: 'scheduled', awayScore: null, homeScore: null, winner: null },
      },
    })
    expect(determineWeekWinner(pool)).toEqual({ winnerName: null, reason: 'incomplete' })
  })

  it('declares a clear leader once Sunday games are final, even before the tiebreaker game is played', () => {
    const pool = basePool({
      participants: [
        { name: 'Leader', picks: { game_01: 'Seahawks', game_02: 'Rams', game_03: 'Falcons' }, tieBreakerTotalScore: 40 },
        { name: 'Behind', picks: { game_01: 'Patriots', game_02: 'Rams', game_03: 'Falcons' }, tieBreakerTotalScore: 40 },
      ],
      results: {
        game_01: { kickoffTime: null, status: 'final', awayScore: 10, homeScore: 20, winner: 'Seahawks' },
        game_02: { kickoffTime: null, status: 'final', awayScore: 20, homeScore: 10, winner: '49ers' },
        game_03: { kickoffTime: null, status: 'scheduled', awayScore: null, homeScore: null, winner: null },
      },
    })
    // Leader: 2/2 Sunday games correct. Behind: 1/2. No tie -> Leader wins already.
    expect(determineWeekWinner(pool)).toEqual({ winnerName: 'Leader', reason: 'clear-leader' })
  })

  it('returns no winner when tied after Sunday and the tiebreaker game has not finished', () => {
    const pool = basePool({
      participants: [
        { name: 'A', picks: { game_01: 'Seahawks', game_02: 'Rams', game_03: 'Falcons' }, tieBreakerTotalScore: 40 },
        { name: 'B', picks: { game_01: 'Seahawks', game_02: 'Rams', game_03: 'Steelers' }, tieBreakerTotalScore: 45 },
      ],
      results: {
        game_01: { kickoffTime: null, status: 'final', awayScore: 10, homeScore: 20, winner: 'Seahawks' },
        game_02: { kickoffTime: null, status: 'final', awayScore: 20, homeScore: 10, winner: '49ers' },
        game_03: { kickoffTime: null, status: 'in_progress', awayScore: 3, homeScore: 0, winner: null },
      },
    })
    expect(determineWeekWinner(pool)).toEqual({ winnerName: null, reason: 'incomplete' })
  })

  it('breaks a Sunday tie using the tiebreaker game when exactly one of the tied group picked it correctly', () => {
    const pool = basePool({
      participants: [
        { name: 'PickedFalcons', picks: { game_01: 'Seahawks', game_02: 'Rams', game_03: 'Falcons' }, tieBreakerTotalScore: 40 },
        { name: 'PickedSteelers', picks: { game_01: 'Seahawks', game_02: 'Rams', game_03: 'Steelers' }, tieBreakerTotalScore: 45 },
        { name: 'NotTied', picks: { game_01: 'Patriots', game_02: 'Rams', game_03: 'Falcons' }, tieBreakerTotalScore: 40 },
      ],
      results: {
        game_01: { kickoffTime: null, status: 'final', awayScore: 10, homeScore: 20, winner: 'Seahawks' },
        game_02: { kickoffTime: null, status: 'final', awayScore: 20, homeScore: 10, winner: '49ers' },
        game_03: { kickoffTime: null, status: 'final', awayScore: 13, homeScore: 20, winner: 'Steelers' },
      },
    })
    // PickedFalcons and PickedSteelers tie 2/2 on Sunday; NotTied has 1/2.
    // Only PickedSteelers got the tiebreaker game (Steelers) right.
    expect(determineWeekWinner(pool)).toEqual({ winnerName: 'PickedSteelers', reason: 'monday-tiebreak' })
  })

  it('falls through to the score tiebreak when the tied group split the tiebreaker game the same way as each other', () => {
    const pool = basePool({
      participants: [
        { name: 'CloseGuess', picks: { game_01: 'Seahawks', game_02: 'Rams', game_03: 'Steelers' }, tieBreakerTotalScore: 32 },
        { name: 'FarGuess', picks: { game_01: 'Seahawks', game_02: 'Rams', game_03: 'Steelers' }, tieBreakerTotalScore: 10 },
      ],
      results: {
        game_01: { kickoffTime: null, status: 'final', awayScore: 10, homeScore: 20, winner: 'Seahawks' },
        game_02: { kickoffTime: null, status: 'final', awayScore: 20, homeScore: 10, winner: '49ers' },
        game_03: { kickoffTime: null, status: 'final', awayScore: 13, homeScore: 20, winner: 'Steelers' },
      },
    })
    // Both tied 2/2 on Sunday and both picked Steelers (tiebreaker) correctly, so
    // that doesn't separate them. Actual combined score is 33; CloseGuess (32) is closer.
    expect(determineWeekWinner(pool)).toEqual({ winnerName: 'CloseGuess', reason: 'score-tiebreak' })
  })

  it('falls through to the score tiebreak using the full tied group when none of them got the tiebreaker game right', () => {
    const pool = basePool({
      participants: [
        { name: 'CloseGuess', picks: { game_01: 'Seahawks', game_02: 'Rams', game_03: 'Falcons' }, tieBreakerTotalScore: 32 },
        { name: 'FarGuess', picks: { game_01: 'Seahawks', game_02: 'Rams', game_03: 'Falcons' }, tieBreakerTotalScore: 10 },
      ],
      results: {
        game_01: { kickoffTime: null, status: 'final', awayScore: 10, homeScore: 20, winner: 'Seahawks' },
        game_02: { kickoffTime: null, status: 'final', awayScore: 20, homeScore: 10, winner: '49ers' },
        game_03: { kickoffTime: null, status: 'final', awayScore: 13, homeScore: 20, winner: 'Steelers' },
      },
    })
    expect(determineWeekWinner(pool)).toEqual({ winnerName: 'CloseGuess', reason: 'score-tiebreak' })
  })

  it('returns unresolved when the score tiebreak is itself an exact tie', () => {
    const pool = basePool({
      participants: [
        { name: 'A', picks: { game_01: 'Seahawks', game_02: 'Rams', game_03: 'Falcons' }, tieBreakerTotalScore: 30 },
        { name: 'B', picks: { game_01: 'Seahawks', game_02: 'Rams', game_03: 'Falcons' }, tieBreakerTotalScore: 36 },
      ],
      results: {
        game_01: { kickoffTime: null, status: 'final', awayScore: 10, homeScore: 20, winner: 'Seahawks' },
        game_02: { kickoffTime: null, status: 'final', awayScore: 20, homeScore: 10, winner: '49ers' },
        game_03: { kickoffTime: null, status: 'final', awayScore: 13, homeScore: 20, winner: 'Steelers' },
      },
    })
    // Actual total 33; A is off by 3, B is off by 3 -> still exactly tied.
    expect(determineWeekWinner(pool)).toEqual({ winnerName: null, reason: 'unresolved' })
  })
})
