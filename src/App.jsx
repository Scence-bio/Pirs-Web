import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LocaleProvider } from './i18n/LocaleContext'
import { GameProvider } from './context/GameContext'

const HomePage = lazy(() => import('./pages/HomePage'))
const CreateQuizPage = lazy(() => import('./pages/CreateQuizPage'))
const LobbyPage = lazy(() => import('./pages/LobbyPage'))
const HostPage = lazy(() => import('./pages/HostPage'))
const PlayPage = lazy(() => import('./pages/PlayPage'))
const ResultsPage = lazy(() => import('./pages/ResultsPage'))

function RouteFallback() {
  return <div className="route-fallback" role="status" aria-live="polite" />
}

export default function App() {
  return (
    <LocaleProvider>
      <GameProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || undefined}>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/create" element={<CreateQuizPage />} />
              <Route path="/lobby" element={<LobbyPage />} />
              <Route path="/host" element={<HostPage />} />
              <Route path="/play" element={<PlayPage />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </GameProvider>
    </LocaleProvider>
  )
}
