import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useLocale } from '../i18n/LocaleContext'
import { useGame } from '../context/GameContext'
import { localize, toEasternDigits } from '../utils/format'
import AnswerGrid from '../components/AnswerGrid'
import TimerRing from '../components/TimerRing'
import Leaderboard from '../components/Leaderboard'

export default function PlayPage() {
  const { t, locale } = useLocale()
  const { session, room, me, myAnswer, submitAnswer } = useGame()
  const navigate = useNavigate()
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    if (!room) return
    if (room.status === 'lobby') navigate('/lobby', { replace: true })
    if (room.status === 'finished') navigate('/results', { replace: true })
  }, [room, navigate])

  useEffect(() => {
    setFeedback(null)
  }, [room?.questionIndex, room?.status])

  useEffect(() => {
    if (room?.status !== 'reveal' || !myAnswer) return
    const q = room.quiz.questions[room.questionIndex]
    setFeedback(myAnswer.choice === q.correct ? 'correct' : 'wrong')
  }, [room, myAnswer])

  if (!session || session.role !== 'player' || !room) return <Navigate to="/" replace />

  const q = room.quiz.questions[room.questionIndex]
  const options = localize(q.options, locale)
  const text = localize(q.text, locale)

  return (
    <div className="play-screen">
      <header className="game-bar">
        <span>{me?.name}</span>
        <span>
          {t.questionOf} {toEasternDigits(room.questionIndex + 1, locale)}
        </span>
        <span>
          {toEasternDigits(me?.score ?? 0, locale)} {t.points}
        </span>
      </header>

      {room.status === 'question' && !myAnswer && (
        <div className="question-stage player-stage">
          <TimerRing startedAt={room.questionStartedAt} timeLimit={room.quiz.timeLimit} />
          <p className="pick-hint">{t.pickAnswer}</p>
          <h2 className="question-text sm">{text}</h2>
          <AnswerGrid
            options={options}
            selected={null}
            onSelect={(i) => submitAnswer(i)}
          />
        </div>
      )}

      {room.status === 'question' && myAnswer && (
        <div className="wait-stage">
          <div className="wait-blob" />
          <p>{t.waitingReveal}</p>
        </div>
      )}

      {room.status === 'reveal' && (
        <div className={`reveal-stage ${feedback || ''}`}>
          <h2>
            {feedback === 'correct' ? t.correct : feedback === 'wrong' ? t.wrong : t.timesUp}
          </h2>
          <AnswerGrid
            options={options}
            selected={myAnswer?.choice ?? null}
            correct={q.correct}
            reveal
            disabled
          />
        </div>
      )}

      {room.status === 'leaderboard' && (
        <div className="question-stage">
          <Leaderboard players={room.players} title={t.leaderboard} />
        </div>
      )}
    </div>
  )
}
