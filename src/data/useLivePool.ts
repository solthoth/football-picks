import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
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

// A tiny shared store so a "refresh" button anywhere on screen can ask the polling hooks to fetch now and can
// see whether a refresh is possible (something is being polled) and running (a fetch is in flight).
interface LiveStatus {
  canRefresh: boolean
  refreshing: boolean
  refreshRequests: number
}
let pollers = 0
let inFlight = 0
let status: LiveStatus = { canRefresh: false, refreshing: false, refreshRequests: 0 }
const listeners = new Set<() => void>()

function publish(refreshRequests = status.refreshRequests) {
  const next = { canRefresh: pollers > 0, refreshing: inFlight > 0, refreshRequests }
  if (next.canRefresh === status.canRefresh && next.refreshing === status.refreshing && next.refreshRequests === status.refreshRequests) return
  status = next
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Asks every polling useLivePool to fetch right now instead of waiting for its next poll. */
export function refreshLiveScores() {
  publish(status.refreshRequests + 1)
}

/** Whether live scores are being polled (so a refresh means something) and whether a fetch is running. */
export function useLiveScoresStatus(): { canRefresh: boolean; refreshing: boolean } {
  const { canRefresh, refreshing } = useSyncExternalStore(subscribe, () => status)
  return { canRefresh, refreshing }
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
  const refreshRequests = useSyncExternalStore(subscribe, () => status.refreshRequests)

  useEffect(() => {
    if (!baseUrl || season === undefined || week === undefined || finished) return

    pollers += 1
    publish()
    const controller = new AbortController()
    const load = async () => {
      inFlight += 1
      publish()
      try {
        const live = await fetchLiveScores(baseUrl, season, week, controller.signal)
        if (live) {
          cacheLiveScores(season, week, live)
          setFetched({ key: `${season}-${week}`, scores: live })
        }
      } catch {
        // Offline, blocked, or aborted: keep showing whatever we already have.
      } finally {
        inFlight -= 1
        publish()
      }
    }

    void load()
    const timer = setInterval(() => {
      if (!document.hidden) void load()
    }, POLL_INTERVAL_MS)
    return () => {
      controller.abort()
      clearInterval(timer)
      pollers -= 1
      publish()
    }
    // refreshRequests: a manual refresh re-runs this effect, which fetches immediately.
  }, [baseUrl, season, week, finished, refreshRequests])

  return merged
}

/** Test helper: clears the module-level cache between tests. */
export function resetLivePoolCache() {
  cache.clear()
}
