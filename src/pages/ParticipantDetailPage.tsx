import { useNavigate, useParams } from 'react-router-dom'
import { ParticipantDetail } from '../components/ParticipantDetail'
import { pools } from '../data/pools'
import { NotFoundPool } from './NotFoundPool'

export function ParticipantDetailPage() {
  const navigate = useNavigate()
  const { season, week, participant } = useParams()
  const seasonNumber = Number(season)
  const weekNumber = Number(week)
  const pool = pools.find((p) => p.season === seasonNumber && p.week === weekNumber)

  if (!pool || !participant) return <NotFoundPool />

  return (
    <ParticipantDetail
      pool={pool}
      participantName={decodeURIComponent(participant)}
      onBack={() => navigate(`/season/${seasonNumber}/week/${weekNumber}`)}
    />
  )
}
