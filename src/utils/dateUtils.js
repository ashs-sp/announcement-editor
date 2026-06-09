import dayjs from 'dayjs'

/**
 * Get today's date in ROC calendar format: 民國 XXX 年 XX 月 XX 日
 */
export function getTodayROC() {
  const today = dayjs()
  const rocYear = today.year() - 1911
  return `民國 ${rocYear} 年 ${today.month() + 1} 月 ${today.date()} 日`
}

/**
 * Get today's date in ISO format YYYY-MM-DD (for input value)
 */
export function getTodayISO() {
  return dayjs().format('YYYY-MM-DD')
}

/**
 * Convert ISO date to ROC format
 */
export function isoToROC(isoDate) {
  if (!isoDate) return ''
  const d = dayjs(isoDate)
  if (!d.isValid()) return isoDate
  const rocYear = d.year() - 1911
  return `中華民國 ${rocYear} 年 ${d.month() + 1} 月 ${d.date()} 日`
}

/**
 * Convert ISO date to short ROC format: XXX/MM/DD
 */
export function isoToROCShort(isoDate) {
  if (!isoDate) return ''
  const d = dayjs(isoDate)
  if (!d.isValid()) return isoDate
  const rocYear = d.year() - 1911
  const month = String(d.month() + 1).padStart(2, '0')
  const day = String(d.date()).padStart(2, '0')
  return `${rocYear}/${month}/${day}`
}
