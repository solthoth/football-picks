import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { GamePicks } from '../components/GamePicks'
import { pools } from '../data/pools'
import { useLivePool } from '../data/useLivePool'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { goBack, readBackLabel } from './backNavigation'
import type { BackState } from './backNavigation'
import { NotFoundPool } from './NotFoundPool'

export function GamePicksPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { season, week, gameId } = useParams()
  const seasonNumber = Number(season)
  const weekNumber = Number(week)
  const pool = useLivePool(pools.find((p) => p.season === seasonNumber && p.week === weekNumber))
  const backLabel = readBackLabel(location.state)
  const weekPath = `/season/${seasonNumber}/week/${weekNumber}`

  const game = pool?.games.find((g) => g.id === gameId)
  const matchup = game ? `${game.away} @ ${game.home}` : 'game'
  useDocumentTitle(pool && (game ? `${matchup} · Week ${pool.week} (${pool.season})` : 'Game not found'))

  if (!pool || !gameId) return <NotFoundPool />

  return (
    <GamePicks
      pool={pool}
      gameId={gameId}
      backLabel={backLabel}
      onBack={() => goBack(navigate, backLabel, `${weekPath}/dashboard`)}
      onSelectParticipant={(participant) => {
        const state: BackState = { backLabel: `Back to ${matchup}` }
        navigate(`${weekPath}/participant/${encodeURIComponent(participant)}`, { state })
      }}
    />
  )
}
