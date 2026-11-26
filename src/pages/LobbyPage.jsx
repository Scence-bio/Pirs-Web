import { useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useLocale } from '../i18n/LocaleContext'
import { useGame } from '../context/GameContext'
import { localize, toEasternDigits } from '../utils/format'
import LangSwitch from '../components/LangSwitch'

export default function LobbyPage() {
  const { t, locale } = useLocale()
  const { session, room, startQuestion, leaveGame } = useGame()
  const navigate = useNavigate()

  useEffect(() => {
    if (!room) return
    if (room.status === 'question' || room.status === 'reveal' || room.status === 'leaderboard') {
      navigate(session?.role === 'host' ? '/host' : '/play', { replace: true })
    }
    if (room.status === 'finished') {
      navigate('/results', { replace: true })
    }
  }, [room, session, navigate])

  if (!session || !room) return <Navigate to="/" replace />

  const isHost = session.role === 'host'
  const title = localize(room.quiz.title, locale)

  return (
    <div className="lobby-screen">
      <header className="game-top">
        <button
          type="button"
          className="linkish"
          onClick={() => {
            leaveGame()
            navigate('/')
          }}
        >
          {t.leave}
        </button>
        <LangSwitch />
      </header>

      <div className="lobby-main">
        <p className="eyebrow">{t.lobbyTitle}</p>
        <h1>{title}</h1>

        <div className="pin-board">
          <span>{t.gamePin}</span>
          <strong className="pin-digits">{toEasternDigits(room.pin, locale)}</strong>
        </div>

        <div className="players-board">
          <h2>
            {t.players} ({toEasternDigits(room.players.length, locale)})
          </h2>
          {room.players.length === 0 ? (
            <p className="muted">{isHost ? t.waitingPlayers : t.youAreIn}</p>
          ) : (
            <ul className="player-chips">
              {room.players.map((p) => (
                <li key={p.id} className={p.id === session.playerId ? 'me' : ''}>
                  {p.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {isHost ? (
          <button
            type="button"
            className="btn btn-host"
            disabled={room.players.length < 1}
            onClick={() => {
              startQuestion()
              navigate('/host')
            }}
          >
            {room.players.length < 1 ? t.needPlayers : t.startGame}
          </button>
        ) : (
          <p className="waiting-pulse">{t.youAreIn}</p>
        )}
      </div>
    </div>
  )
}
