import { useLocale } from '../i18n/LocaleContext'

export default function LangSwitch() {
  const { locale, setLocale, locales } = useLocale()
  return (
    <div className="lang-switch" role="group" aria-label="Language">
      {locales.map((l) => (
        <button
          key={l.code}
          type="button"
          className={locale === l.code ? 'active' : ''}
          onClick={() => setLocale(l.code)}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
