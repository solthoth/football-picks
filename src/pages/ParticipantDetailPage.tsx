import { useLocation, useParams } from 'react-router-dom'
import { readBackLabel } from '../components/backNavigation'
import { ParticipantDetail } from '../components/ParticipantDetail'
import { pools } from '../data/pools'
import { useLivePool } from '../data/useLivePool'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { NotFoundPool } from './NotFoundPool'

export function ParticipantDetailPage() {
  const location = useLocation()
  const { season, week, participant } = useParams()
  const seasonNumber = Number(season)
  const weekNumber = Number(week)
  const pool = useLivePool(pools.find((p) => p.season === seasonNumber && p.week === weekNumber))

  const participantName = participant === undefined ? undefined : decodeURIComponent(participant)
  const known = pool?.participants.some((p) => p.name === participantName)
  useDocumentTitle(pool && (known ? `${participantName} · Week ${pool.week} (${pool.season})` : 'Player not found'))

  if (!pool || participantName === undefined) return <NotFoundPool />

  return <ParticipantDetail pool={pool} participantName={participantName} backLabel={readBackLabel(location.state)} />
}
