import { useEffect } from 'react'
import { matchPath, Route, Routes, useLocation } from 'react-router-dom'
import { rememberViewedWeek } from './data/lastViewedWeek'
import { GamePicksPage } from './pages/GamePicksPage'
import { NotFound } from './pages/NotFound'
import { ParticipantDetailPage } from './pages/ParticipantDetailPage'
import { ParticipantListPage } from './pages/ParticipantListPage'
import { PicksDashboardPage } from './pages/PicksDashboardPage'
import { SeasonStandingsPage } from './pages/SeasonStandingsPage'
import { SeasonWeekSelectPage } from './pages/SeasonWeekSelectPage'

/** Notes which week is open (on any of its screens) so the home page can reopen on it. */
function useRememberViewedWeek() {
  const { pathname } = useLocation()

  useEffect(() => {
    const match = matchPath({ path: '/season/:season/week/:week', end: false }, pathname)
    if (match) rememberViewedWeek(Number(match.params.season), Number(match.params.week))
  }, [pathname])
}

function App() {
  useRememberViewedWeek()

  return (
    <Routes>
      <Route path="/" element={<SeasonWeekSelectPage />} />
      <Route path="/season/:season" element={<SeasonStandingsPage />} />
      <Route path="/season/:season/week/:week" element={<ParticipantListPage />} />
      <Route path="/season/:season/week/:week/dashboard" element={<PicksDashboardPage />} />
      <Route path="/season/:season/week/:week/game/:gameId" element={<GamePicksPage />} />
      <Route path="/season/:season/week/:week/participant/:participant" element={<ParticipantDetailPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
