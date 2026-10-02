import { Route, Routes } from 'react-router-dom'
import { NotFound } from './pages/NotFound'
import { ParticipantDetailPage } from './pages/ParticipantDetailPage'
import { ParticipantListPage } from './pages/ParticipantListPage'
import { PicksDashboardPage } from './pages/PicksDashboardPage'
import { SeasonWeekSelectPage } from './pages/SeasonWeekSelectPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<SeasonWeekSelectPage />} />
      <Route path="/season/:season/week/:week" element={<ParticipantListPage />} />
      <Route path="/season/:season/week/:week/dashboard" element={<PicksDashboardPage />} />
      <Route path="/season/:season/week/:week/participant/:participant" element={<ParticipantDetailPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
