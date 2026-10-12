import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PullToRefresh } from '../components/PullToRefresh'
import { isTrustedEvent } from './isTrustedEvent'
import { COOLDOWN_MS, HOLD_MS, PULL_THRESHOLD_PX, usePullToRefresh } from './usePullToRefresh'

// jsdom marks every script-dispatched event untrusted and the flag can't be
// forged, so the default stub trusts everything; one test restores the real check.
vi.mock('./isTrustedEvent', () => ({ isTrustedEvent: vi.fn(() => true) }))

const touch = (y: number, x = 100, identifier = 0) => ({ identifier, clientX: x, clientY: y })
const start = (y = 0, target: Element | Document = document) => fireEvent.touchStart(target, { touches: [touch(y)] })
const move = (y: number, x = 100) => fireEvent.touchMove(document, { touches: [touch(y, x)] })
const end = () => fireEvent.touchEnd(document, { touches: [] })
const setPageScroll = (value: number) =>
  Object.defineProperty(document.documentElement, 'scrollTop', { value, configurable: true, writable: true })
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms))

describe('usePullToRefresh', () => {
  const onRefresh = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    sessionStorage.clear()
    onRefresh.mockClear()
    vi.mocked(isTrustedEvent).mockReturnValue(true)
  })
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
    setPageScroll(0)
  })

  const setup = (enabled = true) => renderHook(() => usePullToRefresh({ onRefresh, enabled }))

  it('reloads after the pull passes the threshold and is held', () => {
    const { result } = setup()
    start(0)
    move(20)
    expect(result.current.phase).toBe('pulling')
    move(PULL_THRESHOLD_PX + 5)
    expect(result.current.phase).toBe('armed')

    advance(HOLD_MS - 1)
    expect(onRefresh).not.toHaveBeenCalled()
    advance(1)
    expect(onRefresh).toHaveBeenCalledTimes(1)
    expect(result.current.phase).toBe('refreshing')
  })

  it('does not reload when released before the hold completes', () => {
    const { result } = setup()
    start(0)
    move(PULL_THRESHOLD_PX + 5)
    advance(HOLD_MS / 2)
    end()
    advance(HOLD_MS)
    expect(onRefresh).not.toHaveBeenCalled()
    expect(result.current.phase).toBe('idle')
  })

  it('does not reload if the finger slides back above the threshold', () => {
    const { result } = setup()
    start(0)
    move(PULL_THRESHOLD_PX + 5)
    move(PULL_THRESHOLD_PX - 20)
    expect(result.current.phase).toBe('pulling')
    advance(HOLD_MS * 2)
    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('ignores a quick swipe that never passes the threshold', () => {
    setup()
    start(0)
    move(40)
    end()
    advance(HOLD_MS * 2)
    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('cancels on upward or horizontal movement', () => {
    const { result } = setup()
    start(50)
    move(20)
    expect(result.current.phase).toBe('idle')

    start(0)
    move(30, 200)
    expect(result.current.phase).toBe('idle')
    move(PULL_THRESHOLD_PX + 5, 200)
    advance(HOLD_MS * 2)
    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('cancels when a second finger lands', () => {
    const { result } = setup()
    start(0)
    move(PULL_THRESHOLD_PX + 5)
    fireEvent.touchStart(document, { touches: [touch(0), touch(0, 200, 1)] })
    expect(result.current.phase).toBe('idle')
    advance(HOLD_MS * 2)
    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('does not start when the page is scrolled', () => {
    const { result } = setup()
    setPageScroll(120)
    start(0)
    move(PULL_THRESHOLD_PX + 5)
    expect(result.current.phase).toBe('idle')
  })

  it('aborts if the page scrolls mid-hold', () => {
    const { result } = setup()
    start(0)
    move(PULL_THRESHOLD_PX + 5)
    setPageScroll(5)
    advance(HOLD_MS)
    expect(onRefresh).not.toHaveBeenCalled()
    expect(result.current.phase).toBe('idle')
  })

  it('does not start inside a scrolled container, form field, dialog or opt-out region', () => {
    const { result } = setup()
    document.body.innerHTML = `
      <div id="list"><p id="inList">row</p></div>
      <input id="field" />
      <div role="dialog"><button id="inDialog">x</button></div>
      <div data-no-pull-refresh><span id="optOut">y</span></div>`
    Object.defineProperty(document.getElementById('list')!, 'scrollTop', { value: 30, configurable: true })

    for (const id of ['inList', 'field', 'inDialog', 'optOut']) {
      start(0, document.getElementById(id)!)
      move(PULL_THRESHOLD_PX + 5)
      expect(result.current.phase, id).toBe('idle')
    }
  })

  it('does not start while the tab is hidden', () => {
    const { result } = setup()
    const spy = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    start(0)
    move(PULL_THRESHOLD_PX + 5)
    expect(result.current.phase).toBe('idle')
    spy.mockRestore()
  })

  it('rate-limits consecutive reloads', () => {
    const { result } = setup()
    const pullAndHold = () => {
      start(0)
      move(PULL_THRESHOLD_PX + 5)
      advance(HOLD_MS)
      end()
    }
    pullAndHold()
    expect(onRefresh).toHaveBeenCalledTimes(1)

    pullAndHold()
    expect(onRefresh).toHaveBeenCalledTimes(1)
    expect(result.current.phase).toBe('idle')

    advance(COOLDOWN_MS)
    pullAndHold()
    expect(onRefresh).toHaveBeenCalledTimes(2)
  })

  it('still works when sessionStorage is unavailable', () => {
    setup()
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    start(0)
    move(PULL_THRESHOLD_PX + 5)
    advance(HOLD_MS)
    expect(onRefresh).toHaveBeenCalledTimes(1)
    spy.mockRestore()
  })

  it('ignores gestures when disabled and cleans up on unmount', () => {
    const disabled = setup(false)
    start(0)
    move(PULL_THRESHOLD_PX + 5)
    expect(disabled.result.current.phase).toBe('idle')
    disabled.unmount()

    const live = setup()
    start(0)
    move(PULL_THRESHOLD_PX + 5)
    live.unmount()
    advance(HOLD_MS * 2)
    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('ignores untrusted (script-dispatched) events', async () => {
    const real = await vi.importActual<typeof import('./isTrustedEvent')>('./isTrustedEvent')
    vi.mocked(isTrustedEvent).mockImplementation(real.isTrustedEvent)
    const { result } = setup()
    start(0)
    move(PULL_THRESHOLD_PX + 5)
    advance(HOLD_MS * 2)
    expect(result.current.phase).toBe('idle')
    expect(onRefresh).not.toHaveBeenCalled()
  })
})

describe('PullToRefresh', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    sessionStorage.clear()
    vi.mocked(isTrustedEvent).mockReturnValue(true)
  })
  afterEach(() => vi.useRealTimers())

  it('shows progress labels through the gesture and calls onRefresh', () => {
    const onRefresh = vi.fn()
    render(<PullToRefresh onRefresh={onRefresh} />)
    const status = screen.getByRole('status', { hidden: true })
    expect(status).toHaveTextContent('')

    start(0)
    move(30)
    expect(status).toHaveTextContent('Pull down and hold to refresh')
    move(PULL_THRESHOLD_PX + 5)
    expect(status).toHaveTextContent('Keep holding to refresh')
    advance(HOLD_MS)
    expect(status).toHaveTextContent('Refreshing…')
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('disables the browser-native pull-to-refresh', () => {
    render(<PullToRefresh />)
    expect(getComputedStyle(document.documentElement).overscrollBehaviorY).toBe('contain')
  })
})
