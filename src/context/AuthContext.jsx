import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth'
import { auth, hasFirebase } from '../lib/firebase'
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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hasFirebase) {
      setUser(getLocalSession())
      setLoading(false)
      return undefined
    }

    getRedirectResult(auth).catch(() => {})

    const unsub = onAuthStateChanged(auth, (next) => {
      setUser(mapFirebaseUser(next) || getLocalSession())
      setLoading(false)
    })
    return unsub
  }, [])

  const signUp = useCallback(async ({ email, password, displayName }) => {
    if (hasFirebase) {
      try {
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
    if (hasFirebase) await firebaseSignOut(auth)
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
