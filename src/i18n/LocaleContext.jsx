import { createContext, useContext, useEffect, useState } from 'react'
import { locales, translations } from './translations'

const LocaleContext = createContext(null)
const STORAGE_KEY = 'pirs-locale'

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return locales.some((l) => l.code === saved) ? saved : 'ckb'
  })

  const meta = locales.find((l) => l.code === locale) ?? locales[0]
  const t = translations[locale] ?? translations.ckb

  useEffect(() => {
    document.documentElement.lang = locale === 'ckb' ? 'ckb' : locale
    document.documentElement.dir = meta.dir
    localStorage.setItem(STORAGE_KEY, locale)
  }, [locale, meta.dir])

  function setLocale(code) {
    if (locales.some((l) => l.code === code)) setLocaleState(code)
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, dir: meta.dir, locales }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
