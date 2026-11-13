import { useEffect, useMemo, useState } from 'react'
import { applyLiveScores, fetchLiveScores, isPoolFinal } from './liveScores'
import type { Pool } from './types'
import { cacheLiveScores, cachedLiveScores, POLL_INTERVAL_MS } from './useLivePool'

export interface SeasonPools {
  /** The season's weeks in order, each with live scores overlaid where they could be loaded. */
  pools: Pool[]
  /** True until every unfinished week has had its first attempt at loading live scores. */
  loading: boolean
  /** Unfinished weeks whose live scores could not be loaded, so their data is only what is bundled. */
  failedWeeks: number[]
}

const keyOf = (pool: Pool) => `${pool.season}-${pool.week}`

function withCachedScores(pool: Pool): Pool {
  const live = cachedLiveScores(pool.season, pool.week)
  return live ? applyLiveScores(pool, live) : pool
}

/**
 * One season's pools with live scores overlaid for every week. The bundled results are only a scaffold for
 * most weeks, so a season-wide total needs the live scores of each week (not just the one being viewed).
 * Weeks that are already final are not fetched; the rest are fetched together, and only the weeks still in
 * progress are polled again. What to load is decided by which weeks `bundled` holds, not by the array's
 * identity, so callers may pass a fresh array each render.
 */
export function useSeasonPools(bundled: Pool[], baseUrl: string | undefined = import.meta.env.VITE_SCORES_BASE_URL): SeasonPools {
  const [fetchedAt, setFetchedAt] = useState(0)
  const [outcome, setOutcome] = useState<Record<string, 'ok' | 'failed'>>({})

  const weeksKey = bundled.map(keyOf).join(',')
  // eslint-disable-next-line react-hooks/exhaustive-deps -- deliberately keyed on which weeks there are, not on the array object
  const stable = useMemo(() => bundled, [weeksKey])

  // fetchedAt only exists to re-render when the shared cache changes.
  const pools = useMemo(
    () => [...stable].sort((a, b) => a.week - b.week).map(withCachedScores),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchedAt signals that the shared cache has changed
    [stable, fetchedAt],
  )
  const unfinished = pools.filter((pool) => !isPoolFinal(pool))

  useEffect(() => {
    if (!baseUrl) return

    const controller = new AbortController()
    const stillUnfinished = () => stable.filter((pool) => !isPoolFinal(withCachedScores(pool)))

    const loadUnfinished = async () => {
      await Promise.all(
        stillUnfinished().map(async (pool) => {
          const key = keyOf(pool)
          try {
            const live = await fetchLiveScores(baseUrl, pool.season, pool.week, controller.signal)
            if (controller.signal.aborted) return
            if (live) cacheLiveScores(pool.season, pool.week, live)
            setOutcome((current) => ({ ...current, [key]: live ? 'ok' : 'failed' }))
            if (live) setFetchedAt((n) => n + 1)
          } catch {
            // Offline, blocked or aborted: keep what we have and report the week as failed.
            if (!controller.signal.aborted) setOutcome((current) => ({ ...current, [key]: 'failed' }))
          }
        }),
      )
    }

    void loadUnfinished()
    const timer = setInterval(() => {
      if (!document.hidden && stillUnfinished().length > 0) void loadUnfinished()
    }, POLL_INTERVAL_MS)

    return () => {
      controller.abort()
      clearInterval(timer)
    }
  }, [baseUrl, stable])

  return {
    pools,
    loading: Boolean(baseUrl) && unfinished.some((pool) => outcome[keyOf(pool)] === undefined),
    failedWeeks: unfinished.filter((pool) => outcome[keyOf(pool)] === 'failed').map((pool) => pool.week),
  }
}
