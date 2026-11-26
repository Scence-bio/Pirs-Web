import { useLocale } from '../i18n/LocaleContext'
import { toEasternDigits } from '../utils/format'

export default function Leaderboard({ players, title }) {
  const { t, locale } = useLocale()
  const sorted = [...players].sort((a, b) => b.score - a.score)

  return (
    <div className="leaderboard">
      {title && <h2>{title}</h2>}
      <ol className="lb-list">
        {sorted.map((p, i) => (
          <li key={p.id} className={`lb-row rank-${i + 1}`}>
            <span className="lb-rank">{toEasternDigits(i + 1, locale)}</span>
            <span className="lb-name">{p.name}</span>
            <span className="lb-score">
              {toEasternDigits(p.score, locale)} {t.points}
            </span>
          </li>
        ))}
      </ol>
      {sorted.length === 0 && <p className="muted">{t.noPlayers}</p>}
    </div>
  )
}
