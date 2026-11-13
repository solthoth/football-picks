import type { Pool } from '../data/types'
import { getPickOutcomes, summarizeOutcomes } from './standings'
import { determineWeekWinner } from './weekWinner'

export interface SeasonEntry {
  name: string
  /** Competition rank, or null while no pick in the season has been decided. */
  rank: number | null
  /** Weeks won outright or shared as co-winner. */
  weeksWon: number
  /** Dollars won: each week's pot, split equally between that week's co-winners. */
  winnings: number
  /** Picks that turned out right, across every decided game of the season. */
  correct: number
  /** Picks that have been decided (right or wrong); the denominator for `correct`. */
  decided: number
}

export interface WeekSummary {
  week: number
  /** Empty until the week's winner is known. More than one name means co-winners. */
  winners: string[]
  pot: number | undefined
  /** What each winner received (the pot divided between them); 0 when undecided or no pot is recorded. */
  share: number
  decided: boolean
}

export interface SeasonStandings {
  entries: SeasonEntry[]
  /** Ascending by week. */
  weeks: WeekSummary[]
  weeksDecided: number
  weeksTotal: number
  totalPaidOut: number
}

/**
 * Season totals for one season's pools. The pool is winner-take-all each week, so the table leads with money
 * won, then weeks won, then correct picks (and name, to make the order stable). Until anything is decided
 * nobody is ranked, for the same reason as the weekly standings: a 0-0 start is not a tie for first.
 */
export function buildSeasonStandings(pools: Pool[]): SeasonStandings {
  const totals = new Map<string, Omit<SeasonEntry, 'rank'>>()
  const entryFor = (name: string) => {
    let entry = totals.get(name)
    if (!entry) {
      entry = { name, weeksWon: 0, winnings: 0, correct: 0, decided: 0 }
      totals.set(name, entry)
    }
    return entry
  }

  const weeks: WeekSummary[] = []

  for (const pool of [...pools].sort((a, b) => a.week - b.week)) {
    for (const participant of pool.participants) {
      const summary = summarizeOutcomes(participant.name, getPickOutcomes(pool, participant))
      const entry = entryFor(participant.name)
      entry.correct += summary.correct
      entry.decided += summary.correct + summary.incorrect
    }

    const { winnerNames } = determineWeekWinner(pool)
    const decided = winnerNames.length > 0
    const share = decided && pool.pot !== undefined ? pool.pot / winnerNames.length : 0
    for (const name of winnerNames) {
      const entry = entryFor(name)
      entry.weeksWon += 1
      entry.winnings += share
    }
    weeks.push({ week: pool.week, winners: winnerNames, pot: pool.pot, share, decided })
  }

  const sorted = [...totals.values()].sort(
    (a, b) => b.winnings - a.winnings || b.weeksWon - a.weeksWon || b.correct - a.correct || a.name.localeCompare(b.name),
  )
  const anyDecided = sorted.some((entry) => entry.decided > 0)

  let rank = 0
  let previous: Omit<SeasonEntry, 'rank'> | undefined
  const entries: SeasonEntry[] = sorted.map((entry, index) => {
    const tiedWithPrevious =
      previous !== undefined && previous.winnings === entry.winnings && previous.weeksWon === entry.weeksWon && previous.correct === entry.correct
    if (!tiedWithPrevious) rank = index + 1
    previous = entry
    return { ...entry, rank: anyDecided ? rank : null }
  })

  return {
    entries,
    weeks,
    weeksDecided: weeks.filter((w) => w.decided).length,
    weeksTotal: weeks.length,
    totalPaidOut: weeks.reduce((sum, w) => sum + w.share * w.winners.length, 0),
  }
}
