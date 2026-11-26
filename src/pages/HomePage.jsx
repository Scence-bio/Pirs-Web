import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLocale } from '../i18n/LocaleContext'
import { useAuth } from '../context/AuthContext'
import { useGame } from '../context/GameContext'
import { QUIZZES } from '../data/quizzes'
import { listUserQuizzes, removeUserQuiz } from '../lib/quizStore'
import { localize, toEasternDigits } from '../utils/format'
import LangSwitch from '../components/LangSwitch'

export default function HomePage() {
  const { t, locale } = useLocale()
  const { user, signOut, cloudEnabled } = useAuth()
  const { hostGame, joinGame } = useGame()
  const navigate = useNavigate()
  const [mode, setMode] = useState(null)
  const [pin, setPin] = useState('')
  const [name, setName] = useState(() => localStorage.getItem('pirs-nick') || '')
  const [error, setError] = useState('')
  const [myQuizzes, setMyQuizzes] = useState([])
  const [loadingQuizzes, setLoadingQuizzes] = useState(false)

  const refreshQuizzes = useCallback(async () => {
    if (!user) {
      setMyQuizzes([])
      return
    }
    setLoadingQuizzes(true)
    try {
      setMyQuizzes(await listUserQuizzes(user))
    } catch (err) {
      console.warn(err)
    } finally {
      setLoadingQuizzes(false)
    }
  }, [user])

  useEffect(() => {
    refreshQuizzes()
  }, [refreshQuizzes])

  useEffect(() => {
    if (user && new URLSearchParams(window.location.search).get('host') === '1') {
      setMode('host')
    }
  }, [user])

  useEffect(() => {
    if (user?.displayName && !localStorage.getItem('pirs-nick')) {
      setName(user.displayName)
    }
  }, [user])

  async function onHost(quizId) {
    const gamePin = await hostGame(quizId)
    if (gamePin) navigate('/lobby')
  }

  async function onDelete(e, id) {
    e.stopPropagation()
    if (!user) return
    await removeUserQuiz(user, id)
    refreshQuizzes()
  }

  async function onJoin(e) {
    e.preventDefault()
    localStorage.setItem('pirs-nick', name.trim())
    const res = await joinGame(pin, name)
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

  function requireAuth(path) {
    if (!user) {
      navigate(`/auth?next=${encodeURIComponent(path)}`)
      return false
    }
    return true
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
        <div className="home-header-actions">
          <LangSwitch />
          {user ? (
            <div className="account-chip">
              <span title={user.email}>{user.displayName}</span>
              <button type="button" className="linkish" onClick={() => signOut()}>
                {t.signOut}
              </button>
            </div>
          ) : (
            <Link to="/auth" className="btn btn-join btn-sm">
              {t.signIn}
            </Link>
          )}
        </div>
      </header>

      <section className="home-hero">
        <h1 className="home-brand">{t.brand}</h1>
        <p className="home-tagline">{t.tagline}</p>
        <p className="home-support">{t.heroSupport}</p>
        <p className="persist-note">
          {user
            ? cloudEnabled
              ? t.persistCloudOn
              : t.persistLocalOn
            : t.persistNeedAccount}
        </p>

        {!mode && (
          <div className="home-cta">
            <button
              type="button"
              className="btn btn-host"
              onClick={() => {
                if (!requireAuth('/?host=1')) return
                setMode('host')
              }}
            >
              {t.hostCta}
            </button>
            <button
              type="button"
              className="btn btn-create"
              onClick={() => {
                if (!requireAuth('/create')) return
                navigate('/create')
              }}
            >
              {t.createCta}
            </button>
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

          <button
            type="button"
            className="btn btn-create create-inline"
            onClick={() => navigate('/create')}
          >
            + {t.createCta}
          </button>

          <h3 className="quiz-section-title">{t.myQuizzes}</h3>
          {loadingQuizzes ? (
            <p className="muted">{t.loading}</p>
          ) : myQuizzes.length > 0 ? (
            <div className="quiz-grid">
              {myQuizzes.map((quiz) => renderQuizCard(quiz, { deletable: true }))}
            </div>
          ) : (
            <p className="muted">{t.noMyQuizzes}</p>
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
