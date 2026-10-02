import { useNavigate, useParams } from 'react-router-dom'
import { PicksDashboard } from '../components/PicksDashboard'
import { pools } from '../data/pools'
import { useLivePool } from '../data/useLivePool'
import { NotFoundPool } from './NotFoundPool'

export function PicksDashboardPage() {
  const navigate = useNavigate()
  const { season, week } = useParams()
  const seasonNumber = Number(season)
  const weekNumber = Number(week)
  const pool = useLivePool(pools.find((p) => p.season === seasonNumber && p.week === weekNumber))

  if (!pool) return <NotFoundPool />

  return <PicksDashboard pool={pool} onBack={() => navigate(`/season/${seasonNumber}/week/${weekNumber}`)} />
}
