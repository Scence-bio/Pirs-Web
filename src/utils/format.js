export function localize(field, locale) {
  if (!field) return ''
  if (typeof field === 'string') return field
  if (Array.isArray(field)) return field
  return field[locale] || field.ckb || field.en || field.ar || ''
}

export function toEasternDigits(value, locale) {
  if (locale === 'en') return String(value)
  const eastern = '٠١٢٣٤٥٦٧٨٩'
  return String(value).replace(/\d/g, (d) => eastern[Number(d)])
}
