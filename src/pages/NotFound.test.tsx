import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { guaranteedHeightPx, MIN_TOUCH_TARGET_PX } from '../testUtils/layout'
import { NotFound } from './NotFound'
import { NotFoundPool } from './NotFoundPool'

describe('NotFound', () => {
  it('shows a simple not-found message with a link home', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /football picks/i })).toHaveAttribute('href', '/')
  })

  it('makes the link home a comfortable touch target', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    )

    expect(guaranteedHeightPx(screen.getByRole('link', { name: /football picks/i }))).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX)
  })
})

describe('NotFoundPool', () => {
  it('makes the "Start over" link a comfortable touch target', () => {
    render(
      <MemoryRouter>
        <NotFoundPool />
      </MemoryRouter>,
    )

    expect(guaranteedHeightPx(screen.getByRole('link', { name: /start over/i }))).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX)
  })
})
