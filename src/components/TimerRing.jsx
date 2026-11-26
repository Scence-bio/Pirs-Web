import { useEffect, useState } from 'react'
import { toEasternDigits } from '../utils/format'
import { useLocale } from '../i18n/LocaleContext'

export default function TimerRing({ startedAt, timeLimit, onExpire }) {
  const { locale } = useLocale()
  const [left, setLeft] = useState(timeLimit)

  useEffect(() => {
    if (!startedAt) return undefined
    let expired = false
    const tick = () => {
      const elapsed = (Date.now() - startedAt) / 1000
      const remain = Math.max(0, timeLimit - elapsed)
      setLeft(remain)
      if (remain <= 0 && !expired) {
        expired = true
        onExpire?.()
      }
    }
    tick()
    const id = setInterval(tick, 100)
    return () => clearInterval(id)
  }, [startedAt, timeLimit, onExpire])

  const pct = Math.max(0, Math.min(100, (left / timeLimit) * 100))
  const urgent = left <= 5

  return (
    <div className={`timer-ring ${urgent ? 'urgent' : ''}`} style={{ '--pct': `${pct}%` }}>
      <span>{toEasternDigits(Math.ceil(left), locale)}</span>
    </div>
  )
}
