import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLocale } from '../i18n/LocaleContext'
import { useGame } from '../context/GameContext'
import { QUIZZES } from '../data/quizzes'
import { deleteCustomQuiz, loadCustomQuizzes } from '../data/customQuizzes'
import { localize, toEasternDigits } from '../utils/format'
import LangSwitch from '../components/LangSwitch'

export default function HomePage() {
  const { t, locale } = useLocale()
  const { hostGame, joinGame } = useGame()
  const navigate = useNavigate()
  const [mode, setMode] = useState(null)
  const [pin, setPin] = useState('')
  const [name, setName] = useState(() => localStorage.getItem('pirs-nick') || '')
  const [error, setError] = useState('')
  const [customTick, setCustomTick] = useState(0)

  const customQuizzes = useMemo(() => loadCustomQuizzes(), [customTick])

  function onHost(quizId) {
    const gamePin = hostGame(quizId)
    if (gamePin) navigate('/lobby')
  }

  function onDelete(e, id) {
    e.stopPropagation()
    deleteCustomQuiz(id)
    setCustomTick((n) => n + 1)
  }

  function onJoin(e) {
    e.preventDefault()
    localStorage.setItem('pirs-nick', name.trim())
    const res = joinGame(pin, name)
    if (!res.ok) {
      const map = {
        not_found: t.errNotFound,
        started: t.errStarted,
        name: t.errName,
        taken: t.errTaken,
      }
      setError(map[res.error] || t.errNotFound)
      return
    }
    navigate('/lobby')
  }

  function renderQuizCard(quiz, { deletable } = {}) {
    return (
      <div key={quiz.id} className="quiz-card-wrap">
        <button type="button" className="quiz-card" onClick={() => onHost(quiz.id)}>
          <h3>{localize(quiz.title, locale)}</h3>
          <p>{localize(quiz.description, locale)}</p>
          <span className="quiz-meta">
            {toEasternDigits(quiz.questions.length, locale)} {t.questions} ·{' '}
            {toEasternDigits(quiz.timeLimit, locale)} {t.seconds}
          </span>
        </button>
        {deletable && (
          <button
            type="button"
            className="quiz-delete"
            onClick={(e) => onDelete(e, quiz.id)}
            aria-label={t.deleteQuiz}
          >
            {t.deleteQuiz}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="home-screen">
      <header className="home-top">
        <div className="brand-lockup">
          <span className="brand-mark">؟</span>
          <span className="brand-name">{t.brand}</span>
        </div>
        <LangSwitch />
      </header>

      <section className="home-hero">
        <h1 className="home-brand">{t.brand}</h1>
        <p className="home-tagline">{t.tagline}</p>
        <p className="home-support">{t.heroSupport}</p>

        {!mode && (
          <div className="home-cta">
            <button type="button" className="btn btn-host" onClick={() => setMode('host')}>
              {t.hostCta}
            </button>
            <Link to="/create" className="btn btn-create">
              {t.createCta}
            </Link>
            <button type="button" className="btn btn-join" onClick={() => setMode('join')}>
              {t.joinCta}
            </button>
          </div>
        )}
      </section>

      {mode === 'host' && (
        <section className="panel quiz-pick">
          <div className="panel-head">
            <h2>{t.pickQuiz}</h2>
            <button type="button" className="linkish" onClick={() => setMode(null)}>
              {t.backHome}
            </button>
          </div>

          <Link to="/create" className="btn btn-create create-inline">
            + {t.createCta}
          </Link>

          {customQuizzes.length > 0 && (
            <>
              <h3 className="quiz-section-title">{t.myQuizzes}</h3>
              <div className="quiz-grid">
                {customQuizzes.map((quiz) => renderQuizCard(quiz, { deletable: true }))}
              </div>
            </>
          )}

          <h3 className="quiz-section-title">{t.readyQuizzes}</h3>
          <div className="quiz-grid">{QUIZZES.map((quiz) => renderQuizCard(quiz))}</div>
        </section>
      )}

      {mode === 'join' && (
        <section className="panel join-panel">
          <div className="panel-head">
            <h2>{t.joinCta}</h2>
            <button type="button" className="linkish" onClick={() => setMode(null)}>
              {t.backHome}
            </button>
          </div>
          <form className="join-form" onSubmit={onJoin}>
            <label>
              {t.enterPin}
              <input
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, '').slice(0, 6))
                  setError('')
                }}
                placeholder={t.pinPlaceholder}
                autoFocus
              />
            </label>
            <label>
              {t.nickname}
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError('')
                }}
                placeholder={t.nicknamePlaceholder}
                maxLength={16}
              />
            </label>
            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="btn btn-join" disabled={pin.length < 6}>
              {t.join}
            </button>
          </form>
        </section>
      )}
    </div>
  )
}
