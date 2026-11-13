import { useEffect, useMemo, useState } from 'react'
import { applyLiveScores, fetchLiveScores, isPoolFinal } from './liveScores'
import type { LiveScores } from './liveScores'
import type { Pool } from './types'

export const POLL_INTERVAL_MS = 60_000

// Last live scores per season-week, so moving between pages of the same week
// shows current scores immediately instead of flashing the bundled ones.
const cache = new Map<string, LiveScores>()

/** The last live scores fetched for a week (by any screen), or undefined. Shared with the season view. */
export function cachedLiveScores(season: number, week: number): LiveScores | undefined {
  return cache.get(`${season}-${week}`)
}

export function cacheLiveScores(season: number, week: number, scores: LiveScores) {
  cache.set(`${season}-${week}`, scores)
}

/**
 * Returns the pool with live scores overlaid. Uses the bundled data as-is
 * when no scores URL is configured, when the fetch fails, or once every game
 * is final; otherwise fetches now and polls every minute while the tab is
 * visible.
 */
export function useLivePool(pool: Pool | undefined, baseUrl: string | undefined = import.meta.env.VITE_SCORES_BASE_URL): Pool | undefined {
  const season = pool?.season
  const week = pool?.week
  const key = `${season}-${week}`
  const [fetched, setFetched] = useState<{ key: string; scores: LiveScores } | null>(null)

  const scores = fetched?.key === key ? fetched.scores : cache.get(key)
  const merged = useMemo(() => (pool && scores ? applyLiveScores(pool, scores) : pool), [pool, scores])
  const finished = merged ? isPoolFinal(merged) : true

  useEffect(() => {
    if (!baseUrl || season === undefined || week === undefined || finished) return

    const controller = new AbortController()
    const load = async () => {
      try {
        const live = await fetchLiveScores(baseUrl, season, week, controller.signal)
        if (live) {
          cacheLiveScores(season, week, live)
          setFetched({ key: `${season}-${week}`, scores: live })
        }
      } catch {
        // Offline, blocked, or aborted: keep showing whatever we already have.
      }
    }

    void load()
    const timer = setInterval(() => {
      if (!document.hidden) void load()
    }, POLL_INTERVAL_MS)
    return () => {
      controller.abort()
      clearInterval(timer)
    }
  }, [baseUrl, season, week, finished])

  return merged
}

/** Test helper: clears the module-level cache between tests. */
export function resetLivePoolCache() {
  cache.clear()
}
