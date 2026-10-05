import type { Game, Pool } from '../data/types'

export interface UnrecognizedPick {
  name: string
  pick: string
}

export interface GamePicksGroups {
  game: Game
  /** Names of participants who picked the away team, A-Z. */
  away: string[]
  /** Names of participants who picked the home team, A-Z. */
  home: string[]
  /** Participants with no pick for this game, A-Z. */
  noPick: string[]
  /** Picks that name neither team, A-Z by participant. */
  unrecognized: UnrecognizedPick[]
}

const byName = (a: string, b: string) => a.localeCompare(b)

/** Who picked the away team and who picked the home team for one game; null when the game isn't in the pool. */
export function groupPicksForGame(pool: Pool, gameId: string): GamePicksGroups | null {
  const game = pool.games.find((g) => g.id === gameId)
  if (!game) return null

  const away: string[] = []
  const home: string[] = []
  const noPick: string[] = []
  const unrecognized: UnrecognizedPick[] = []

  for (const participant of pool.participants) {
    const pick = participant.picks[game.id]
    if (pick === undefined || pick === '') noPick.push(participant.name)
    else if (pick === game.away) away.push(participant.name)
    else if (pick === game.home) home.push(participant.name)
    else unrecognized.push({ name: participant.name, pick })
  }

  return {
    game,
    away: away.sort(byName),
    home: home.sort(byName),
    noPick: noPick.sort(byName),
    unrecognized: unrecognized.sort((a, b) => byName(a.name, b.name)),
  }
}
