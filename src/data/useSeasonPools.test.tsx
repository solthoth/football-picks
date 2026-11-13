import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Pool } from './types'
import { cacheLiveScores, POLL_INTERVAL_MS, resetLivePoolCache } from './useLivePool'
import { useSeasonPools } from './useSeasonPools'

const BASE = 'https://example.blob.core.windows.net/scores'
const scheduled = { kickoffTime: 'k', status: 'scheduled', awayScore: null, homeScore: null, winner: null } as const
const final = { kickoffTime: 'k', status: 'final', awayScore: 3, homeScore: 0, winner: 'A' } as const

const weekPool = (week: number, result: Pool['results'][string]): Pool => ({
  season: 2026,
  week,
  games: [{ id: 'A@B', away: 'A', home: 'B' }],
  participants: [],
  results: { 'A@B': result },
})

// Week 1 is final in the bundled data; weeks 2 and 3 only become final through live scores.
const week1 = weekPool(1, final)
const week2 = weekPool(2, scheduled)
const week3 = weekPool(3, scheduled)
const bundled = [week3, week1, week2] // deliberately out of order

function payload(week: number, status: string) {
  return {
    season: 2026,
    week,
    updated_at: '2026-11-01T18:00:00Z',
    games: { 'A@B': { kickoff_time: 'k', status, away_score: 3, home_score: 0, winner: status === 'final' ? 'A' : null } },
  }
}

const respond = (body: unknown, ok = true) => Promise.resolve({ ok, json: () => Promise.resolve(body) } as Response)
const urlWeek = (call: unknown[]) => Number(String(call[0]).match(/week-(\d+)\.json/)?.[1])
const statusOf = (pools: Pool[], week: number) => pools.find((p) => p.week === week)?.results['A@B'].status

describe('useSeasonPools', () => {
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

  it('returns the weeks in order, and never fetches, without a scores URL', () => {
    const { result } = renderHook(() => useSeasonPools(bundled, undefined))

    expect(result.current.pools.map((p) => p.week)).toEqual([1, 2, 3])
    expect(result.current).toMatchObject({ loading: false, failedWeeks: [] })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fetches every week that is not final yet, and skips weeks the bundled data already finished', async () => {
    fetchMock.mockImplementation((url: string) => respond(payload(Number(url.match(/week-(\d+)/)?.[1]), 'final')))
    const { result } = renderHook(() => useSeasonPools(bundled, BASE))

    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(fetchMock.mock.calls.map(urlWeek).sort()).toEqual([2, 3])
    expect(fetchMock.mock.calls[0][0]).toMatch(`${BASE}/2026/week-`)
    expect([1, 2, 3].map((w) => statusOf(result.current.pools, w))).toEqual(['final', 'final', 'final'])
  })

  it('keeps the bundled data for a week that fails to load, and says which week it was', async () => {
    fetchMock.mockImplementation((url: string) => {
      const week = Number(url.match(/week-(\d+)/)?.[1])
      return week === 3 ? Promise.reject(new Error('offline')) : respond(payload(week, 'final'))
    })
    const { result } = renderHook(() => useSeasonPools(bundled, BASE))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.failedWeeks).toEqual([3])
    expect(statusOf(result.current.pools, 2)).toBe('final')
    expect(statusOf(result.current.pools, 3)).toBe('scheduled')
  })

  it('treats a response that is not ok as a failed week', async () => {
    fetchMock.mockImplementation(() => respond({}, false))
    const { result } = renderHook(() => useSeasonPools([week2], BASE))

    await waitFor(() => expect(result.current.failedWeeks).toEqual([2]))
    expect(result.current.loading).toBe(false)
  })

  it('reuses scores another screen already fetched, instead of fetching them again', async () => {
    cacheLiveScores(2026, 2, { updatedAt: null, games: { 'A@B': final } })
    fetchMock.mockImplementation((url: string) => respond(payload(Number(url.match(/week-(\d+)/)?.[1]), 'final')))
    const { result } = renderHook(() => useSeasonPools(bundled, BASE))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(fetchMock.mock.calls.map(urlWeek)).toEqual([3])
    expect(statusOf(result.current.pools, 2)).toBe('final')
  })

  it('keeps polling only the weeks that are still in progress, and stops when they are all final', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    fetchMock.mockImplementation((url: string) => {
      const week = Number(url.match(/week-(\d+)/)?.[1])
      return respond(payload(week, week === 3 ? 'in_progress' : 'final'))
    })
    const { result } = renderHook(() => useSeasonPools(bundled, BASE))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(fetchMock.mock.calls.map(urlWeek).sort()).toEqual([2, 3])

    fetchMock.mockClear()
    fetchMock.mockImplementation(() => respond(payload(3, 'final')))
    await act(() => vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS))
    await waitFor(() => expect(statusOf(result.current.pools, 3)).toBe('final'))
    expect(fetchMock.mock.calls.map(urlWeek)).toEqual([3]) // week 2 was already final

    fetchMock.mockClear()
    await act(() => vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 3))
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('recovers a failed week on a later poll', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    fetchMock.mockReturnValueOnce(Promise.reject(new Error('offline'))).mockImplementation(() => respond(payload(2, 'final')))
    const { result } = renderHook(() => useSeasonPools([week2], BASE))
    await waitFor(() => expect(result.current.failedWeeks).toEqual([2]))

    await act(() => vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS))

    await waitFor(() => expect(result.current.failedWeeks).toEqual([]))
    expect(statusOf(result.current.pools, 2)).toBe('final')
  })

  it('does not refetch just because the caller passes a new array on every render', async () => {
    fetchMock.mockImplementation(() => respond(payload(2, 'in_progress'))) // stays unfinished, so a loop would be visible
    const { result, rerender } = renderHook(() => useSeasonPools([week2], BASE))
    await waitFor(() => expect(result.current.loading).toBe(false))

    rerender()
    rerender()

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('is empty for a season with no weeks', () => {
    const { result } = renderHook(() => useSeasonPools([], BASE))

    expect(result.current).toEqual({ pools: [], loading: false, failedWeeks: [] })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
