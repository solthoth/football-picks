import { useNavigate } from 'react-router-dom'
import { SeasonWeekSelect } from '../components/SeasonWeekSelect'
import { pools } from '../data/pools'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function SeasonWeekSelectPage() {
  const navigate = useNavigate()
  useDocumentTitle('')

  return <SeasonWeekSelect pools={pools} onSelect={(season, week) => navigate(`/season/${season}/week/${week}`)} />
}
