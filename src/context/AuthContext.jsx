import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { hasSupabase, supabase } from '../lib/supabase'
import {
  getLocalSession,
  localSignIn,
  localSignOut,
  localSignUp,
} from '../lib/localAuth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true

    async function boot() {
      if (hasSupabase) {
        const { data } = await supabase.auth.getSession()
        if (!alive) return
        const session = data.session
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            displayName:
              session.user.user_metadata?.display_name ||
              session.user.email?.split('@')[0] ||
              'User',
            provider: 'supabase',
          })
        } else {
          setUser(getLocalSession())
        }
        setLoading(false)
        const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
          if (!alive) return
          if (next?.user) {
            setUser({
              id: next.user.id,
              email: next.user.email,
              displayName:
                next.user.user_metadata?.display_name ||
                next.user.email?.split('@')[0] ||
                'User',
              provider: 'supabase',
            })
          } else {
            setUser(getLocalSession())
          }
        })
        return () => sub.subscription.unsubscribe()
      }

      setUser(getLocalSession())
      setLoading(false)
      return undefined
    }

    const cleanupPromise = boot()
    return () => {
      alive = false
      Promise.resolve(cleanupPromise).then((fn) => fn?.())
    }
  }, [])

  const signUp = useCallback(async ({ email, password, displayName }) => {
    if (hasSupabase) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { display_name: displayName?.trim() || '' } },
      })
      if (error) return { ok: false, error: error.message }
      if (data.user && !data.session) {
        // email confirmation may be required
        return { ok: true, needsConfirm: true }
      }
      return { ok: true }
    }
    const res = await localSignUp({ email, password, displayName })
    if (res.ok && res.user) setUser(res.user)
    return res
  }, [])

  const signIn = useCallback(async ({ email, password }) => {
    if (hasSupabase) {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) return { ok: false, error: 'invalid_creds' }
      return { ok: true }
    }
    const res = await localSignIn({ email, password })
    if (res.ok) setUser(res.user)
    return res
  }, [])

  const signOut = useCallback(async () => {
    if (hasSupabase) await supabase.auth.signOut()
    localSignOut()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isConfigured: hasSupabase,
      cloudEnabled: hasSupabase,
      signUp,
      signIn,
      signOut,
    }),
    [user, loading, signUp, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
