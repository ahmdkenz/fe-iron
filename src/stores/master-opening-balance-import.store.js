import { defineStore } from 'pinia'
import api from '@/utils/axios'
import { useMinimizeWidgetStore } from './minimize-widget.store'

export const WIDGET_ID = 'master-opening-balance-import'

const BASE = '/master/master-data/opening-balance/import'

function initialProgress() {
  return {
    status: 'queued',
    total_ob: 0, processed_ob: 0,
    inserted_ob: 0, skipped_ob: 0, failed_ob: 0,
    total_detail: 0, inserted_detail: 0,
    total_item: 0, inserted_item: 0,
    errors: [],
    message: null,
  }
}

let pollTimer = null

export const useMasterOpeningBalanceImportStore = defineStore('master-opening-balance-import', {
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
     * di tengah proses) langsung terlihat lagi tanpa harus menunggu upload baru gagal
     * dengan 409 dulu. Pola sama seperti checkActive() di master-invoice-import.store.js.
     */
    async checkActive() {
      if (this.importing) return

      try {
        const res  = await api.get(`${BASE}/active`)
        const data = res.data?.data

        if (!data) return

        this.importing = true
        this.progress   = data
        this.poll(data.batch_id)
      } catch {
        /* bukan data kritis — biarkan tab tampil seperti belum ada batch */
      }
    },

    async startImport(file, cutoverDate) {
      if (this.importing) return

      useMinimizeWidgetStore().register(WIDGET_ID, {
        title: 'Import Master Opening Balance',
        type: 'import',
        routeName: 'master-unified-import',
        minimized: false,
      })

      this.importing = true
      this.result    = null
      this.progress  = initialProgress()
      this.cancelRequested = false
      useMinimizeWidgetStore().updateImportState(WIDGET_ID, { importing: true, progress: this.progress, result: null })

      try {
        const form = new FormData()

        form.append('file', file)
        form.append('cutover_date', cutoverDate)

        const res     = await api.post(BASE, form)
        const batchId = res.data?.data?.batch_id

        if (batchId) {
          this.poll(batchId)
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

    poll(batchId) {
      this.batchId = batchId
      pollTimer = setTimeout(async () => {
        try {
          const res  = await api.get(`${BASE}/${batchId}/status`)
          const data = res.data?.data

          if (data) {
            this.progress = data
            useMinimizeWidgetStore().updateImportState(WIDGET_ID, { importing: true, progress: data, result: null })
          }

          if (data?.status === 'completed' || data?.status === 'failed') {
            this.finish(data)

            return
          }

          // 'needs_confirmation' bukan status terminal — berhenti polling (menunggu
          // keputusan user lewat confirmReplace/confirmSkip/cancelImport), TAPI jangan
          // finish() supaya dialog import tetap terbuka & merender dialog konflik alih-
          // alih hasil akhir.
          if (data?.status === 'needs_confirmation') return

          this.poll(batchId)
        } catch {
          this.finish({ ...initialProgress(), status: 'failed', message: 'Gagal memuat status import.' })
        }
      }, 1500)
    },

    finish(data) {
      this.importing = false
      this.result    = data
      this.cancelRequested = false
      useMinimizeWidgetStore().updateImportState(WIDGET_ID, { importing: false, progress: data, result: data })
    },

    async confirmReplace() {
      if (!this.batchId) return
      await api.post(`${BASE}/${this.batchId}/confirm-replace`)
      this.progress = { ...initialProgress(), status: 'queued' }
      this.poll(this.batchId)
    },

    async confirmSkip() {
      if (!this.batchId) return
      await api.post(`${BASE}/${this.batchId}/confirm-skip`)
      this.progress = { ...initialProgress(), status: 'queued' }
      this.poll(this.batchId)
    },

    /**
     * Dua kemungkinan respons server (lihat OpeningBalanceController::importCancel()):
     *  - 200 (awaiting_confirmation): job tidak aktif, server sudah membatalkan sinkron — aman
     *    langsung reset().
     *  - 202 (queued/processing selama masih Pass 1): job MASIH aktif, server cuma menitip flag
     *    "batal diminta" — polling yang sudah berjalan akan menangkap sendiri begitu batch
     *    berhenti (status jadi failed). cancelRequested dipakai FE menampilkan "Membatalkan..."
     *    selama jeda itu.
     */
    async cancelImport() {
      if (!this.batchId) return

      const res = await api.post(`${BASE}/${this.batchId}/cancel`)

      if (res.status === 202) {
        this.cancelRequested = true

        return
      }

      this.reset()
    },
  },
})
