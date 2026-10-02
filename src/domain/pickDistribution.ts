import type { Game, GameStatus, Pool } from '../data/types'

export type Side = 'away' | 'home'
export type CrowdOutcome = 'crowd-right' | 'upset' | 'split' | 'pending'

export interface GameDistribution {
  gameId: string
  away: string
  home: string
  awayCount: number
  homeCount: number
  /** awayCount + homeCount: valid picks only; denominator for percentages. */
  picked: number
  /** participants with no pick for this game. */
  missing: number
  /** picks that name neither team; excluded from picked. missing + unrecognized + picked === participantCount. */
  unrecognized: number
  /** null when picked === 0, else integers with awayPct + homePct === 100. */
  awayPct: number | null
  homePct: number | null
  /** strict majority side; 'tie' when counts equal and picked > 0; null when picked === 0. */
  leader: Side | 'tie' | null
  status: GameStatus | 'unknown'
  kickoffTime: string | null
  awayScore: number | null
  homeScore: number | null
  /** from results.winner matched to away/home; null unless status === 'final' and a winner exists. */
  winnerSide: Side | null
  /**
   * 'pending' unless final with a winner, picked > 0, and unrecognized === 0 (a
   * crowd verdict is only claimed when every pick for the game parsed cleanly);
   * 'split' when final and leader === 'tie'.
   */
  crowd: CrowdOutcome
}

export interface PickSummary {
  /**
   * The single most lopsided pick: highest count/picked ratio (exact, not the
   * rounded pct) among games with a strict leader; ties go to the larger
   * `picked`, then the earlier game. null when no game has a strict leader.
   */
  mostPopular: { gameId: string; away: string; home: string; team: string; pct: number; count: number; picked: number } | null
  /** Smallest exact |away - home| / picked among games with picks; ties go to the earlier game. */
  mostDivided: { gameId: string; away: string; home: string; awayPct: number; homePct: number } | null
}

export interface PickDistribution {
  participantCount: number
  /** schedule order (kickoff asc if all known, else pool.games order). */
  games: GameDistribution[]
  summary: PickSummary
}

/**
 * Percentages for a two-sided split that always sum to exactly 100: the
 * larger side is rounded half-up with integer math (so the exact-.5 case is
 * symmetric rather than biased toward away) and the smaller side is the
 * remainder. Never round each side independently.
 */
function splitPercents(awayCount: number, homeCount: number): { awayPct: number; homePct: number } {
  const picked = awayCount + homeCount
  const larger = Math.max(awayCount, homeCount)
  const largerPct = Math.floor((2 * larger * 100 + picked) / (2 * picked))
  if (awayCount === homeCount) return { awayPct: 50, homePct: 50 }
  return awayCount > homeCount
    ? { awayPct: largerPct, homePct: 100 - largerPct }
    : { awayPct: 100 - largerPct, homePct: largerPct }
}

function distributeGame(pool: Pool, game: Game): GameDistribution {
  let awayCount = 0
  let homeCount = 0
  let missing = 0
  let unrecognized = 0

  for (const participant of pool.participants) {
    const pick = participant.picks[game.id]
    if (pick === undefined || pick === '') missing++
    else if (pick === game.away) awayCount++
    else if (pick === game.home) homeCount++
    else unrecognized++
  }

  const picked = awayCount + homeCount
  const percents = picked > 0 ? splitPercents(awayCount, homeCount) : null
  const leader: GameDistribution['leader'] =
    picked === 0 ? null : awayCount === homeCount ? 'tie' : awayCount > homeCount ? 'away' : 'home'

  const result = pool.results[game.id]
  const status: GameDistribution['status'] = result?.status ?? 'unknown'
  const winnerSide: Side | null =
    status === 'final' && result?.winner != null ? (result.winner === game.away ? 'away' : result.winner === game.home ? 'home' : null) : null

  let crowd: CrowdOutcome = 'pending'
  if (winnerSide !== null && picked > 0 && unrecognized === 0) {
    crowd = leader === 'tie' ? 'split' : leader === winnerSide ? 'crowd-right' : 'upset'
  }

  return {
    gameId: game.id,
    away: game.away,
    home: game.home,
    awayCount,
    homeCount,
    picked,
    missing,
    unrecognized,
    awayPct: percents?.awayPct ?? null,
    homePct: percents?.homePct ?? null,
    leader,
    status,
    kickoffTime: result?.kickoffTime ?? null,
    awayScore: result?.awayScore ?? null,
    homeScore: result?.homeScore ?? null,
    winnerSide,
    crowd,
  }
}

