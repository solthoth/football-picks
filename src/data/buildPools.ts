import { parse } from 'yaml'
import type { Game, GameResult, GameStatus, Participant, Pool } from './types'

const DATE_SUFFIX_PATTERN = /-(\d{8})\.ya?ml$/
const VALID_STATUSES: readonly GameStatus[] = ['scheduled', 'in_progress', 'final']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

interface ParsedPicksFile {
  season: number
  week: number
  pot?: number
  games: Game[]
  participants: Participant[]
}

interface ParsedResultsFile {
  season: number
  week: number
  path: string
  games: Record<string, GameResult>
}

function parsePoolHeader(raw: Record<string, unknown>): { season: number; week: number; pot?: number } {
  const pool = raw.pool
  if (!isRecord(pool) || typeof pool.season !== 'number' || typeof pool.week !== 'number') {
    throw new Error('missing or invalid "pool.season"/"pool.week"')
  }
  const pot = typeof pool.pot === 'number' ? pool.pot : undefined
  return { season: pool.season, week: pool.week, pot }
}

function parseGames(raw: unknown): Game[] {
  if (!Array.isArray(raw)) return []
  const games: Game[] = []
  for (const entry of raw) {
    if (isRecord(entry) && typeof entry.id === 'string' && typeof entry.away === 'string' && typeof entry.home === 'string') {
      games.push({ id: entry.id, away: entry.away, home: entry.home })
    }
  }
  return games
}

function parseParticipants(raw: unknown): Participant[] {
  if (!Array.isArray(raw)) return []
  const participants: Participant[] = []
  for (const entry of raw) {
    if (!isRecord(entry) || typeof entry.name !== 'string' || !isRecord(entry.picks)) continue
    const picks: Record<string, string> = {}
    for (const [gameId, team] of Object.entries(entry.picks)) {
      if (typeof team === 'string') picks[gameId] = team
    }
    const tieBreakerTotalScore = typeof entry.tie_breaker_total_score === 'number' ? entry.tie_breaker_total_score : null
    participants.push({ name: entry.name, picks, tieBreakerTotalScore })
  }
  return participants
}

function isPicksFile(raw: Record<string, unknown>): boolean {
  return Array.isArray(raw.games) && Array.isArray(raw.participants)
}

function parsePicksFile(raw: Record<string, unknown>): ParsedPicksFile {
  const { season, week, pot } = parsePoolHeader(raw)
  return { season, week, pot, games: parseGames(raw.games), participants: parseParticipants(raw.participants) }
}

function parseGameResult(raw: unknown): GameResult | null {
  if (!isRecord(raw)) return null
  const status = VALID_STATUSES.includes(raw.status as GameStatus) ? (raw.status as GameStatus) : 'scheduled'
  return {
    kickoffTime: typeof raw.kickoff_time === 'string' ? raw.kickoff_time : null,
    status,
    awayScore: typeof raw.away_score === 'number' ? raw.away_score : null,
    homeScore: typeof raw.home_score === 'number' ? raw.home_score : null,
    winner: typeof raw.winner === 'string' ? raw.winner : null,
  }
}

function parseResultsFile(raw: Record<string, unknown>, path: string): ParsedResultsFile {
  const { season, week } = parsePoolHeader(raw)
  const games: Record<string, GameResult> = {}
  if (isRecord(raw.games)) {
    for (const [matchupId, value] of Object.entries(raw.games)) {
      const result = parseGameResult(value)
      if (result) games[matchupId] = result
    }
  }
  return { season, week, path, games }
}

function dateSuffix(path: string): string {
  return DATE_SUFFIX_PATTERN.exec(path)?.[1] ?? ''
}

/**
 * Merges every picks file with the most recent matching results file (by
 * season/week, picking the greatest date suffix in the filename) into a
 * flat list of Pool records. Pure function so it can be unit tested without
 * touching the filesystem or Vite's import.meta.glob.
 */
export function buildPools(rawFiles: Record<string, string>): Pool[] {
  const picksFiles: ParsedPicksFile[] = []
  const resultsFiles: ParsedResultsFile[] = []

  for (const [path, content] of Object.entries(rawFiles)) {
    let parsed: unknown
    try {
      parsed = parse(content)
    } catch (err) {
      console.warn(`Skipping ${path}: invalid YAML (${(err as Error).message})`)
      continue
    }
    if (!isRecord(parsed)) {
      console.warn(`Skipping ${path}: expected a YAML mapping at the top level`)
      continue
    }
    try {
      if (isPicksFile(parsed)) {
        picksFiles.push(parsePicksFile(parsed))
      } else if (isRecord(parsed.pool)) {
        resultsFiles.push(parseResultsFile(parsed, path))
      } else {
        console.warn(`Skipping ${path}: doesn't look like a picks or results file`)
      }
    } catch (err) {
      console.warn(`Skipping ${path}: ${(err as Error).message}`)
    }
  }

  const latestResultsByWeek = new Map<string, ParsedResultsFile>()
  for (const file of resultsFiles) {
    const key = `${file.season}-${file.week}`
    const existing = latestResultsByWeek.get(key)
    if (!existing || dateSuffix(file.path) > dateSuffix(existing.path)) {
      latestResultsByWeek.set(key, file)
    }
  }

  return picksFiles
    .map((picks) => ({
      season: picks.season,
      week: picks.week,
      pot: picks.pot,
      games: picks.games,
      participants: picks.participants,
      results: latestResultsByWeek.get(`${picks.season}-${picks.week}`)?.games ?? {},
    }))
    .sort((a, b) => b.season - a.season || a.week - b.week)
}
