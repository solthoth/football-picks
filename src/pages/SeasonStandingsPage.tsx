import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { SeasonStandings } from '../components/SeasonStandings'
import { pools } from '../data/pools'
import { useSeasonPools } from '../data/useSeasonPools'
import { buildSeasonStandings } from '../domain/seasonStandings'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { NotFoundPool } from './NotFoundPool'

export function SeasonStandingsPage() {
  const { season } = useParams()
  const seasonNumber = Number(season)
  const bundled = useMemo(() => pools.filter((pool) => pool.season === seasonNumber), [seasonNumber])
  const { pools: seasonPools, loading, failedWeeks } = useSeasonPools(bundled)
  const standings = useMemo(() => buildSeasonStandings(seasonPools), [seasonPools])

  // While the season is unknown the not-found screen sets the title itself.
  useDocumentTitle(bundled.length > 0 ? `Season ${seasonNumber} standings` : undefined)

  if (bundled.length === 0) return <NotFoundPool title="Season not found" message="That season isn't available." />

  return <SeasonStandings season={seasonNumber} standings={standings} loading={loading} failedWeeks={failedWeeks} />
}
