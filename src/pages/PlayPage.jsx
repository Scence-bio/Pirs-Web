import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useLocale } from '../i18n/LocaleContext'
import { useGame } from '../context/GameContext'
import { localize, toEasternDigits } from '../utils/format'
import { playCorrect, playQuestionStart, playWrong, unlockAudio } from '../lib/sound'
import AnswerGrid from '../components/AnswerGrid'
import TimerRing from '../components/TimerRing'
import Leaderboard from '../components/Leaderboard'

export default function PlayPage() {
  const { t, locale } = useLocale()
  const { session, room, me, myAnswer, submitAnswer } = useGame()
  const navigate = useNavigate()
  const [feedback, setFeedback] = useState(null)
  const [timeUp, setTimeUp] = useState(false)
  const lastStartRef = useRef(null)
  const feedbackSoundRef = useRef(null)

  useEffect(() => {
    if (!room) return
    if (room.status === 'lobby') navigate('/lobby', { replace: true })
    if (room.status === 'finished') navigate('/results', { replace: true })
  }, [room, navigate])

  // Reset per question only (not when status flips to reveal)
  useEffect(() => {
    setFeedback(null)
    setTimeUp(false)
    feedbackSoundRef.current = null
  }, [room?.questionIndex, room?.questionStartedAt])

  useEffect(() => {
    if (!room || room.status !== 'question' || !room.questionStartedAt) return
    if (lastStartRef.current === room.questionStartedAt) return
    lastStartRef.current = room.questionStartedAt
    if (room.soundEnabled !== false) {
      unlockAudio().then(() => playQuestionStart())
    }
  }, [room?.status, room?.questionStartedAt, room?.soundEnabled])

  useEffect(() => {
    if (room?.status !== 'reveal') return
    if (!myAnswer) {
      setFeedback('timesUp')
      return
    }
    const q = room.quiz.questions[room.questionIndex]
    const kind = myAnswer.choice === q.correct ? 'correct' : 'wrong'
    setFeedback(kind)
    if (room.soundEnabled !== false && feedbackSoundRef.current !== room.questionIndex) {
      feedbackSoundRef.current = room.questionIndex
      if (kind === 'correct') playCorrect()
      else playWrong()
    }
  }, [room?.status, room?.questionIndex, room?.soundEnabled, room?.quiz, myAnswer])

  if (!session || session.role !== 'player' || !room) return <Navigate to="/" replace />

  const q = room.quiz.questions[room.questionIndex]
  const options = localize(q.options, locale)
  const text = localize(q.text, locale)
  const soundOn = room.soundEnabled !== false
  const canAnswer = room.status === 'question' && !myAnswer && !timeUp

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

      {canAnswer && (
        <div className="question-stage player-stage">
          <TimerRing
            startedAt={room.questionStartedAt}
            timeLimit={room.quiz.timeLimit}
            sound={soundOn}
            onExpire={() => setTimeUp(true)}
          />
          <p className="pick-hint">{t.pickAnswer}</p>
          <h2 className="question-text sm">{text}</h2>
          <AnswerGrid
            options={options}
            selected={null}
            onSelect={(i) => {
              if (timeUp) return
              unlockAudio()
              submitAnswer(i)
            }}
          />
        </div>
      )}

      {room.status === 'question' && (myAnswer || timeUp) && (
        <div className="wait-stage">
          <div className="wait-blob" />
          <p>{timeUp && !myAnswer ? t.timesUp : t.waitingReveal}</p>
        </div>
      )}

      {room.status === 'reveal' && (
        <div className={`reveal-stage ${feedback === 'correct' ? 'correct' : feedback === 'wrong' ? 'wrong' : ''}`}>
          <h2>
            {feedback === 'correct'
              ? t.correct
              : feedback === 'wrong'
                ? t.wrong
                : t.timesUp}
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
