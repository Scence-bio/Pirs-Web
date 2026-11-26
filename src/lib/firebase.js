/** Firebase is loaded on demand — keeps first paint free of the ~350KB SDK. */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const hasFirebase = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
)

let boot = null

export function getFirebase() {
  if (!hasFirebase) return Promise.resolve({ app: null, auth: null, db: null })
  if (boot) return boot
  boot = Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
    import('firebase/firestore'),
  ]).then(([{ initializeApp }, { getAuth }, { getFirestore }]) => {
    const app = initializeApp(firebaseConfig)
    return { app, auth: getAuth(app), db: getFirestore(app) }
  })
  return boot
}

/** Warm the SDK in the background without blocking UI. */
export function prefetchFirebase() {
  if (!hasFirebase || typeof window === 'undefined') return
  const run = () => {
    getFirebase().catch(() => {})
  }
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 2500 })
  else window.setTimeout(run, 1200)
}
