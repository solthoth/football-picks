import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SeasonWeekLabel } from './SeasonWeekLabel'

describe('SeasonWeekLabel', () => {
  it('reads as plain "Season 2026 · Week 10" text, with ordinary spaces', () => {
    render(
      <h1>
        <SeasonWeekLabel season={2026} week={10} />
      </h1>,
    )

    expect(screen.getByRole('heading', { name: 'Season 2026 · Week 10' })).toBeInTheDocument()
  })

  it('never breaks inside "Season 2026" or "Week 10", so a narrow screen cannot strand the week number', () => {
    render(<SeasonWeekLabel season={2026} week={10} />)

    expect(screen.getByText('Season 2026')).toHaveStyle({ whiteSpace: 'nowrap' })
    expect(screen.getByText('Week 10')).toHaveStyle({ whiteSpace: 'nowrap' })
  })
})
