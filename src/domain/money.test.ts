import { describe, expect, it } from 'vitest'
import { formatMoney } from './money'

describe('formatMoney', () => {
  it.each([
    [0, '$0'],
    [150, '$150'],
    [1545, '$1,545'],
    [97.5, '$97.50'],
    [82.5, '$82.50'],
    [1234.5, '$1,234.50'],
  ])('formats %s as %s', (amount, expected) => {
    expect(formatMoney(amount)).toBe(expected)
  })

  it('shows cents only when there are some, so whole dollars stay tidy', () => {
    expect(formatMoney(75)).toBe('$75')
    expect(formatMoney(75.25)).toBe('$75.25')
  })
})
