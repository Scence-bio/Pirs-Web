import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/vazirmatn/wght.css'
import './index.css'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'

// Display font is non-critical — load after first paint
import('@fontsource-variable/bricolage-grotesque/wght.css')

registerSW({ immediate: true })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
