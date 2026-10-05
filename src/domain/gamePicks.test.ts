import { describe, expect, it } from 'vitest'
import type { Pool } from '../data/types'
import { groupPicksForGame } from './gamePicks'

const GAME = { id: 'Falcons@Packers', away: 'Falcons', home: 'Packers' }

function pool(picks: Record<string, string | undefined>): Pool {
  return {
    season: 2026,
    week: 4,
    games: [GAME, { id: 'Colts@Commanders', away: 'Colts', home: 'Commanders' }],
    participants: Object.entries(picks).map(([name, pick]) => ({
      name,
      picks: pick === undefined ? {} : { [GAME.id]: pick },
      tieBreakerTotalScore: null,
    })),
    results: {},
  }
}

describe('groupPicksForGame', () => {
  it('splits participants into away and home pickers, sorted by name', () => {
    const groups = groupPicksForGame(pool({ Zed: 'Falcons', Amy: 'Packers', Bob: 'Falcons', Cat: 'Packers' }), GAME.id)

    expect(groups?.game).toEqual(GAME)
    expect(groups?.away).toEqual(['Bob', 'Zed'])
    expect(groups?.home).toEqual(['Amy', 'Cat'])
    expect(groups?.noPick).toEqual([])
    expect(groups?.unrecognized).toEqual([])
  })

  it('puts missing and blank picks in noPick', () => {
    const groups = groupPicksForGame(pool({ Amy: undefined, Bob: '', Cat: 'Falcons' }), GAME.id)

    expect(groups?.noPick).toEqual(['Amy', 'Bob'])
    expect(groups?.away).toEqual(['Cat'])
  })

  it('keeps picks that name neither team out of both groups', () => {
    const groups = groupPicksForGame(pool({ Amy: 'Ravens', Bob: 'Packers' }), GAME.id)

    expect(groups?.unrecognized).toEqual([{ name: 'Amy', pick: 'Ravens' }])
    expect(groups?.away).toEqual([])
    expect(groups?.home).toEqual(['Bob'])
  })

  it('returns null for a game that is not in the pool', () => {
    expect(groupPicksForGame(pool({ Amy: 'Falcons' }), 'Jets@Bills')).toBeNull()
  })
})
