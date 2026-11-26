import { useCallback, useEffect, useRef } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useLocale } from '../i18n/LocaleContext'
import { useGame } from '../context/GameContext'
import { localize, toEasternDigits } from '../utils/format'
import { playQuestionStart, unlockAudio } from '../lib/sound'
import AnswerGrid from '../components/AnswerGrid'
import TimerRing from '../components/TimerRing'
import Leaderboard from '../components/Leaderboard'

export default function HostPage() {
  const { t, locale } = useLocale()
  const {
    session,
    room,
    answerCount,
    revealAnswers,
    showLeaderboard,
    nextQuestion,
    setSoundEnabled,
  } = useGame()
  const navigate = useNavigate()
  const lastStartRef = useRef(null)

  useEffect(() => {
    if (!room) return
    if (room.status === 'lobby') navigate('/lobby', { replace: true })
    if (room.status === 'finished') navigate('/results', { replace: true })
  }, [room, navigate])

  useEffect(() => {
    if (!room || room.status !== 'question' || !room.questionStartedAt) return
    if (lastStartRef.current === room.questionStartedAt) return
    lastStartRef.current = room.questionStartedAt
    if (room.soundEnabled !== false) {
      unlockAudio().then(() => playQuestionStart())
    }
  }, [room?.status, room?.questionStartedAt, room?.soundEnabled])

  const onExpire = useCallback(() => {
    // Always attempt reveal on timer end; updater no-ops if already revealed
    revealAnswers()
  }, [revealAnswers])

  if (!session || session.role !== 'host' || !room) return <Navigate to="/" replace />

  const q = room.quiz.questions[room.questionIndex]
  const options = localize(q.options, locale)
  const text = localize(q.text, locale)
  const total = room.quiz.questions.length
  const qi = room.questionIndex
  const isLast = qi >= total - 1
  const soundOn = room.soundEnabled !== false

  return (
    <div className="host-screen">
      <header className="game-bar">
        <span className="pin-mini">
          {t.gamePin} {toEasternDigits(room.pin, locale)}
        </span>
        <span>
          {t.questionOf} {toEasternDigits(qi + 1, locale)} {t.of}{' '}
          {toEasternDigits(total, locale)}
        </span>
        <span>
          {toEasternDigits(answerCount, locale)}/{toEasternDigits(room.players.length, locale)}{' '}
          {t.answered}
        </span>
        <button
          type="button"
          className={`sound-chip compact ${soundOn ? 'on' : 'off'}`}
          onClick={() => {
            unlockAudio()
            setSoundEnabled(!soundOn)
          }}
          aria-pressed={soundOn}
          title={soundOn ? t.soundOn : t.soundOff}
          aria-label={soundOn ? t.soundOn : t.soundOff}
        >
          <span className="sound-glyph" aria-hidden="true">
            {soundOn ? '♪' : '✕'}
          </span>
        </button>
      </header>

      {(room.status === 'question' || room.status === 'reveal') && (
        <div className="question-stage">
          {room.status === 'question' && (
            <TimerRing
              startedAt={room.questionStartedAt}
              timeLimit={room.quiz.timeLimit}
              onExpire={onExpire}
              sound={soundOn}
            />
          )}
          <h1 className="question-text">{text}</h1>
          <AnswerGrid
            options={options}
            correct={q.correct}
            reveal={room.status === 'reveal'}
            disabled
            big
          />
          <div className="host-actions">
            {room.status === 'question' && (
              <button type="button" className="btn btn-host" onClick={revealAnswers}>
                {t.reveal}
              </button>
            )}
            {room.status === 'reveal' && (
              <button type="button" className="btn btn-join" onClick={showLeaderboard}>
                {t.leaderboard}
              </button>
            )}
          </div>
        </div>
      )}

      {room.status === 'leaderboard' && (
        <div className="question-stage">
          <Leaderboard players={room.players} title={t.leaderboard} />
          <div className="host-actions">
            <button
              type="button"
              className="btn btn-host"
              onClick={() => {
                unlockAudio()
                nextQuestion()
                if (isLast) navigate('/results')
              }}
            >
              {isLast ? t.finish : t.next}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
