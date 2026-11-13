import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetLivePoolCache, useLivePool } from '../data/useLivePool'
import type { Pool } from '../data/types'
import { guaranteedHeightPx, MIN_TOUCH_TARGET_PX } from '../testUtils/layout'
import { renderWithTheme } from '../testUtils/renderWithTheme'
import { ScoresAsOf } from './ScoresAsOf'

const BASE = 'https://example.blob.core.windows.net/scores'
const scheduled = { kickoffTime: 'k', status: 'scheduled', awayScore: null, homeScore: null, winner: null } as const
const unfinished: Pool = { season: 2026, week: 3, games: [{ id: 'A@B', away: 'A', home: 'B' }], participants: [], results: { 'A@B': scheduled } }
const finished: Pool = { ...unfinished, results: { 'A@B': { ...scheduled, status: 'final', winner: 'A' } } }

const payload = (status: string) => ({
  season: 2026,
  week: 3,
  updated_at: '2026-11-01T18:00:00Z',
  games: { 'A@B': { kickoff_time: 'k', status, away_score: 1, home_score: 0, winner: status === 'final' ? 'A' : null } },
})
const respond = (body: unknown, ok = true) => Promise.resolve({ ok, json: () => Promise.resolve(body) } as Response)

/** What the real screens do: take a bundled pool through useLivePool, then render the caption for the result. */
function Screen({ pool, baseUrl = BASE }: { pool: Pool; baseUrl?: string }) {
  const live = useLivePool(pool, baseUrl)
  return live ? <ScoresAsOf pool={live} /> : null
}

describe('ScoresAsOf', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    resetLivePoolCache()
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows when the scores were last updated, with a refresh button beside it while games are unfinished', async () => {
    fetchMock.mockReturnValue(respond(payload('in_progress')))
    renderWithTheme(<Screen pool={unfinished} />)

    expect(await screen.findByText(/^Scores as of /)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Refresh scores' })).toBeInTheDocument()
  })

  it('fetches again when the button is used, and is busy while it does', async () => {
    const user = userEvent.setup()
    fetchMock.mockReturnValueOnce(respond(payload('in_progress')))
    renderWithTheme(<Screen pool={unfinished} />)
    const button = await screen.findByRole('button', { name: 'Refresh scores' })

    let finish: (value: Response) => void = () => {}
    fetchMock.mockReturnValue(new Promise<Response>((resolve) => (finish = resolve)))
    await user.click(button)

    const busy = await screen.findByRole('button', { name: 'Refreshing scores' })
    expect(busy).toBeDisabled()
    expect(fetchMock).toHaveBeenCalledTimes(2)

    await act(async () => finish({ ok: true, json: () => Promise.resolve(payload('in_progress')) } as Response))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Refresh scores' })).toBeEnabled())
  })

  it('offers no refresh once every game is final, only the time of the last update', async () => {
    fetchMock.mockReturnValue(respond(payload('final')))
    renderWithTheme(<Screen pool={unfinished} />)

    expect(await screen.findByText(/^Scores as of /)).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('button', { name: /refresh/i })).not.toBeInTheDocument())
  })

  it('renders nothing for a finished week with no live data', () => {
    const { container } = renderWithTheme(<Screen pool={finished} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('still offers a refresh when the first load failed and there is no time to show', async () => {
    fetchMock.mockReturnValue(Promise.reject(new Error('offline')))
    renderWithTheme(<Screen pool={unfinished} />)

    expect(await screen.findByRole('button', { name: 'Refresh scores' })).toBeInTheDocument()
    expect(screen.queryByText(/Scores as of/)).not.toBeInTheDocument()
  })

  it('is a comfortable touch target', async () => {
    fetchMock.mockReturnValue(respond(payload('in_progress')))
    renderWithTheme(<Screen pool={unfinished} />)

    expect(guaranteedHeightPx(await screen.findByRole('button', { name: 'Refresh scores' }))).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX)
  })
})
