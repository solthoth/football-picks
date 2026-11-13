import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { parseColor } from '../testUtils/contrast'
import { renderWithRouter } from '../testUtils/renderWithRouter'
import { PageHeader } from './PageHeader'

function renderHeader(mode: 'light' | 'dark' = 'light') {
  return renderWithRouter(
    <PageHeader
      back={{ to: '/season/2026/week/1', label: 'Back to standings' }}
      share={{ url: 'https://example.com/x', title: 'X', text: 'See X' }}
    />,
    { mode },
  )
}

describe('PageHeader', () => {
  it('holds the back link and the share button', () => {
    renderHeader()

    const header = document.querySelector('header')
    expect(header).toContainElement(screen.getByRole('link', { name: 'Back to standings' }))
    expect(header).toContainElement(screen.getByRole('button', { name: /share/i }))
  })

  it('sticks to the top of the screen so back and share stay reachable on a long page', () => {
    renderHeader()

    const header = document.querySelector('header') as HTMLElement
    expect(header).toHaveStyle({ position: 'sticky', top: '0px' })
  })

  it.each(['light', 'dark'] as const)('has an opaque background in %s mode, so content scrolling underneath does not show through', (mode) => {
    renderHeader(mode)

    const header = document.querySelector('header') as HTMLElement
    expect(parseColor(getComputedStyle(header).backgroundColor).a).toBe(1)
  })

  it('sits above page content but below dialogs, banners and menus', () => {
    renderHeader()

    const header = document.querySelector('header') as HTMLElement
    const zIndex = Number(getComputedStyle(header).zIndex)
    expect(zIndex).toBeGreaterThan(0)
    expect(zIndex).toBeLessThan(1000)
  })
})
