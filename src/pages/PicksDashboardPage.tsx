import { useParams } from 'react-router-dom'
import { PicksDashboard } from '../components/PicksDashboard'
import { pools } from '../data/pools'
import { useLivePool } from '../data/useLivePool'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { NotFoundPool } from './NotFoundPool'

export function PicksDashboardPage() {
  const { season, week } = useParams()
  const seasonNumber = Number(season)
  const weekNumber = Number(week)
  const pool = useLivePool(pools.find((p) => p.season === seasonNumber && p.week === weekNumber))

  useDocumentTitle(pool && `Week ${pool.week} pick split (${pool.season})`)

  if (!pool) return <NotFoundPool />

  return <PicksDashboard pool={pool} />
}
