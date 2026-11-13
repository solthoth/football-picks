import { describe, expect, it } from 'vitest'
import { compositeOver, contrastRatio, parseColor } from './contrast'

describe('parseColor', () => {
  it.each([
    ['#fff', { r: 255, g: 255, b: 255, a: 1 }],
    ['#1976d2', { r: 25, g: 118, b: 210, a: 1 }],
    ['rgb(25, 118, 210)', { r: 25, g: 118, b: 210, a: 1 }],
    ['rgba(25, 118, 210, 0.12)', { r: 25, g: 118, b: 210, a: 0.12 }],
    ['rgb(25 118 210 / 0.12)', { r: 25, g: 118, b: 210, a: 0.12 }],
  ])('parses %s', (input, expected) => {
    expect(parseColor(input)).toEqual(expected)
  })

  it('rejects colours it does not understand rather than guessing', () => {
    expect(() => parseColor('inherit')).toThrow(/inherit/)
  })
})

describe('compositeOver', () => {
  it('blends a translucent colour over an opaque one', () => {
    expect(compositeOver(parseColor('rgba(0, 0, 0, 0.5)'), parseColor('#ffffff'))).toEqual({ r: 127.5, g: 127.5, b: 127.5, a: 1 })
  })
})

describe('contrastRatio (WCAG 2.x)', () => {
  it('is 21:1 for black on white and 1:1 for identical colours', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5)
  })

  it('matches the published value for #767676 on white (the lightest grey that passes AA, 4.54:1)', () => {
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 2)
  })

  it('does not depend on which colour is foreground', () => {
    expect(contrastRatio('#1976d2', '#ffffff')).toBeCloseTo(contrastRatio('#ffffff', '#1976d2'), 10)
  })

  it('composites a translucent foreground over the background first', () => {
    expect(contrastRatio('rgba(0, 0, 0, 0.5)', '#ffffff')).toBeCloseTo(contrastRatio('#808080', '#ffffff'), 1)
  })
})
