import { beforeEach, describe, expect, it } from 'vitest'
import { lastViewedWeek, rememberViewedWeek, resetLastViewedWeek } from './lastViewedWeek'

describe('lastViewedWeek', () => {
  beforeEach(() => {
    resetLastViewedWeek()
  })

  it('is empty until a week has been viewed', () => {
    expect(lastViewedWeek()).toBeUndefined()
  })

  it('remembers the most recently viewed week', () => {
    rememberViewedWeek(2026, 9)
    rememberViewedWeek(2026, 4)

    expect(lastViewedWeek()).toEqual({ season: 2026, week: 4 })
  })
})
