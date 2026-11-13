import { NotFoundCard } from '../components/NotFoundCard'
import { pools } from '../data/pools'
import { latestPool } from '../data/weeks'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

/** Shown for a season/week that is not in the data. Points at the latest week, the most likely thing the visitor wanted. */
export function NotFoundPool() {
  useDocumentTitle('Week not found')
  const latest = latestPool(pools)

  return (
    <NotFoundCard
      title="Week not found"
      message="That season/week isn't available."
      actionLabel={latest ? 'Go to the latest week' : 'Go to Football Picks'}
      to={latest ? `/season/${latest.season}/week/${latest.week}` : '/'}
    />
  )
}
