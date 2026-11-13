import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ParticipantDetail } from '../components/ParticipantDetail'
import { pools } from '../data/pools'
import { useLivePool } from '../data/useLivePool'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { goBack, readBackLabel } from './backNavigation'
import type { BackState } from './backNavigation'
import { NotFoundPool } from './NotFoundPool'

export function ParticipantDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { season, week, participant } = useParams()
  const seasonNumber = Number(season)
  const weekNumber = Number(week)
  const pool = useLivePool(pools.find((p) => p.season === seasonNumber && p.week === weekNumber))

  const backLabel = readBackLabel(location.state)

  const participantName = participant === undefined ? undefined : decodeURIComponent(participant)
  const known = pool?.participants.some((p) => p.name === participantName)
  useDocumentTitle(pool && (known ? `${participantName} · Week ${pool.week} (${pool.season})` : 'Player not found'))

  if (!pool || !participant || participantName === undefined) return <NotFoundPool />

  return (
    <ParticipantDetail
      pool={pool}
      participantName={participantName}
      backLabel={backLabel}
      onBack={() => goBack(navigate, backLabel, `/season/${seasonNumber}/week/${weekNumber}`)}
      onSelectGame={(gameId) => {
        const state: BackState = { backLabel: `Back to ${participantName}` }
        navigate(`/season/${seasonNumber}/week/${weekNumber}/game/${encodeURIComponent(gameId)}`, { state })
      }}
    />
  )
}
