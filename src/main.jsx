import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { prefetchFirebase } from './lib/firebase'

function idle(fn, timeout = 2000) {
  if (typeof window === 'undefined') return
  if ('requestIdleCallback' in window) window.requestIdleCallback(fn, { timeout })
  else window.setTimeout(fn, Math.min(timeout, 400))
}

/** Android Chrome: keep join/auth forms above the soft keyboard */
function trackKeyboardInset() {
  const root = document.documentElement
  const vv = window.visualViewport
  if (!vv) {
    root.style.setProperty('--kb-inset', '0px')
    return
  }
  const sync = () => {
    const inset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))
    root.style.setProperty('--kb-inset', `${inset}px`)
    root.classList.toggle('kb-open', inset > 80)
  }
  vv.addEventListener('resize', sync, { passive: true })
  vv.addEventListener('scroll', sync, { passive: true })
  window.addEventListener('orientationchange', () => window.setTimeout(sync, 250), {
    passive: true,
  })
  sync()
}

// Paint first, then fonts / SW / Firebase warm-up
idle(() => {
  import('@fontsource-variable/vazirmatn/wght.css')
  import('@fontsource-variable/bricolage-grotesque/wght.css')
})

idle(() => {
  import('virtual:pwa-register')
    .then(({ registerSW }) => registerSW({ immediate: true }))
    .catch(() => {})
}, 3000)

idle(() => prefetchFirebase(), 1500)
trackKeyboardInset()

const root = document.getElementById('root')
root.replaceChildren()
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
