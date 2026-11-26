import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LocaleProvider } from './i18n/LocaleContext'
import { GameProvider } from './context/GameContext'
import HomePage from './pages/HomePage'
import LobbyPage from './pages/LobbyPage'
import HostPage from './pages/HostPage'
import PlayPage from './pages/PlayPage'
import ResultsPage from './pages/ResultsPage'
import CreateQuizPage from './pages/CreateQuizPage'

export default function App() {
  return (
    <LocaleProvider>
      <GameProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/create" element={<CreateQuizPage />} />
            <Route path="/lobby" element={<LobbyPage />} />
            <Route path="/host" element={<HostPage />} />
            <Route path="/play" element={<PlayPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </GameProvider>
    </LocaleProvider>
  )
}
