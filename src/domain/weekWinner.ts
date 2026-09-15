import type { Game, Participant, Pool } from '../data/types'
import { getPickOutcomes } from './standings'

export type WeekWinnerReason = 'clear-leader' | 'monday-tiebreak' | 'score-tiebreak' | 'tied-co-winners' | 'incomplete' | 'unresolved'

export interface WeekWinnerResult {
  /** One name once a sole winner is identified; more than one for a genuine tie (co-winners); empty while undecided. */
  winnerNames: string[]
  reason: WeekWinnerReason
}

/**
 * The pool's payout rule treats the week's last-kicking-off game (in
 * practice, Monday Night Football) as a dedicated tiebreaker: it's excluded
 * from the "as of Sunday" standings and only consulted if there's a tie at
 * the top. Picked by latest kickoff_time when every game's kickoff time is
 * known; falls back to the last game listed for the week otherwise (e.g.
 * before a results file has been fetched for the week at all).
 */
export function getTiebreakerGame(pool: Pool): Game | undefined {
  if (pool.games.length === 0) return undefined

  const withKickoff = pool.games.map((game) => ({ game, kickoffTime: pool.results[game.id]?.kickoffTime ?? null }))

  if (withKickoff.every((g) => g.kickoffTime !== null)) {
    return withKickoff.reduce((latest, current) =>
      (current.kickoffTime as string) > (latest.kickoffTime as string) ? current : latest,
    ).game
  }

  return pool.games[pool.games.length - 1]
}

/**
 * Determines the week's winner-take-all payout winner(s) per the pool's rule:
 *  1. Rank by correct picks on every game except the tiebreaker game. A
 *     unique leader wins outright ("winner take all at the end of Sunday").
 *  2. If tied, whoever among the tied group correctly picked the tiebreaker
 *     game's winner takes it.
 *  3. If that still doesn't produce a unique winner (the tied group split
 *     the tiebreaker game the same way, or none of them got it right),
 *     whoever's tie_breaker_total_score guess is closest to the tiebreaker
 *     game's actual combined score wins.
 *  4. If step 3 is itself an exact tie (same closest distance), the pool is
 *     truly even -- everyone left in that tie splits the win as co-winners.
 * Returns winnerNames: [] whenever the week isn't decided yet, or when there
 * simply isn't enough data (no tiebreaker guesses at all) to compare step 3.
 */
export function determineWeekWinner(pool: Pool): WeekWinnerResult {
  if (pool.participants.length === 0) return { winnerNames: [], reason: 'incomplete' }

  const tiebreakerGame = getTiebreakerGame(pool)
  if (!tiebreakerGame) return { winnerNames: [], reason: 'incomplete' }

  const sundayGameIds = new Set(pool.games.filter((g) => g.id !== tiebreakerGame.id).map((g) => g.id))
  const sundayComplete = [...sundayGameIds].every((id) => pool.results[id]?.status === 'final')
  if (!sundayComplete) return { winnerNames: [], reason: 'incomplete' }

  const sundayCorrectCounts = pool.participants.map((participant) => ({
    participant,
    correct: getPickOutcomes(pool, participant).filter((o) => sundayGameIds.has(o.gameId) && o.correct === true).length,
  }))

  const maxCorrect = Math.max(...sundayCorrectCounts.map((c) => c.correct))
  let candidates = sundayCorrectCounts.filter((c) => c.correct === maxCorrect).map((c) => c.participant)

  if (candidates.length === 1) {
    return { winnerNames: [candidates[0].name], reason: 'clear-leader' }
  }

  const tiebreakerResult = pool.results[tiebreakerGame.id]
  if (!tiebreakerResult || tiebreakerResult.status !== 'final' || tiebreakerResult.winner === null) {
    return { winnerNames: [], reason: 'incomplete' }
  }

  const correctOnTiebreaker = candidates.filter((p) => p.picks[tiebreakerGame.id] === tiebreakerResult.winner)
  if (correctOnTiebreaker.length === 1) {
    return { winnerNames: [correctOnTiebreaker[0].name], reason: 'monday-tiebreak' }
  }
  if (correctOnTiebreaker.length > 1) {
    candidates = correctOnTiebreaker
  }
  // else: none of the tied group got the tiebreaker game right, so it
  // doesn't distinguish anyone -- fall through with the full tied group.

  if (tiebreakerResult.awayScore === null || tiebreakerResult.homeScore === null) {
    return { winnerNames: [], reason: 'incomplete' }
  }
  const actualTotal = tiebreakerResult.awayScore + tiebreakerResult.homeScore

  const withGuess = candidates.filter((p): p is Participant & { tieBreakerTotalScore: number } => p.tieBreakerTotalScore !== null)
  if (withGuess.length === 0) return { winnerNames: [], reason: 'unresolved' }

  const diffs = withGuess.map((p) => ({ name: p.name, diff: Math.abs(p.tieBreakerTotalScore - actualTotal) }))
  const minDiff = Math.min(...diffs.map((d) => d.diff))
  const closest = diffs.filter((d) => d.diff === minDiff)

  if (closest.length === 1) {
    return { winnerNames: [closest[0].name], reason: 'score-tiebreak' }
  }

  // Every tiebreak criterion the pool defines has been exhausted and it's
  // still exactly even -- split the win among everyone left tied.
  return { winnerNames: closest.map((c) => c.name), reason: 'tied-co-winners' }
}
