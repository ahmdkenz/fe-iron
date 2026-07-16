import { defineStore } from 'pinia'
import api from '@/utils/axios'
import { useAuthStore } from '@/stores/auth.store'

let pendingOpeningBalanceCountRequest = null
let pendingOpeningBalanceCountRequestId = 0

let pendingEbKoreksiCountRequest = null
let pendingEbKoreksiCountRequestId = 0

let pendingTagihanApCountRequest = null
let pendingTagihanApCountRequestId = 0

export const useFinanceNotificationStore = defineStore('finance-notification', {
  state: () => ({
    pendingOpeningBalanceCount: 0,
    pendingEndingBalanceKoreksiCount: 0,
    pendingTagihanApCount: 0,
    isLoaded: false,
  }),

  getters: {
    pendingOpeningBalanceBadge: state => {
      if (state.pendingOpeningBalanceCount <= 0)
        return null

      return state.pendingOpeningBalanceCount > 99
        ? '99+'
        : String(state.pendingOpeningBalanceCount)
    },

    pendingEndingBalanceKoreksieBadge: state => {
      if (state.pendingEndingBalanceKoreksiCount <= 0)
        return null

      return state.pendingEndingBalanceKoreksiCount > 99
        ? '99+'
        : String(state.pendingEndingBalanceKoreksiCount)
    },

    pendingTagihanApBadge: state => {
      if (state.pendingTagihanApCount <= 0)
        return null

      return state.pendingTagihanApCount > 99
        ? '99+'
        : String(state.pendingTagihanApCount)
    },
  },

  actions: {
    async fetchPendingOpeningBalanceCount() {
      const authStore = useAuthStore()

      if (!authStore.canApproveOpeningBalance) {
        this.reset()

        return 0
      }

      if (pendingOpeningBalanceCountRequest)
        return pendingOpeningBalanceCountRequest

      const requestId = ++pendingOpeningBalanceCountRequestId

      pendingOpeningBalanceCountRequest = (async () => {
        try {
          const { data } = await api.get('/finance/opening-balance/summary', {
            params: {
              'approval_status': 'PENDING',
            },
          })

          if (requestId !== pendingOpeningBalanceCountRequestId)
            return this.pendingOpeningBalanceCount

          this.pendingOpeningBalanceCount = Number(data?.data?.total_invoice ?? 0)
        } catch {
          if (requestId === pendingOpeningBalanceCountRequestId)
            this.pendingOpeningBalanceCount = 0
        } finally {
          if (requestId === pendingOpeningBalanceCountRequestId)
            this.isLoaded = true

          pendingOpeningBalanceCountRequest = null
        }

        return this.pendingOpeningBalanceCount
      })()

      return pendingOpeningBalanceCountRequest
    },

    async fetchPendingEndingBalanceKoreksiCount() {
      const authStore = useAuthStore()

      if (!authStore.canApproveEndingBalanceSpv && !authStore.canApproveEndingBalanceManager) {
        this.pendingEndingBalanceKoreksiCount = 0

        return 0
      }

      if (pendingEbKoreksiCountRequest)
        return pendingEbKoreksiCountRequest

      const requestId = ++pendingEbKoreksiCountRequestId

      pendingEbKoreksiCountRequest = (async () => {
        try {
          const { data } = await api.get('/finance/ending-balance/koreksi/pending')

          if (requestId !== pendingEbKoreksiCountRequestId)
            return this.pendingEndingBalanceKoreksiCount

          this.pendingEndingBalanceKoreksiCount = Array.isArray(data?.data) ? data.data.length : 0
        } catch {
          if (requestId === pendingEbKoreksiCountRequestId)
            this.pendingEndingBalanceKoreksiCount = 0
        } finally {
          pendingEbKoreksiCountRequest = null
        }

        return this.pendingEndingBalanceKoreksiCount
      })()

      return pendingEbKoreksiCountRequest
    },

    async fetchPendingTagihanApCount() {
      const authStore = useAuthStore()

      if (!authStore.canApproveTagihanAp) {
        this.pendingTagihanApCount = 0

        return 0
      }

      if (pendingTagihanApCountRequest)
        return pendingTagihanApCountRequest

      const requestId = ++pendingTagihanApCountRequestId

      pendingTagihanApCountRequest = (async () => {
        try {
          const { data } = await api.get('/ap/tagihan/summary', {
            params: {
              'approval_status': 'PENDING',
            },
          })

          if (requestId !== pendingTagihanApCountRequestId)
            return this.pendingTagihanApCount

          this.pendingTagihanApCount = Number(data?.data?.total_tagihan ?? 0)
        } catch {
          if (requestId === pendingTagihanApCountRequestId)
            this.pendingTagihanApCount = 0
        } finally {
          pendingTagihanApCountRequest = null
        }

        return this.pendingTagihanApCount
      })()

      return pendingTagihanApCountRequest
    },

    reset() {
      pendingOpeningBalanceCountRequestId += 1
      pendingOpeningBalanceCountRequest = null
      this.pendingOpeningBalanceCount = 0

      pendingEbKoreksiCountRequestId += 1
      pendingEbKoreksiCountRequest = null
      this.pendingEndingBalanceKoreksiCount = 0

      pendingTagihanApCountRequestId += 1
      pendingTagihanApCountRequest = null
      this.pendingTagihanApCount = 0

      this.isLoaded = false
    },
  },
})
