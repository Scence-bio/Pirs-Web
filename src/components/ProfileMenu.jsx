import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../i18n/LocaleContext'

function initialOf(name) {
  const t = (name || '?').trim()
  return t.slice(0, 1).toUpperCase()
}

export default function ProfileMenu() {
  const { t } = useLocale()
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return undefined
    function onDoc(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!user) {
    return (
      <Link to="/auth" className="btn btn-join btn-sm profile-signin">
        {t.signIn}
      </Link>
    )
  }

  return (
    <div className="profile-menu" ref={rootRef}>
      <button
        type="button"
        className="profile-trigger"
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="profile-avatar" aria-hidden="true">
          {initialOf(user.displayName || user.email)}
        </span>
        <span className="profile-trigger-label">{t.myProfile}</span>
      </button>

      {open && (
        <div className="profile-dropdown" id={menuId} role="menu">
          <div className="profile-dropdown-head">
            <span className="profile-avatar lg" aria-hidden="true">
              {initialOf(user.displayName || user.email)}
            </span>
            <div>
              <strong>{user.displayName}</strong>
              {user.email && <p dir="ltr">{user.email}</p>}
            </div>
          </div>
          <button
            type="button"
            role="menuitem"
            className="profile-signout"
            onClick={() => {
              setOpen(false)
              signOut()
            }}
          >
            {t.signOut}
          </button>
        </div>
      )}
    </div>
  )
}
