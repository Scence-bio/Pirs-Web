import { useLocale } from '../i18n/LocaleContext'

const SHORT = { ckb: 'ک', ar: 'ع', en: 'EN' }

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
          aria-label={l.label}
          title={l.label}
        >
          <span className="lang-full">{l.label}</span>
          <span className="lang-short" aria-hidden="true">
            {SHORT[l.code] || l.code}
          </span>
        </button>
      ))}
    </div>
  )
}
