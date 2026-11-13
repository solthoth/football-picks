import { useNavigate, useParams } from 'react-router-dom'
import { ParticipantList } from '../components/ParticipantList'
import { pools } from '../data/pools'
import { useLivePool } from '../data/useLivePool'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { NotFoundPool } from './NotFoundPool'

export function ParticipantListPage() {
  const navigate = useNavigate()
  const { season, week } = useParams()
  const seasonNumber = Number(season)
  const weekNumber = Number(week)
  const pool = useLivePool(pools.find((p) => p.season === seasonNumber && p.week === weekNumber))

  useDocumentTitle(pool && `Week ${pool.week} standings (${pool.season})`)

  if (!pool) return <NotFoundPool />

  return (
    <ParticipantList
      pool={pool}
      onSelect={(participant) =>
        navigate(`/season/${seasonNumber}/week/${weekNumber}/participant/${encodeURIComponent(participant)}`)
      }
      onBack={() => navigate('/')}
      onOpenDashboard={() => navigate(`/season/${seasonNumber}/week/${weekNumber}/dashboard`)}
    />
  )
}
