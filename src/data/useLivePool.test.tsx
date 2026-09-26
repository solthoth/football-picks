import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { POLL_INTERVAL_MS, resetLivePoolCache, useLivePool } from './useLivePool'
import type { Pool } from './types'

const BASE = 'https://example.blob.core.windows.net/scores'
const scheduled = { kickoffTime: 'k', status: 'scheduled', awayScore: null, homeScore: null, winner: null } as const

const pool: Pool = {
  season: 2026,
  week: 3,
  games: [{ id: 'A@B', away: 'A', home: 'B' }],
  participants: [],
  results: { 'A@B': scheduled },
}

function payload(status: string) {
  return {
    season: 2026,
    week: 3,
    updated_at: '2026-09-27T18:00:00Z',
    games: { 'A@B': { kickoff_time: 'k', status, away_score: 1, home_score: 0, winner: status === 'final' ? 'A' : null } },
  }
}

function respond(body: unknown, ok = true) {
  return Promise.resolve({ ok, json: () => Promise.resolve(body) } as Response)
}

describe('useLivePool', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    resetLivePoolCache()
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('returns the bundled pool and never fetches without a scores URL', () => {
    const { result } = renderHook(() => useLivePool(pool, undefined))
    expect(result.current).toBe(pool)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('overlays fetched scores', async () => {
    fetchMock.mockReturnValue(respond(payload('in_progress')))
    const { result } = renderHook(() => useLivePool(pool, BASE))

    await waitFor(() => expect(result.current?.results['A@B'].status).toBe('in_progress'))
    expect(result.current?.resultsUpdatedAt).toBe('2026-09-27T18:00:00Z')
    expect(fetchMock.mock.calls[0][0]).toBe(`${BASE}/2026/week-3.json`)
  })

  it('falls back to bundled data when the fetch fails or is not ok', async () => {
    fetchMock.mockReturnValueOnce(Promise.reject(new Error('offline'))).mockReturnValueOnce(respond({}, false))
    const { result } = renderHook(() => useLivePool(pool, BASE))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(result.current).toBe(pool)
  })

  it('polls while games are unfinished and stops once every game is final', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    fetchMock.mockReturnValueOnce(respond(payload('in_progress'))).mockReturnValue(respond(payload('final')))
    const { result } = renderHook(() => useLivePool(pool, BASE))

    await waitFor(() => expect(result.current?.results['A@B'].status).toBe('in_progress'))
    await act(() => vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS))
    await waitFor(() => expect(result.current?.results['A@B'].status).toBe('final'))

    const calls = fetchMock.mock.calls.length
    await act(() => vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 3))
    expect(fetchMock).toHaveBeenCalledTimes(calls)
  })

  it('does not fetch for a pool that is already fully final in the bundled data', () => {
    const done: Pool = { ...pool, results: { 'A@B': { ...scheduled, status: 'final', winner: 'A' } } }
    renderHook(() => useLivePool(done, BASE))
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('tolerates a missing pool', () => {
    const { result } = renderHook(() => useLivePool(undefined, BASE))
    expect(result.current).toBeUndefined()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
