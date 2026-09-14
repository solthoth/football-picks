import { useNavigate, useParams } from 'react-router-dom'
import { ParticipantList } from '../components/ParticipantList'
import { pools } from '../data/pools'
import { NotFoundPool } from './NotFoundPool'

export function ParticipantListPage() {
  const navigate = useNavigate()
  const { season, week } = useParams()
  const seasonNumber = Number(season)
  const weekNumber = Number(week)
  const pool = pools.find((p) => p.season === seasonNumber && p.week === weekNumber)

  if (!pool) return <NotFoundPool />

  return (
    <ParticipantList
      pool={pool}
      onSelect={(participant) =>
        navigate(`/season/${seasonNumber}/week/${weekNumber}/participant/${encodeURIComponent(participant)}`)
      }
      onBack={() => navigate('/')}
    />
  )
}
