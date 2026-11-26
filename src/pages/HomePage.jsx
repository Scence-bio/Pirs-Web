import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocale } from '../i18n/LocaleContext'
import { useAuth } from '../context/AuthContext'
import { useGame } from '../context/GameContext'
import { QUIZZES } from '../data/quizzes'
import { listUserQuizzes, removeUserQuiz } from '../lib/quizStore'
import { localize, normalizeDigits, toEasternDigits } from '../utils/format'
import LangSwitch from '../components/LangSwitch'
import ProfileMenu from '../components/ProfileMenu'

export default function HomePage() {
  const { t, locale } = useLocale()
  const { user } = useAuth()
  const { joinGame, hostGame, session } = useGame()
  const navigate = useNavigate()
  const [mode, setMode] = useState(null)
  const [pin, setPin] = useState('')
  const [name, setName] = useState(() => localStorage.getItem('pirs-nick') || '')
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)
  const [myQuizzes, setMyQuizzes] = useState([])
  const [loadingQuizzes, setLoadingQuizzes] = useState(false)
  const pinRef = useRef(null)
  const nameRef = useRef(null)
  const joinLock = useRef(false)

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
    if (user?.displayName && !localStorage.getItem('pirs-nick')) {
      setName(user.displayName)
    }
  }, [user])

  const clearPinFromUrl = useCallback(() => {
    const url = new URL(window.location.href)
    if (!url.searchParams.has('pin')) return
    url.searchParams.delete('pin')
    const q = url.searchParams.toString()
    window.history.replaceState({}, '', url.pathname + (q ? `?${q}` : '') + url.hash)
  }, [])

  const attemptJoin = useCallback(
    async (pinValue, nameValue) => {
      const cleanPin = normalizeDigits(pinValue)
      const trimmed = String(nameValue || '').trim().slice(0, 16)
      if (cleanPin.length < 6 || !trimmed || joinLock.current) return false

      // Already seated in this room — just open lobby
      if (session?.role === 'player' && session.pin === cleanPin) {
        clearPinFromUrl()
        navigate('/lobby')
        return true
      }

      joinLock.current = true
      setJoining(true)
      setError('')
      localStorage.setItem('pirs-nick', trimmed)
      try {
        const res = await joinGame(cleanPin, trimmed)
        if (!res.ok) {
          const map = {
            not_found: t.errNotFound,
            started: t.errStarted,
            name: t.errName,
            taken: t.errTaken,
          }
          setError(map[res.error] || t.errNotFound)
          return false
        }
        clearPinFromUrl()
        navigate('/lobby')
        return true
      } finally {
        joinLock.current = false
        setJoining(false)
      }
    },
    [joinGame, navigate, t, clearPinFromUrl, session],
  )

  useEffect(() => {
    if (user && new URLSearchParams(window.location.search).get('host') === '1') {
      setMode('host')
    }
  }, [user])

  // Prefill from ?pin=; auto-join once when nickname is available
  useEffect(() => {
    const fromUrl = normalizeDigits(new URLSearchParams(window.location.search).get('pin') || '')
    if (!fromUrl) return
    setPin(fromUrl)
    setMode(null)

    if (session?.role === 'player' && session.pin === fromUrl) {
      clearPinFromUrl()
      navigate('/lobby')
      return
    }

    const nick = (localStorage.getItem('pirs-nick') || user?.displayName || '').trim()
    if (fromUrl.length === 6 && nick) {
      const guardKey = `pirs-deeplink:${fromUrl}:${nick.toLowerCase()}`
      if (sessionStorage.getItem(guardKey) === '1') return
      sessionStorage.setItem(guardKey, '1')
      setName(nick)
      attemptJoin(fromUrl, nick)
      return
    }
    requestAnimationFrame(() => {
      if (fromUrl.length === 6) nameRef.current?.focus()
      else pinRef.current?.focus()
    })
  }, [user?.displayName, attemptJoin, session, navigate, clearPinFromUrl])

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

  function onJoinSubmit(e) {
    e.preventDefault()
    attemptJoin(pin, name)
  }

  function onPinChange(raw) {
    const next = normalizeDigits(raw)
    setPin(next)
    setError('')
    if (next.length === 6) {
      const nick = name.trim()
      if (nick) {
        attemptJoin(next, nick)
      } else {
        requestAnimationFrame(() => nameRef.current?.focus())
      }
    }
  }

  function onPinPaste(e) {
    const text = e.clipboardData?.getData('text') || ''
    // Accept raw PIN or a full join URL containing ?pin=
    let digits = normalizeDigits(text)
    try {
      if (text.includes('pin=')) {
        const u = new URL(text.trim())
        digits = normalizeDigits(u.searchParams.get('pin') || digits)
      }
    } catch {
      /* plain text paste */
    }
    if (!digits) return
    e.preventDefault()
    onPinChange(digits)
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
          <ProfileMenu />
        </div>
      </header>

      {mode !== 'host' && (
        <section className="home-hero">
          <h1 className="home-brand">{t.brand}</h1>
          <p className="join-hint">{t.joinHint}</p>

          <form className="join-hero" onSubmit={onJoinSubmit}>
            <label className="join-pin-label" htmlFor="join-pin">
              {t.enterPin}
            </label>
            <input
              id="join-pin"
              ref={pinRef}
              className="join-pin-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              enterKeyHint="next"
              maxLength={6}
              value={pin}
              onChange={(e) => onPinChange(e.target.value)}
              onPaste={onPinPaste}
              placeholder={t.pinPlaceholder}
              aria-invalid={Boolean(error)}
              disabled={joining}
              autoFocus
            />

            <label className="join-name-label" htmlFor="join-name">
              {t.nickname}
            </label>
            <input
              id="join-name"
              ref={nameRef}
              className="join-name-input"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError('')
              }}
              placeholder={t.nicknamePlaceholder}
              maxLength={16}
              autoComplete="nickname"
              enterKeyHint="go"
              disabled={joining}
            />

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-join join-submit"
              disabled={joining || pin.length < 6 || !name.trim()}
            >
              {joining ? t.joining : t.join}
            </button>
          </form>

          <div className="home-cta home-cta-secondary" role="group" aria-label={t.orHost}>
            <p className="cta-divider">{t.orHost}</p>
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
          </div>
        </section>
      )}

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
    </div>
  )
}
