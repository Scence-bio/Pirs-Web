import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // Local: `/`. GitHub Pages / CI / explicit deploy: `/Pirs-Web/`
  base:
    process.env.GITHUB_PAGES === '1' || process.env.CI === 'true'
      ? '/Pirs-Web/'
      : '/',
  plugins: [react()],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    modulePreload: { polyfill: false },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-router')) return 'router'
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'react'
          }
          if (id.includes('@fontsource-variable')) return 'fonts'
        },
      },
    },
  },
})
