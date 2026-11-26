import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useLocale } from '../i18n/LocaleContext'
import { useGame } from '../context/GameContext'
import { joinUrlForPin, localize, toEasternDigits } from '../utils/format'
import { unlockAudio } from '../lib/sound'
import LangSwitch from '../components/LangSwitch'

export default function LobbyPage() {
  const { t, locale } = useLocale()
  const { session, room, startQuestion, leaveGame, setSoundEnabled } = useGame()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [starting, setStarting] = useState(false)

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
  const soundOn = room.soundEnabled !== false

  async function copyJoinLink() {
    const url = joinUrlForPin(room.pin)
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt(t.copyJoinLink, url)
    }
  }

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
          {isHost && (
            <button type="button" className="btn btn-join copy-link-btn" onClick={copyJoinLink}>
              {copied ? t.linkCopied : t.copyJoinLink}
            </button>
          )}
        </div>

        {isHost && (
          <button
            type="button"
            className={`sound-chip ${soundOn ? 'on' : 'off'}`}
            onClick={() => {
              unlockAudio()
              setSoundEnabled(!soundOn)
            }}
            aria-pressed={soundOn}
          >
            <span className="sound-glyph" aria-hidden="true">
              {soundOn ? '♪' : '✕'}
            </span>
            {soundOn ? t.soundOn : t.soundOff}
          </button>
        )}

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
            disabled={room.players.length < 1 || starting}
            onClick={() => {
              if (starting) return
              setStarting(true)
              unlockAudio()
              Promise.resolve(startQuestion())
                .then(() => navigate('/host'))
                .finally(() => setStarting(false))
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
