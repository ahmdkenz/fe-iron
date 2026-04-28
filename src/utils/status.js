export const BOOLEAN_STATUS_OPTIONS = [
  { label: 'Aktif', value: 1 },
  { label: 'Nonaktif', value: 0 },
]

export function normalizeBooleanStatus(value, fallback = 1) {
  if (value === null || value === undefined || value === '')
    return fallback

  if (typeof value === 'boolean')
    return value ? 1 : 0

  if (typeof value === 'number')
    return value === 0 || value === 1 ? value : fallback

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()

    if (normalized === '1' || normalized === 'true')
      return 1

    if (normalized === '0' || normalized === 'false')
      return 0
  }

  return fallback
}
