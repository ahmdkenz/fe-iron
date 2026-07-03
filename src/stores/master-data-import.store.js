import { defineStore } from 'pinia'
import api from '@/utils/axios'
import { useMinimizeWidgetStore } from './minimize-widget.store'

export const WIDGET_ID = 'master-data-import'

function initialProgress() {
  return {
    status: 'queued',
    master_total: 0,  master_processed: 0,
    barang_total: 0,  barang_processed: 0,
    invoice_total: 0, invoice_processed: 0,
    investor_inserted: 0, investor_updated: 0, investor_failed: 0,
    resto_inserted: 0,    resto_updated: 0,    resto_failed: 0,
    klien_inserted: 0,    klien_updated: 0,    klien_failed: 0,    klien_skipped: 0,
    barang_inserted: 0,   barang_updated: 0,   barang_failed: 0,
    invoice_inserted: 0,  invoice_updated: 0,  invoice_skipped: 0, invoice_failed: 0,
  }
}

let pollTimer = null

export const useMasterDataImportStore = defineStore('master-data-import', {
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

    async startImport(file) {
      if (this.importing) return

      useMinimizeWidgetStore().register(WIDGET_ID, {
        title:     'Import Master Data',
        type:      'import',
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
        const res     = await api.post('/master/master-data/import', form)
        const batchId = res.data?.data?.batch_id
        if (batchId) {
          this.poll(batchId)
        } else {
          this.finish({ status: 'failed', message: 'Gagal memulai proses import.', errors: [] })
        }
      } catch (err) {
        this.finish({
          status:  'failed',
          message: err.response?.data?.message ?? 'Gagal mengunggah file.',
          errors:  [],
        })
      }
    },

    poll(batchId) {
      pollTimer = setTimeout(async () => {
        try {
          const res  = await api.get(`/master/master-data/import/${batchId}/status`)
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
          this.finish({ status: 'failed', message: 'Gagal memuat status import.', errors: [] })
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
