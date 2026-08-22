import { defineStore } from 'pinia'
import api from '@/utils/axios'
import { useMinimizeWidgetStore } from './minimize-widget.store'

export const WIDGET_ID = 'master-data-import'

const BASE = '/master/master-data/import'

function initialProgress() {
  return {
    status: 'queued',
    master_total: 0,  master_processed: 0,
    barang_total: 0,  barang_processed: 0,
    investor_inserted: 0, investor_updated: 0, investor_failed: 0,
    resto_inserted: 0,    resto_updated: 0,    resto_failed: 0,
    klien_inserted: 0,    klien_updated: 0,    klien_failed: 0,    klien_skipped: 0,
    barang_inserted: 0,   barang_updated: 0,   barang_skipped: 0,   barang_failed: 0,
  }
}

let pollTimer = null
let consecutiveFailures = 0
const MAX_CONSECUTIVE_FAILURES = 5

export const useMasterDataImportStore = defineStore('master-data-import', {
  state: () => ({
    importing: false,
    progress: null,
    result: null,
    batchId: null,
    cancelRequested: false, // true sejak respons 202 (cancel optimis) sampai batch berhenti sendiri
  }),

  actions: {
    reset() {
      clearTimeout(pollTimer)
      this.importing = false
      this.progress  = null
      this.result    = null
      this.batchId   = null
      this.cancelRequested = false
    },

    /**
     * Batch aktif (belum completed/failed) hidup di server terlepas dari sesi FE —
     * dipanggil saat tab dibuka supaya batch yang masih berjalan (mis. reload halaman
     * di tengah proses) langsung terlihat lagi. Pola sama seperti checkActive() di
     * master-invoice-import.store.js / master-opening-balance-import.store.js.
     */
    async checkActive() {
      if (this.importing) return

      try {
        const res  = await api.get(`${BASE}/active`)
        const data = res.data?.data

        if (!data) return

        this.importing = true
        this.batchId   = data.batch_id
        this.progress  = data
        consecutiveFailures = 0
        this.poll(data.batch_id)
      } catch {
        /* bukan data kritis — biarkan tab tampil seperti belum ada batch */
      }
    },

    async startImport(file) {
      if (this.importing) return

      useMinimizeWidgetStore().register(WIDGET_ID, {
        title: 'Import Master Data',
        type: 'import',
        routeName: 'master-unified-import',
        minimized: false,
      })

      this.importing = true
      this.result    = null
      this.progress  = initialProgress()
      this.cancelRequested = false
      consecutiveFailures = 0
      useMinimizeWidgetStore().updateImportState(WIDGET_ID, { importing: true, progress: this.progress, result: null })

      try {
        const form = new FormData()

        form.append('file', file)

        const res     = await api.post(BASE, form)
        const batchId = res.data?.data?.batch_id
        if (batchId) {
          this.poll(batchId)
        } else {
          this.finish({ status: 'failed', message: 'Gagal memulai proses import.', errors: [] })
        }
      } catch (err) {
        this.finish({
          status: 'failed',
          message: err.response?.data?.message ?? 'Gagal mengunggah file.',
          errors: [],
        })
      }
    },

    poll(batchId) {
      this.batchId = batchId
      clearTimeout(pollTimer)
      pollTimer = setTimeout(async () => {
        try {
          const res  = await api.get(`${BASE}/${batchId}/status`)
          const data = res.data?.data

          consecutiveFailures = 0

          if (data) {
            this.progress = data
            useMinimizeWidgetStore().updateImportState(WIDGET_ID, { importing: true, progress: data, result: null })
          }

          if (data?.status === 'completed' || data?.status === 'failed') {
            this.finish(data)

            return
          }

          this.poll(batchId)
        } catch (err) {
          // 404/403 berarti batch memang sudah tidak valid (mis. dihapus/DB
          // di-reset) — bukan gangguan sesaat, jadi langsung terminal. Selain
          // itu (network error, timeout, 5xx, 429) dianggap sementara: coba
          // lagi sampai MAX_CONSECUTIVE_FAILURES sebelum benar-benar menyerah,
          // supaya satu blip jaringan tidak langsung mematikan seluruh alur.
          const status = err.response?.status

          if (status === 404 || status === 403) {
            this.finish({
              status:  'failed',
              message: err.response?.data?.message ?? 'Gagal memuat status import.',
              errors:  [],
            })

            return
          }

          consecutiveFailures++

          if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
            this.finish({ status: 'failed', message: 'Gagal memuat status import.', errors: [] })

            return
          }

          this.poll(batchId)
        }
      }, 1500)
    },

    finish(data) {
      this.importing = false
      this.result    = data
      this.cancelRequested = false
      useMinimizeWidgetStore().updateImportState(WIDGET_ID, { importing: false, progress: data, result: data })
    },

    /**
     * Dua kemungkinan respons server (lihat UnifiedMasterController::cancel()):
     *  - 202 (queued/processing): job MASIH aktif — seluruh penulisan entitas dibungkus SATU
     *    transaksi besar (lihat MasterImportService::process()), jadi cancel selalu optimis di
     *    sini, tidak ada jalur sinkron 200 seperti Invoice/OB AR. Polling yang sudah berjalan
     *    akan menangkap sendiri begitu batch berhenti (rollback total, status jadi failed).
     */
    async cancelImport() {
      if (!this.batchId) return

      const res = await api.post(`${BASE}/${this.batchId}/cancel`)

      if (res.status === 202) {
        this.cancelRequested = true
      }
    },
  },
})
