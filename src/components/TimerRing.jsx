import { useEffect, useRef, useState } from 'react'
import { toEasternDigits } from '../utils/format'
import { useLocale } from '../i18n/LocaleContext'

export default function TimerRing({ startedAt, timeLimit, onExpire }) {
  const { locale } = useLocale()
  const [seconds, setSeconds] = useState(timeLimit)
  const expiredRef = useRef(false)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  useEffect(() => {
    expiredRef.current = false
    if (!startedAt) {
      setSeconds(timeLimit)
      return undefined
    }

    let raf = 0
    const tick = () => {
      const elapsed = (Date.now() - startedAt) / 1000
      const remain = Math.max(0, timeLimit - elapsed)
      const whole = Math.ceil(remain)
      setSeconds((prev) => (prev === whole ? prev : whole))

      if (remain <= 0) {
        if (!expiredRef.current) {
          expiredRef.current = true
          onExpireRef.current?.()
        }
        return
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [startedAt, timeLimit])

  const pct = Math.max(0, Math.min(100, (seconds / timeLimit) * 100))
  const urgent = seconds <= 5

  return (
    <div
      className={`timer-ring ${urgent ? 'urgent' : ''}`}
      style={{ '--pct': `${pct}%` }}
      aria-live="polite"
      aria-atomic="true"
    >
      <span>{toEasternDigits(seconds, locale)}</span>
    </div>
  )
}
