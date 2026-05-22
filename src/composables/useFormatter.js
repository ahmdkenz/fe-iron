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

/**
 * Parse tanggal secara aman tanpa pergeseran timezone.
 * Mendukung format: YYYY-MM-DD, DD-MM-YYYY, DD-MM-YYYY HH:mm, dan ISO 8601.
 */
function parseDate(value) {
  if (!value) return null

  // Format DD-MM-YYYY atau DD-MM-YYYY HH:mm (sudah diformat backend)
  const ddmmyyyy = /^(\d{2})-(\d{2})-(\d{4})/.exec(String(value))
  if (ddmmyyyy) {
    const [, d, m, y] = ddmmyyyy
    return new Date(+y, +m - 1, +d)
  }

  // Format YYYY-MM-DD (ISO date tanpa waktu) — hindari UTC shift
  const yyyymmdd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value))
  if (yyyymmdd) {
    const [, y, m, d] = yyyymmdd
    return new Date(+y, +m - 1, +d)
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function useFormatter() {
  /**
   * Format tanggal ke DD-MM-YYYY (contoh: 22-05-2026).
   */
  function formatDate(value) {
    if (!value) return '-'
    const date = parseDate(value)
    if (!date) return String(value)

    const d = String(date.getDate()).padStart(2, '0')
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const y = date.getFullYear()
    return `${d}-${m}-${y}`
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
