import { defineStore } from 'pinia'
import api from '@/utils/axios'
import { useAuthStore } from '@/stores/auth.store'

let pendingOpeningBalanceCountRequest = null
let pendingOpeningBalanceCountRequestId = 0

export const useFinanceNotificationStore = defineStore('finance-notification', {
  state: () => ({
    pendingOpeningBalanceCount: 0,
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

    reset() {
      pendingOpeningBalanceCountRequestId += 1
      pendingOpeningBalanceCountRequest = null
      this.pendingOpeningBalanceCount = 0
      this.isLoaded = false
    },
  },
})
