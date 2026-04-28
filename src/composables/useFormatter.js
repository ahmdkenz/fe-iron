const dateFormatterCache = new Map()

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
})

function getDateFormatter(options = {}) {
  const formatterOptions = {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    ...options,
  }

  const cacheKey = JSON.stringify(formatterOptions)

  if (!dateFormatterCache.has(cacheKey))
    dateFormatterCache.set(cacheKey, new Intl.DateTimeFormat('id-ID', formatterOptions))

  return dateFormatterCache.get(cacheKey)
}

export function useFormatter() {
  function formatDate(value, options = {}) {
    if (!value) return '-'

    const date = new Date(value)
    if (Number.isNaN(date.getTime()))
      return value

    return getDateFormatter(options).format(date)
  }

  function formatDateTime(value) {
    if (!value) return '-'

    const date = new Date(value)
    if (Number.isNaN(date.getTime()))
      return value

    return dateTimeFormatter.format(date)
  }

  function formatCurrency(value) {
    if (value === null || value === undefined) return '-'

    return currencyFormatter.format(value)
  }

  function formatBoolean(value, trueLabel = 'Ya', falseLabel = 'Tidak') {
    return value ? trueLabel : falseLabel
  }

  function formatStatus(value) {
    const map = { 1: 'Aktif', 0: 'Nonaktif', active: 'Aktif', inactive: 'Nonaktif' }
    
    return map[value] ?? value
  }

  return { formatDate, formatDateTime, formatCurrency, formatBoolean, formatStatus }
}
