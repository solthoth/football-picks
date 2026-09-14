import { useNavigate } from 'react-router-dom'
import { SeasonWeekSelect } from '../components/SeasonWeekSelect'
import { pools } from '../data/pools'

export function SeasonWeekSelectPage() {
  const navigate = useNavigate()

  return <SeasonWeekSelect pools={pools} onSelect={(season, week) => navigate(`/season/${season}/week/${week}`)} />
}
