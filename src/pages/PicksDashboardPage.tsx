import { useNavigate, useParams } from 'react-router-dom'
import { PicksDashboard } from '../components/PicksDashboard'
import { pools } from '../data/pools'
import { useLivePool } from '../data/useLivePool'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import type { BackState } from './backNavigation'
import { NotFoundPool } from './NotFoundPool'

export function PicksDashboardPage() {
  const navigate = useNavigate()
  const { season, week } = useParams()
  const seasonNumber = Number(season)
  const weekNumber = Number(week)
  const pool = useLivePool(pools.find((p) => p.season === seasonNumber && p.week === weekNumber))

  useDocumentTitle(pool && `Week ${pool.week} pick split (${pool.season})`)

  if (!pool) return <NotFoundPool />

  return (
    <PicksDashboard
      pool={pool}
      onBack={() => navigate(`/season/${seasonNumber}/week/${weekNumber}`)}
      onSelectGame={(gameId) => {
        const state: BackState = { backLabel: 'Back to dashboard' }
        navigate(`/season/${seasonNumber}/week/${weekNumber}/game/${encodeURIComponent(gameId)}`, { state })
      }}
    />
  )
}
