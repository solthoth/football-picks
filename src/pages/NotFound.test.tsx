import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithRouter } from '../testUtils/renderWithRouter'
import { NotFound } from './NotFound'

describe('NotFound', () => {
  it('shows a heading, a message and a single primary link home', () => {
    renderWithRouter(<NotFound />)

    expect(screen.getByRole('heading', { level: 1, name: /page not found/i })).toBeInTheDocument()
    const home = screen.getByRole('link', { name: /football picks/i })
    expect(home).toHaveAttribute('href', '/')
    expect(home).toHaveClass('MuiButton-contained')
  })
})
