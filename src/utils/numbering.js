// Chinese numerals mapping
const CHINESE_NUMERALS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '二十一', '二十二', '二十三', '二十四', '二十五', '二十六', '二十七', '二十八', '二十九', '三十']

export function toChineseNumeral(n) {
  if (n >= 1 && n <= CHINESE_NUMERALS.length) return CHINESE_NUMERALS[n - 1]
  return String(n)
}

/**
 * Get the display prefix for a numbered item
 * Level 1: 一、二、三、
 * Level 2: （一）（二）（三）
 * Level 3: 1. 2. 3.
 * Level 4: (1) (2) (3)
 */
export function getNumberPrefix(level, index) {
  switch (level) {
    case 1:
      return `${toChineseNumeral(index)}、`
    case 2:
      return `（${toChineseNumeral(index)}）`
    case 3:
      return `${index}.\u00A0`
    case 4:
      return `(${index})\u00A0 `
    default:
      return `${index}.`
  }
}

/**
 * Compute display numbers for a flat list of items
 * Each item has a `level` property (1-4)
 * Returns array of { item, prefix, displayIndex }
 */
export function computeNumberedList(items) {
  // counters[level] = current count
  const counters = { 1: 0, 2: 0, 3: 0, 4: 0 }

  return items.map((item) => {
    const level = item.level || 1

    // Reset all deeper levels when this level increments
    counters[level] += 1
    for (let l = level + 1; l <= 4; l++) {
      counters[l] = 0
    }

    const prefix = getNumberPrefix(level, counters[level])
    return { item, prefix, index: counters[level] }
  })
}

/**
 * Get indent style for a level
 */
export function getLevelIndent(level) {
  const indents = { 1: 0, 2: 0, 3: 64, 4: 80 }
  return indents[level] || 0
}

/**
 * Get prefix width for a level (for alignment)
 */
export function getLevelPrefixWidth(level) {
  const widths = { 1: '2em', 2: '2.5em', 3: '1.8em', 4: '2em' }
  return widths[level] || '2em'
}
