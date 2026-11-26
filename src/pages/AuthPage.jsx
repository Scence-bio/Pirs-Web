import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useLocale } from '../i18n/LocaleContext'
import { useAuth } from '../context/AuthContext'
import LangSwitch from '../components/LangSwitch'

function GoogleIcon() {
  return (
    <svg className="google-icon" viewBox="0 0 24 24" aria-hidden="true" width="20" height="20">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

export default function AuthPage() {
  const { t } = useLocale()
  const { user, loading, signIn, signUp, signInWithGoogle, cloudEnabled } = useAuth()
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

  async function onGoogle() {
    setError('')
    setInfo('')
    setBusy(true)
    try {
      const res = await signInWithGoogle()
      if (!res.ok) {
        if (res.error === 'cancelled') return
        setError(t.errGoogleAuth)
        return
      }
      navigate(next)
    } finally {
      setBusy(false)
    }
  }

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
        navigate(next)
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
          {cloudEnabled ? t.authFirebaseNote : t.authLocalNote}
        </p>

        {cloudEnabled && (
          <>
            <button
              type="button"
              className="btn btn-google"
              onClick={onGoogle}
              disabled={busy}
            >
              <GoogleIcon />
              <span>{t.signInWithGoogle}</span>
            </button>
            <div className="auth-divider" role="separator">
              <span>{t.authOrEmail}</span>
            </div>
          </>
        )}

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
