// Cetak Opening Balance bisa berisi puluhan-ratusan halaman replika invoice
// reguler, jadi backend memindah generate PDF-nya ke background job: GET
// .../print membalas 202 { status: 'processing' } kalau belum ada cache, lalu
// FE polling GET .../print/status sampai job selesai baru fetch ulang PDF-nya
// (yang di titik itu sudah instan karena sudah kena cache). Lihat catatan
// performa cetak Opening Balance.
const POLL_INTERVAL_MS = 3000
const POLL_TIMEOUT_MS = 10 * 60 * 1000 // background job tidak terikat timeout 1 request HTTP

function throwWithMessage(message) {
  const err = new Error(message)

  // Dibentuk seperti error axios supaya readBlobError() di pemanggil bisa
  // langsung menampilkan pesan ini alih-alih fallback generik.
  err.response = { data: { message } }

  throw err
}

export async function waitForInvoicePrintReady(api, invoiceId) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))

    const { data } = await api.get(`/finance/invoices/${invoiceId}/print/status`)

    if (data.status === 'ready')
      return

    if (data.status === 'failed')
      throwWithMessage(data.message || 'Gagal membuat dokumen cetak.')
  }

  throwWithMessage('Dokumen cetak belum siap, silakan klik Cetak lagi beberapa saat lagi.')
}
