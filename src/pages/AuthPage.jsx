import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useLocale } from '../i18n/LocaleContext'
import { useAuth } from '../context/AuthContext'
import LangSwitch from '../components/LangSwitch'

export default function AuthPage() {
  const { t } = useLocale()
  const { user, loading, signIn, signUp, cloudEnabled } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') || '/'

  const [mode, setMode] = useState('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  if (!loading && user) return <Navigate to={next} replace />

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)
    try {
      if (mode === 'signup') {
        const res = await signUp({ email, password, displayName })
        if (!res.ok) {
          const map = {
            exists: t.errAccountExists,
            invalid: t.errAuthInvalid,
          }
          setError(map[res.error] || res.error || t.errAuthFailed)
          return
        }
        if (res.needsConfirm) {
          setInfo(t.authConfirmEmail)
          setMode('login')
          return
        }
        if (res.user || cloudEnabled) navigate(next)
        else navigate(next)
      } else {
        const res = await signIn({ email, password })
        if (!res.ok) {
          setError(t.errInvalidCreds)
          return
        }
        navigate(next)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-screen">
      <header className="home-top">
        <Link to="/" className="brand-lockup">
          <span className="brand-mark">؟</span>
          <span className="brand-name">{t.brand}</span>
        </Link>
        <LangSwitch />
      </header>

      <section className="panel auth-panel">
        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'signup' ? 'active' : ''}
            onClick={() => {
              setMode('signup')
              setError('')
              setInfo('')
            }}
          >
            {t.signUp}
          </button>
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => {
              setMode('login')
              setError('')
              setInfo('')
            }}
          >
            {t.signIn}
          </button>
        </div>

        <p className="auth-note">
          {cloudEnabled ? t.authCloudNote : t.authLocalNote}
        </p>

        <form className="join-form auth-form" onSubmit={onSubmit}>
          {mode === 'signup' && (
            <label>
              {t.displayName}
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t.displayNamePlaceholder}
                maxLength={32}
                autoComplete="nickname"
              />
            </label>
          )}
          <label>
            {t.email}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              dir="ltr"
            />
          </label>
          <label>
            {t.password}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.passwordPlaceholder}
              required
              minLength={6}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              dir="ltr"
            />
          </label>

          {error && <p className="form-error">{error}</p>}
          {info && <p className="form-info">{info}</p>}

          <button type="submit" className="btn btn-host" disabled={busy}>
            {busy ? '…' : mode === 'signup' ? t.signUp : t.signIn}
          </button>
        </form>

        <Link to="/" className="linkish" style={{ display: 'inline-block', marginTop: '1rem' }}>
          {t.backHome}
        </Link>
      </section>
    </div>
  )
}
