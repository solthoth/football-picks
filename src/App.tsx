import { Route, Routes } from 'react-router-dom'
import './App.css'
import { ParticipantDetailPage } from './pages/ParticipantDetailPage'
import { ParticipantListPage } from './pages/ParticipantListPage'
import { SeasonWeekSelectPage } from './pages/SeasonWeekSelectPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<SeasonWeekSelectPage />} />
      <Route path="/season/:season/week/:week" element={<ParticipantListPage />} />
      <Route path="/season/:season/week/:week/participant/:participant" element={<ParticipantDetailPage />} />
      <Route path="*" element={<SeasonWeekSelectPage />} />
    </Routes>
  )
}

export default App
