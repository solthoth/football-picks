import { useMemo, useState } from 'react'
import type { Pool } from '../data/types'

interface SeasonWeekSelectProps {
  pools: Pool[]
  onSelect: (season: number, week: number) => void
}

export function SeasonWeekSelect({ pools, onSelect }: SeasonWeekSelectProps) {
  const seasons = useMemo(() => [...new Set(pools.map((p) => p.season))].sort((a, b) => b - a), [pools])
  const [season, setSeason] = useState<number | undefined>(seasons[0])

  const weeks = useMemo(
    () =>
      pools
        .filter((p) => p.season === season)
        .map((p) => p.week)
        .sort((a, b) => a - b),
    [pools, season],
  )
  const [week, setWeek] = useState<number | undefined>(weeks[0])

  if (pools.length === 0) {
    return (
      <main className="season-week-select">
        <h1>Football Picks</h1>
        <p>No pool data is available yet.</p>
      </main>
    )
  }

  function handleSeasonChange(value: string) {
    const nextSeason = Number(value)
    setSeason(nextSeason)
    const nextWeeks = pools
      .filter((p) => p.season === nextSeason)
      .map((p) => p.week)
      .sort((a, b) => a - b)
    setWeek(nextWeeks[0])
  }

  return (
    <main className="season-week-select">
      <h1>Football Picks</h1>
      <p>Select a season and week to see how everyone did.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (season !== undefined && week !== undefined) onSelect(season, week)
        }}
      >
        <label htmlFor="season-select">Season</label>
        <select id="season-select" value={season} onChange={(e) => handleSeasonChange(e.target.value)}>
          {seasons.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <label htmlFor="week-select">Week</label>
        <select id="week-select" value={week} onChange={(e) => setWeek(Number(e.target.value))}>
          {weeks.map((w) => (
            <option key={w} value={w}>
              Week {w}
            </option>
          ))}
        </select>

        <button type="submit">View Week</button>
      </form>
    </main>
  )
}
