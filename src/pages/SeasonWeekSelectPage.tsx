import { useNavigate } from 'react-router-dom'
import { SeasonWeekSelect } from '../components/SeasonWeekSelect'
import { lastViewedWeek } from '../data/lastViewedWeek'
import { pools } from '../data/pools'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function SeasonWeekSelectPage() {
  const navigate = useNavigate()
  useDocumentTitle('')

  return (
    <SeasonWeekSelect
      pools={pools}
      initial={lastViewedWeek()}
      onSelect={(season, week) => navigate(`/season/${season}/week/${week}`)}
    />
  )
}
