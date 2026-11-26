export function localize(field, locale) {
  if (!field) return ''
  if (typeof field === 'string') return field
  if (Array.isArray(field)) return field
  return field[locale] || field.ckb || field.en || field.ar || ''
}

/** Convert Eastern/Persian digits and strip non-digits for PIN entry. */
export function normalizeDigits(value, maxLen = 6) {
  const map = {
    '٠': '0',
    '١': '1',
    '٢': '2',
    '٣': '3',
    '٤': '4',
    '٥': '5',
    '٦': '6',
    '٧': '7',
    '٨': '8',
    '٩': '9',
    '۰': '0',
    '۱': '1',
    '۲': '2',
    '۳': '3',
    '۴': '4',
    '۵': '5',
    '۶': '6',
    '۷': '7',
    '۸': '8',
    '۹': '9',
  }
  return String(value || '')
    .replace(/[٠-٩۰-۹]/g, (d) => map[d] || d)
    .replace(/\D/g, '')
    .slice(0, maxLen)
}

export function toEasternDigits(value, locale) {
  if (locale === 'en') return String(value)
  const eastern = '٠١٢٣٤٥٦٧٨٩'
  return String(value).replace(/\d/g, (d) => eastern[Number(d)])
}

export function joinUrlForPin(pin) {
  const base = `${window.location.origin}${import.meta.env.BASE_URL || '/'}`
  const url = new URL(base.endsWith('/') ? base : `${base}/`)
  url.searchParams.set('pin', String(pin))
  return url.toString()
}
