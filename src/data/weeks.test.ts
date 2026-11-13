import { describe, expect, it } from 'vitest'
import { latestPool, weeksForSeason } from './weeks'
import type { Pool } from './types'

const pool = (season: number, week: number): Pool => ({ season, week, games: [], participants: [], results: {} })

describe('weeksForSeason', () => {
  const pools = [pool(2026, 3), pool(2026, 1), pool(2025, 18), pool(2026, 2)]

  it('lists a season\'s weeks in ascending order', () => {
    expect(weeksForSeason(pools, 2026)).toEqual([1, 2, 3])
  })

  it('is empty for an unknown or missing season', () => {
    expect(weeksForSeason(pools, 1999)).toEqual([])
    expect(weeksForSeason(pools, undefined)).toEqual([])
  })
})

describe('latestPool', () => {
  it('is the highest week of the highest season, however the pools are ordered', () => {
    const latest = latestPool([pool(2025, 18), pool(2026, 2), pool(2026, 10), pool(2026, 4)])
    expect([latest?.season, latest?.week]).toEqual([2026, 10])
  })

  it('is undefined when there are no pools', () => {
    expect(latestPool([])).toBeUndefined()
  })
})
