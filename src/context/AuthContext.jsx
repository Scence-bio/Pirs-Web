import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getFirebase, hasFirebase } from '../lib/firebase'
import {
  getLocalSession,
  localSignIn,
  localSignOut,
  localSignUp,
} from '../lib/localAuth'

const AuthContext = createContext(null)

function mapFirebaseUser(u) {
  if (!u) return null
  return {
    id: u.uid,
    email: u.email,
    displayName: u.displayName || u.email?.split('@')[0] || 'User',
    provider: 'firebase',
  }
}

function needsAuthSoon() {
  if (typeof window === 'undefined') return false
  const path = window.location.pathname
  return /\/(auth|create|lobby|host|play|results)(\/|$)/.test(path)
}

function whenIdle(fn, timeout = 2200) {
  if (typeof window === 'undefined') return () => {}
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(fn, { timeout })
    return () => window.cancelIdleCallback?.(id)
  }
  const id = window.setTimeout(fn, Math.min(timeout, 500))
  return () => window.clearTimeout(id)
}

export function AuthProvider({ children }) {
  // Local session paints instantly; Firebase hydrates after first paint
  const [user, setUser] = useState(() => getLocalSession())
  const [loading, setLoading] = useState(() => hasFirebase && needsAuthSoon())

  useEffect(() => {
    if (!hasFirebase) {
      setLoading(false)
      return undefined
    }

    let unsub = () => {}
    let alive = true
    let cancelIdle = () => {}

    const hydrate = async () => {
      try {
        const { auth } = await getFirebase()
        const { getRedirectResult, onAuthStateChanged } = await import('firebase/auth')
        if (!alive) return
        getRedirectResult(auth).catch(() => {})
        unsub = onAuthStateChanged(auth, (next) => {
          if (!alive) return
          setUser(mapFirebaseUser(next) || getLocalSession())
          setLoading(false)
        })
      } catch {
        if (alive) {
          setUser(getLocalSession())
          setLoading(false)
        }
      }
    }

    if (needsAuthSoon()) {
      hydrate()
    } else {
      // Home / join: paint first; warm auth when the browser is idle
      setLoading(false)
      cancelIdle = whenIdle(() => {
        if (alive) hydrate()
      }, 2500)
    }

    return () => {
      alive = false
      cancelIdle()
      unsub()
    }
  }, [])

  const signUp = useCallback(async ({ email, password, displayName }) => {
    if (hasFirebase) {
      try {
        const { auth } = await getFirebase()
        const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth')
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
        const name = (displayName || email.split('@')[0]).trim().slice(0, 32)
        if (name) await updateProfile(cred.user, { displayName: name })
        setUser(mapFirebaseUser({ ...cred.user, displayName: name }))
        return { ok: true }
      } catch (err) {
        if (err.code === 'auth/email-already-in-use') return { ok: false, error: 'exists' }
        if (err.code === 'auth/weak-password' || err.code === 'auth/invalid-email') {
          return { ok: false, error: 'invalid' }
        }
        return { ok: false, error: err.message || 'failed' }
      }
    }
    const res = await localSignUp({ email, password, displayName })
    if (res.ok && res.user) setUser(res.user)
    return res
  }, [])

  const signIn = useCallback(async ({ email, password }) => {
    if (hasFirebase) {
      try {
        const { auth } = await getFirebase()
        const { signInWithEmailAndPassword } = await import('firebase/auth')
        await signInWithEmailAndPassword(auth, email.trim(), password)
        return { ok: true }
      } catch {
        return { ok: false, error: 'invalid_creds' }
      }
    }
    const res = await localSignIn({ email, password })
    if (res.ok) setUser(res.user)
    return res
  }, [])

  const signInWithGoogle = useCallback(async () => {
    if (!hasFirebase) return { ok: false, error: 'no_cloud' }
    const { auth } = await getFirebase()
    const { GoogleAuthProvider, signInWithPopup, signInWithRedirect } = await import('firebase/auth')
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    try {
      await signInWithPopup(auth, provider)
      return { ok: true }
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return { ok: false, error: 'cancelled' }
      }
      if (
        err.code === 'auth/popup-blocked' ||
        err.code === 'auth/operation-not-supported-in-this-environment'
      ) {
        try {
          await signInWithRedirect(auth, provider)
          return { ok: true, redirecting: true }
        } catch (redirectErr) {
          return { ok: false, error: redirectErr.message || 'failed' }
        }
      }
      return { ok: false, error: err.message || 'failed' }
    }
  }, [])

  const signOut = useCallback(async () => {
    if (hasFirebase) {
      try {
        const { auth } = await getFirebase()
        const { signOut: firebaseSignOut } = await import('firebase/auth')
        await firebaseSignOut(auth)
      } catch {
        /* ignore */
      }
    }
    localSignOut()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isConfigured: hasFirebase,
      cloudEnabled: hasFirebase,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
    }),
    [user, loading, signUp, signIn, signInWithGoogle, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
