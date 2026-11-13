import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Pool } from '../data/types'
import { renderWithRouter } from '../testUtils/renderWithRouter'

const pool = (season: number, week: number): Pool => ({ season, week, games: [], participants: [], results: {} })
const { mockPools } = vi.hoisted(() => ({ mockPools: { current: [] as Pool[] } }))
vi.mock('../data/pools', () => ({ get pools() { return mockPools.current } }))

const { NotFoundPool } = await import('./NotFoundPool')

describe('NotFoundPool', () => {
  it('says the week is missing and sends the user to the latest week', () => {
    mockPools.current = [pool(2025, 18), pool(2026, 2), pool(2026, 10), pool(2026, 4)]
    renderWithRouter(<NotFoundPool />)

    expect(screen.getByRole('heading', { level: 1, name: 'Week not found' })).toBeInTheDocument()
    expect(screen.getByText(/isn't available/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to the latest week' })).toHaveAttribute('href', '/season/2026/week/10')
  })

  it('falls back to the home page when there is no week to suggest', () => {
    mockPools.current = []
    renderWithRouter(<NotFoundPool />)

    expect(screen.getByRole('link', { name: 'Go to Football Picks' })).toHaveAttribute('href', '/')
  })
})
