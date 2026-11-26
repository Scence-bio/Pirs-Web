import { Navigate, useNavigate } from 'react-router-dom'
import { useLocale } from '../i18n/LocaleContext'
import { useGame } from '../context/GameContext'
import { localize } from '../utils/format'
import Leaderboard from '../components/Leaderboard'
import LangSwitch from '../components/LangSwitch'

export default function ResultsPage() {
  const { t, locale } = useLocale()
  const { session, room, leaveGame } = useGame()
  const navigate = useNavigate()

  if (!session || !room) return <Navigate to="/" replace />

  return (
    <div className="results-screen">
      <header className="game-top">
        <span className="brand-name">{t.brand}</span>
        <LangSwitch />
      </header>
      <div className="results-main">
        <p className="eyebrow">{localize(room.quiz.title, locale)}</p>
        <h1>{t.finalTitle}</h1>
        <Leaderboard players={room.players} />
        <button
          type="button"
          className="btn btn-host"
          onClick={() => {
            leaveGame()
            navigate('/')
          }}
        >
          {t.playAgain}
        </button>
      </div>
    </div>
  )
}
