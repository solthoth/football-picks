import type { Pool } from './types'

/** A season's weeks, ascending. Empty for an unknown or missing season. */
export function weeksForSeason(pools: Pool[], season: number | undefined): number[] {
  return pools
    .filter((pool) => pool.season === season)
    .map((pool) => pool.week)
    .sort((a, b) => a - b)
}

/** The most recent pool: the highest week of the highest season. */
export function latestPool(pools: Pool[]): Pool | undefined {
  return pools.reduce<Pool | undefined>(
    (latest, pool) => (!latest || pool.season > latest.season || (pool.season === latest.season && pool.week > latest.week) ? pool : latest),
    undefined,
  )
}
