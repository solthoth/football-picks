import { describe, expect, it } from 'vitest'
import { applyLiveScores, isPoolFinal, parseLiveScores, scoresAsOfLabel } from './liveScores'
import type { GameResult, Pool } from './types'

const final: GameResult = { kickoffTime: 'k', status: 'final', awayScore: 10, homeScore: 13, winner: 'Seahawks' }
const live: GameResult = { kickoffTime: 'k', status: 'in_progress', awayScore: 3, homeScore: 0, winner: null }
const scheduled: GameResult = { kickoffTime: 'k', status: 'scheduled', awayScore: null, homeScore: null, winner: null }

const pool: Pool = {
  season: 2026,
  week: 3,
  games: [
    { id: 'Patriots@Seahawks', away: 'Patriots', home: 'Seahawks' },
    { id: '49ers@Rams', away: '49ers', home: 'Rams' },
  ],
  participants: [],
  results: { 'Patriots@Seahawks': final, '49ers@Rams': scheduled },
}

const payload = {
  season: 2026,
  week: 3,
  updated_at: '2026-09-27T18:00:00Z',
  games: {
    '49ers@Rams': { kickoff_time: 'k', status: 'in_progress', away_score: 3, home_score: 0, winner: null },
    'Junk@Game': 'not an object',
  },
}

describe('parseLiveScores', () => {
  it('parses games and updated_at, dropping malformed entries', () => {
    expect(parseLiveScores(payload, 2026, 3)).toEqual({ updatedAt: '2026-09-27T18:00:00Z', games: { '49ers@Rams': live } })
  })

  it('rejects a payload for a different season or week', () => {
    expect(parseLiveScores(payload, 2026, 4)).toBeNull()
    expect(parseLiveScores(payload, 2025, 3)).toBeNull()
  })

  it('rejects things that are not a scores payload', () => {
    expect(parseLiveScores(null, 2026, 3)).toBeNull()
    expect(parseLiveScores([], 2026, 3)).toBeNull()
    expect(parseLiveScores({ games: [] }, 2026, 3)).toBeNull()
  })
})

describe('applyLiveScores', () => {
  it('overlays live results and records when they were refreshed', () => {
    const merged = applyLiveScores(pool, { updatedAt: 'T', games: { '49ers@Rams': live } })
    expect(merged.results['49ers@Rams']).toEqual(live)
    expect(merged.results['Patriots@Seahawks']).toEqual(final)
    expect(merged.resultsUpdatedAt).toBe('T')
  })

  it('never downgrades a game bundled as final', () => {
    const merged = applyLiveScores(pool, { updatedAt: 'T', games: { 'Patriots@Seahawks': live } })
    expect(merged.results['Patriots@Seahawks']).toEqual(final)
  })
})

describe('isPoolFinal', () => {
  it('is true only when every game is final', () => {
    expect(isPoolFinal(pool)).toBe(false)
    expect(isPoolFinal({ ...pool, results: { ...pool.results, '49ers@Rams': final } })).toBe(true)
  })
})

describe('scoresAsOfLabel', () => {
  const now = Date.parse('2026-09-27T18:10:00Z')

  it('is null without live data', () => {
    expect(scoresAsOfLabel(pool, now)).toBeNull()
  })

  it('shows the refresh time', () => {
    expect(scoresAsOfLabel({ ...pool, resultsUpdatedAt: '2026-09-27T18:00:00Z' }, now)).toMatch(/^Scores as of /)
  })

  it('warns when unfinished games have old data, but not when the week is final', () => {
    const old = '2026-09-27T17:00:00Z'
    expect(scoresAsOfLabel({ ...pool, resultsUpdatedAt: old }, now)).toContain('may be out of date')
    const done = { ...pool, results: { ...pool.results, '49ers@Rams': final }, resultsUpdatedAt: old }
    expect(scoresAsOfLabel(done, now)).not.toContain('may be out of date')
  })
})
