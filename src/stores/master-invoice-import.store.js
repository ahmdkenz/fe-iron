import { defineStore } from 'pinia'
import api from '@/utils/axios'
import { useMinimizeWidgetStore } from './minimize-widget.store'

export const WIDGET_ID = 'master-invoice-import'

const BASE = '/finance/invoices/import'

/**
 * Status batch yang sudah tidak berubah tanpa aksi user — polling berhenti di sini.
 * `awaiting_review` termasuk terminal: batch menunggu user menekan "Proses Data Aman".
 */
const TERMINAL = ['awaiting_review', 'completed', 'failed']

function initialProgress() {
  return {
    status: 'queued',
    phase: 'queued',
    message: null,
    total_rows: 0, parsed_rows: 0,
    total_groups: 0, classified_groups: 0,
    cnt_new: 0, cnt_unchanged: 0, cnt_safe_update: 0, cnt_rejected: 0,
    applied_total: 0, applied_processed: 0,
    applied_inserted: 0, applied_updated: 0, applied_skipped: 0, applied_failed: 0,
    errors: [],
  }
}

let pollTimer = null

export const useMasterInvoiceImportStore = defineStore('master-invoice-import', {
  state: () => ({
    batchId: null,
    busy: false,          // upload/klasifikasi atau proses data aman sedang berjalan
    progress: null,
    result: null,         // terisi saat batch mencapai status terminal
    cancelRequested: false, // true sejak respons 202 (cancel optimis) sampai batch berhenti sendiri
  }),

  getters: {
    // Batch sudah diklasifikasi & menunggu keputusan user.
    awaitingReview: state => state.progress?.status === 'awaiting_review',
    hasSafeRows: state => (state.progress?.cnt_new ?? 0) + (state.progress?.cnt_safe_update ?? 0) > 0,
  },

  actions: {
    reset() {
      clearTimeout(pollTimer)
      this.batchId = null
      this.busy = false
      this.progress = null
      this.result = null
      this.cancelRequested = false
    },

    /**
     * Batch aktif (belum completed/failed) hidup di server terlepas dari sesi
     * FE — batchId cuma disimpan in-memory di Pinia, jadi reload halaman/tab
     * baru bikin FE "buta" terhadap batch lama yang masih menggantung
     * (biasanya di awaiting_review). Dipanggil saat tab dibuka supaya batch
     * itu langsung terlihat lagi (kartu ringkasan) tanpa harus menunggu upload
     * baru gagal dengan 409 dulu. Tabel Riwayat Perubahan punya sumbernya sendiri
     * (endpoint import/latest), jadi tidak bergantung pada batch aktif di sini.
     */
    async checkActive() {
      if (this.batchId) return

      try {
        const res = await api.get(`${BASE}/active`)
        const data = res.data?.data

        if (!data) return

        this.batchId = data.batch_id
        this.progress = data
        this.result = data
      } catch {
        /* bukan data kritis — biarkan tab tampil seperti belum ada batch */
      }
    },

    /**
     * Batalkan import. Dua kemungkinan respons server (lihat InvoiceImportController::cancel()):
     *  - 200 (awaiting_review): job tidak lagi aktif, server sudah membatalkan secara sinkron —
     *    aman langsung reset().
     *  - 202 (queued/parsing/classifying): job MASIH aktif jalan, server cuma menitip flag "batal
     *    diminta". Polling yang sudah berjalan (lihat poll()) akan menangkap sendiri begitu batch
     *    berhenti di boundary chunk berikutnya (status jadi failed) — cancelRequested dipakai FE
     *    menampilkan "Membatalkan..." selama jeda itu.
     */
    async cancelImport() {
      if (!this.batchId) return null

      const res = await api.post(`${BASE}/${this.batchId}/cancel`)

      if (res.status === 202) {
        this.cancelRequested = true

        return res.data?.data ?? null
      }

      this.reset()

      return res.data?.data ?? null
    },

    async startImport(file) {
      if (this.busy) return

      useMinimizeWidgetStore().register(WIDGET_ID, {
        title: 'Import Master Invoice',
        type: 'import',
        routeName: 'master-unified-import',
        minimized: false,
      })

      this.busy = true
      this.result = null
      this.progress = initialProgress()
      this.cancelRequested = false
      this.syncWidget()

      try {
        const form = new FormData()

        form.append('file', file)

        const res = await api.post(BASE, form)
        const batchId = res.data?.data?.batch_id

        if (batchId) {
          this.batchId = batchId
          this.poll()
        } else {
          this.finish({ ...initialProgress(), status: 'failed', message: 'Gagal memulai proses import.' })
        }
      } catch (err) {
        this.finish({
          ...initialProgress(),
          status: 'failed',
          message: err.response?.data?.message ?? 'Gagal mengunggah file.',
        })
      }
    },

    poll() {
      if (!this.batchId) return

      pollTimer = setTimeout(async () => {
        try {
          const res = await api.get(`${BASE}/${this.batchId}/status`)
          const data = res.data?.data

          if (data) {
            this.progress = data
            this.syncWidget()
          }

          if (TERMINAL.includes(data?.status)) {
            this.finish(data)

            return
          }

          this.poll()
        } catch {
          this.finish({ ...initialProgress(), status: 'failed', message: 'Gagal memuat status import.' })
        }
      }, 1500)
    },

    finish(data) {
      this.busy = false
      this.progress = data
      this.result = data
      this.cancelRequested = false
      this.syncWidget()
    },

    /** Jalankan penulisan invoice untuk baris NEW_INVOICE + SAFE_UPDATE. */
    async applySafe() {
      if (!this.batchId || this.busy) return

      this.busy = true
      this.result = null
      this.progress = { ...this.progress, status: 'processing', phase: 'applying' }
      this.syncWidget()

      try {
        const res = await api.post(`${BASE}/${this.batchId}/apply-safe`)

        // 200 = tidak ada yang perlu diproses, payload-nya sudah status akhir.
        if (res.status === 200) {
          this.finish(res.data?.data ?? this.progress)

          return
        }

        this.poll()
      } catch (err) {
        this.busy = false
        this.progress = {
          ...this.progress,
          status: 'awaiting_review',
          message: err.response?.data?.message ?? 'Gagal memproses data aman.',
        }
        this.syncWidget()
        throw err
      }
    },

    async refreshStatus() {
      if (!this.batchId) return
      try {
        const res = await api.get(`${BASE}/${this.batchId}/status`)
        if (res.data?.data) this.progress = res.data.data
      } catch {
        /* biarkan progress terakhir — status bukan data kritis untuk aksi berikutnya */
      }
    },

    syncWidget() {
      useMinimizeWidgetStore().updateImportState(WIDGET_ID, {
        importing: this.busy,
        progress: this.progress,
        result: this.result,
      })
    },
  },
})
