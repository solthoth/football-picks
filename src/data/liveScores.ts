import { isRecord, parseGameResult } from './buildPools'
import type { GameResult, Pool } from './types'

export interface LiveScores {
  updatedAt: string | null
  games: Record<string, GameResult>
}

/** Validates a published <season>/week-<N>.json payload; null if it isn't one for this season/week. */
export function parseLiveScores(raw: unknown, season: number, week: number): LiveScores | null {
  if (!isRecord(raw) || !isRecord(raw.games)) return null
  if ((typeof raw.season === 'number' && raw.season !== season) || (typeof raw.week === 'number' && raw.week !== week)) {
    return null
  }

  const games: Record<string, GameResult> = {}
  for (const [matchupId, value] of Object.entries(raw.games)) {
    const result = parseGameResult(value)
    if (result) games[matchupId] = result
  }
  return { updatedAt: typeof raw.updated_at === 'string' ? raw.updated_at : null, games }
}

export async function fetchLiveScores(
  baseUrl: string,
  season: number,
  week: number,
  signal?: AbortSignal,
): Promise<LiveScores | null> {
  // "no-cache" = always revalidate (cheap conditional GET) so a 30s blob
  // Cache-Control never leaves the browser showing older scores.
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/${season}/week-${week}.json`, { signal, cache: 'no-cache' })
  if (!response.ok) return null
  return parseLiveScores(await response.json(), season, week)
}

/** Overlays live scores on the bundled pool. A game bundled as final is never downgraded by an older live copy. */
export function applyLiveScores(pool: Pool, live: LiveScores): Pool {
  const results = { ...pool.results }
  for (const [gameId, result] of Object.entries(live.games)) {
    if (results[gameId]?.status === 'final' && result.status !== 'final') continue
    results[gameId] = result
  }
  return { ...pool, results, resultsUpdatedAt: live.updatedAt ?? undefined }
}

export function isPoolFinal(pool: Pool): boolean {
  return pool.games.every((game) => pool.results[game.id]?.status === 'final')
}

const STALE_AFTER_MS = 30 * 60 * 1000

/** "Scores as of Sun 4:35 PM", plus a hint when games are unfinished and the data is old; null without live data. */
export function scoresAsOfLabel(pool: Pool, now: number = Date.now()): string | null {
  if (!pool.resultsUpdatedAt) return null
  const updated = new Date(pool.resultsUpdatedAt)
  if (Number.isNaN(updated.getTime())) return null

  const time = updated.toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })
  const stale = !isPoolFinal(pool) && now - updated.getTime() > STALE_AFTER_MS
  return `Scores as of ${time}${stale ? ' (may be out of date)' : ''}`
}
