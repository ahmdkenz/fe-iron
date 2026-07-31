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
    cnt_new: 0, cnt_unchanged: 0, cnt_safe_update: 0,
    cnt_review_required: 0, cnt_rejected: 0,
    cnt_cn_candidate: 0, cnt_dn_candidate: 0, cnt_metadata_candidate: 0,
    applied_total: 0, applied_processed: 0,
    applied_inserted: 0, applied_updated: 0, applied_skipped: 0, applied_failed: 0,
    adjustment_submitted: 0, adjustment_dismissed: 0,
    pending_review: 0,
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

    review: {
      items: [],
      total: 0,
      page: 1,
      perPage: 20,
      loading: false,
      classification: 'REVIEW_REQUIRED',
      search: '',
    },
    submitting: false,
  }),

  getters: {
    // Batch sudah diklasifikasi & menunggu keputusan user.
    awaitingReview: state => state.progress?.status === 'awaiting_review',
    hasSafeRows: state => (state.progress?.cnt_new ?? 0) + (state.progress?.cnt_safe_update ?? 0) > 0,
    pendingReview: state => state.progress?.pending_review ?? 0,
  },

  actions: {
    reset() {
      clearTimeout(pollTimer)
      this.batchId = null
      this.busy = false
      this.progress = null
      this.result = null
      this.review = { ...this.review, items: [], total: 0, page: 1, search: '' }
    },

    /**
     * Batch aktif (belum completed/failed) hidup di server terlepas dari sesi
     * FE — batchId cuma disimpan in-memory di Pinia, jadi reload halaman/tab
     * baru bikin FE "buta" terhadap batch lama yang masih menggantung
     * (biasanya di awaiting_review). Dipanggil saat tab dibuka supaya batch
     * itu langsung terlihat lagi (ringkasan + tabel review) tanpa harus
     * menunggu upload baru gagal dengan 409 dulu.
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

        if (data.status === 'awaiting_review' || data.status === 'completed') {
          this.fetchReview(1)
        }
      } catch {
        /* bukan data kritis — biarkan tab tampil seperti belum ada batch */
      }
    },

    /** Batalkan batch yang menggantung di awaiting_review supaya bisa upload file baru. */
    async cancelImport() {
      if (!this.batchId) return null

      const res = await api.post(`${BASE}/${this.batchId}/cancel`)

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
      this.review.items = []
      this.review.total = 0
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
      this.syncWidget()

      // Begitu klasifikasi selesai, langsung tarik baris yang butuh keputusan.
      if (data?.status === 'awaiting_review' || data?.status === 'completed') {
        this.fetchReview(1)
      }
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

    async fetchReview(page = null) {
      if (!this.batchId) return

      this.review.loading = true
      if (page) this.review.page = page

      try {
        const res = await api.get(`${BASE}/${this.batchId}/review`, {
          params: {
            page: this.review.page,
            per_page: this.review.perPage,
            classification: this.review.classification,
            search: this.review.search || undefined,
          },
        })

        this.review.items = res.data?.data ?? []
        this.review.total = res.data?.meta?.total ?? this.review.items.length
      } catch {
        this.review.items = []
        this.review.total = 0
      } finally {
        this.review.loading = false
      }
    },

    /**
     * Ajukan / abaikan kandidat penyesuaian.
     * @param {{group_id: number, action: 'submit'|'dismiss', alasan?: string}[]} decisions
     */
    async submitAdjustments(decisions) {
      if (!this.batchId || !decisions.length) return null

      this.submitting = true
      try {
        const res = await api.post(`${BASE}/${this.batchId}/submit-adjustments`, { decisions })

        await Promise.all([this.refreshStatus(), this.fetchReview()])

        return res.data?.data ?? null
      } finally {
        this.submitting = false
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
