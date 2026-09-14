import { describe, expect, it } from 'vitest'
import { pools } from './pools'

// Smoke test against the real files in data/ (loaded via import.meta.glob).
// Update the expectations here if the committed data/*.yaml files change.
describe('pools (real data/*.yaml files)', () => {
  it('loads the 2026 week 1 pool with its games and participants', () => {
    const pool = pools.find((p) => p.season === 2026 && p.week === 1)

    expect(pool).toBeDefined()
    expect(pool?.games).toHaveLength(16)
    expect(pool?.participants.length).toBeGreaterThan(0)
    expect(pool?.participants.map((p) => p.name)).toContain('Steve')
  })

  it('merges in results for every game from the results file', () => {
    const pool = pools.find((p) => p.season === 2026 && p.week === 1)

    const gameIds = pool?.games.map((g) => g.id) ?? []
    for (const gameId of gameIds) {
      expect(pool?.results[gameId]).toBeDefined()
    }
    expect(pool?.results.game_01).toMatchObject({ status: 'final', winner: 'Seahawks' })
  })
})
