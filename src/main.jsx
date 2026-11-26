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

const root = document.getElementById('root')
root.replaceChildren()
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