/** Ascending kickoff when every game has one; otherwise the order the games are listed in. */
function inScheduleOrder(games: GameDistribution[]): GameDistribution[] {
  if (games.every((g) => g.kickoffTime !== null)) {
    return [...games].sort((a, b) => (a.kickoffTime as string).localeCompare(b.kickoffTime as string))
  }
  return games
}

/** Exact divided-ness as a fraction `diff / picked`; smaller is more divided. */
function dividedness(game: GameDistribution): { diff: number; picked: number } {
  return { diff: Math.abs(game.awayCount - game.homeCount), picked: game.picked }
}

/** Negative when `a` is more divided than `b` (cross-multiplied, so no float or rounding error). */
function compareDivided(a: GameDistribution, b: GameDistribution): number {
  const x = dividedness(a)
  const y = dividedness(b)
  return x.diff * y.picked - y.diff * x.picked
}

function summarize(games: GameDistribution[]): PickSummary {
  let mostPopular: GameDistribution | null = null
  let mostDivided: GameDistribution | null = null

  for (const game of games) {
    if (game.picked === 0) continue

    if (game.leader === 'away' || game.leader === 'home') {
      if (mostPopular === null) mostPopular = game
      else {
        const count = Math.max(game.awayCount, game.homeCount)
        const bestCount = Math.max(mostPopular.awayCount, mostPopular.homeCount)
        const ratio = count * mostPopular.picked - bestCount * game.picked
        if (ratio > 0 || (ratio === 0 && game.picked > mostPopular.picked)) mostPopular = game
      }
    }

    if (mostDivided === null || compareDivided(game, mostDivided) < 0) mostDivided = game
  }

  return {
    mostPopular:
      mostPopular === null || mostPopular.awayPct === null || mostPopular.homePct === null
        ? null
        : {
            gameId: mostPopular.gameId,
            away: mostPopular.away,
            home: mostPopular.home,
            team: mostPopular.leader === 'away' ? mostPopular.away : mostPopular.home,
            pct: Math.max(mostPopular.awayPct, mostPopular.homePct),
            count: Math.max(mostPopular.awayCount, mostPopular.homeCount),
            picked: mostPopular.picked,
          },
    mostDivided:
      mostDivided === null || mostDivided.awayPct === null || mostDivided.homePct === null
        ? null
        : {
            gameId: mostDivided.gameId,
            away: mostDivided.away,
            home: mostDivided.home,
            awayPct: mostDivided.awayPct,
            homePct: mostDivided.homePct,
          },
  }
}

/** How the pool split on every game of a week, plus the headline numbers for the dashboard. */
export function computePickDistribution(pool: Pool): PickDistribution {
  const games = inScheduleOrder(pool.games.map((game) => distributeGame(pool, game)))
  return { participantCount: pool.participants.length, games, summary: summarize(games) }
}

/** Closest splits first (stable on ties, by exact ratio); games nobody picked go last. Returns a new array. */
export function sortByDivided(games: GameDistribution[]): GameDistribution[] {
  return [...games].sort((a, b) => {
    if ((a.picked === 0) !== (b.picked === 0)) return a.picked === 0 ? 1 : -1
    if (a.picked === 0) return 0
    return compareDivided(a, b)
  })
}
