import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useDocumentTitle } from './useDocumentTitle'

describe('useDocumentTitle', () => {
  beforeEach(() => {
    document.title = 'initial'
  })

  it('sets the title with the app name appended', () => {
    renderHook(() => useDocumentTitle('Week 9 standings'))
    expect(document.title).toBe('Week 9 standings · Football Picks')
  })

  it('uses just the app name when given an empty title', () => {
    renderHook(() => useDocumentTitle(''))
    expect(document.title).toBe('Football Picks')
  })

  it('follows changes to the title', () => {
    const { rerender } = renderHook(({ title }) => useDocumentTitle(title), { initialProps: { title: 'One' } })
    rerender({ title: 'Two' })
    expect(document.title).toBe('Two · Football Picks')
  })

  it('leaves the title alone while undefined (so a child fallback page can set its own)', () => {
    renderHook(() => useDocumentTitle(undefined))
    expect(document.title).toBe('initial')
  })
})
