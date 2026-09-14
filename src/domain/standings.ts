import type { GameStatus, Participant, Pool } from '../data/types'

export interface PickOutcome {
  gameId: string
  away: string
  home: string
  pickedTeam: string | undefined
  status: GameStatus | 'unknown'
  actualWinner: string | null
  /** true/false once the game is final and has a winner; null while undecided. */
  correct: boolean | null
}

export function getPickOutcomes(pool: Pool, participant: Participant): PickOutcome[] {
  return pool.games.map((game) => {
    const result = pool.results[game.id]
    const pickedTeam = participant.picks[game.id]
    const status = result?.status ?? 'unknown'
    const actualWinner = result?.winner ?? null
    const correct = status === 'final' && actualWinner !== null ? pickedTeam === actualWinner : null

    return { gameId: game.id, away: game.away, home: game.home, pickedTeam, status, actualWinner, correct }
  })
}

export interface ParticipantSummary {
  name: string
  correct: number
  incorrect: number
  pending: number
  totalGames: number
}

export function summarizeOutcomes(name: string, outcomes: PickOutcome[]): ParticipantSummary {
  let correct = 0
  let incorrect = 0
  let pending = 0

  for (const outcome of outcomes) {
    if (outcome.correct === true) correct += 1
    else if (outcome.correct === false) incorrect += 1
    else pending += 1
  }

  return { name, correct, incorrect, pending, totalGames: outcomes.length }
}

export interface LeaderboardEntry extends ParticipantSummary {
  rank: number
}

/** Ranks participants by correct picks (competition ranking: ties share a rank). */
export function buildLeaderboard(pool: Pool): LeaderboardEntry[] {
  const summaries = pool.participants
    .map((participant) => summarizeOutcomes(participant.name, getPickOutcomes(pool, participant)))
    .sort((a, b) => b.correct - a.correct || a.name.localeCompare(b.name))

  let rank = 0
  let previousCorrect: number | null = null

  return summaries.map((summary, index) => {
    if (summary.correct !== previousCorrect) {
      rank = index + 1
      previousCorrect = summary.correct
    }
    return { ...summary, rank }
  })
}
