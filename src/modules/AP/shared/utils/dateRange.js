function pad(value) {
  return String(value).padStart(2, '0')
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Rentang tanggal bulan berjalan (lokal browser) dalam format YYYY-MM-DD. */
export function getCurrentMonthRange() {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  return {
    tanggal_dari: formatDate(firstDay),
    tanggal_sampai: formatDate(lastDay),
  }
}
