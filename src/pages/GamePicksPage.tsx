import { useLocation, useParams } from 'react-router-dom'
import { readBackLabel } from '../components/backNavigation'
import { GamePicks } from '../components/GamePicks'
import { pools } from '../data/pools'
import { useLivePool } from '../data/useLivePool'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { NotFoundPool } from './NotFoundPool'

export function GamePicksPage() {
  const location = useLocation()
  const { season, week, gameId } = useParams()
  const seasonNumber = Number(season)
  const weekNumber = Number(week)
  const pool = useLivePool(pools.find((p) => p.season === seasonNumber && p.week === weekNumber))

  const game = pool?.games.find((g) => g.id === gameId)
  useDocumentTitle(pool && (game ? `${game.away} @ ${game.home} · Week ${pool.week} (${pool.season})` : 'Game not found'))

  if (!pool || !gameId) return <NotFoundPool />

  return <GamePicks pool={pool} gameId={gameId} backLabel={readBackLabel(location.state)} />
}
