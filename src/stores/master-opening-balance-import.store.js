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
  }),

  actions: {
    reset() {
      clearTimeout(pollTimer)
      this.importing = false
      this.progress  = null
      this.result    = null
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

    async startImport(file) {
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
      useMinimizeWidgetStore().updateImportState(WIDGET_ID, { importing: true, progress: this.progress, result: null })

      try {
        const form = new FormData()

        form.append('file', file)

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

          this.poll(batchId)
        } catch {
          this.finish({ ...initialProgress(), status: 'failed', message: 'Gagal memuat status import.' })
        }
      }, 1500)
    },

    finish(data) {
      this.importing = false
      this.result    = data
      useMinimizeWidgetStore().updateImportState(WIDGET_ID, { importing: false, progress: data, result: data })
    },
  },
})
