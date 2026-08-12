import { defineStore } from 'pinia'
import api from '@/utils/axios'
import { getEcho } from '@/plugins/echo'
import { useAuthStore } from '@/stores/auth.store'

const APP_UPDATES_READ_KEY = 'iron_app_updates_read_ids'

function loadReadIds() {
  try {
    const raw = localStorage.getItem(APP_UPDATES_READ_KEY)

    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function saveReadIds(set) {
  try {
    localStorage.setItem(APP_UPDATES_READ_KEY, JSON.stringify([...set]))
  } catch {
    // localStorage penuh/diblokir — abaikan, read-state cukup best-effort.
  }
}

function badge(count) {
  if (count <= 0)
    return null

  return count > 99 ? '99+' : String(count)
}

let echoChannel = null
let connectedUserId = null

export const useSystemNotificationStore = defineStore('system-notification', {
  state: () => ({
    financeItems: [],
    financeUnreadCount: 0,
    financeLoaded: false,
    financeLoading: false,

    appUpdates: [],
    appUpdatesReadIds: loadReadIds(),
    appUpdatesLoaded: false,
  }),

  getters: {
    financeBadge: state => badge(state.financeUnreadCount),

    appUpdateUnreadCount: state => state.appUpdates.filter(u => !state.appUpdatesReadIds.has(u.id)).length,
    appUpdateBadge() {
      return badge(this.appUpdateUnreadCount)
    },

    bellBadge() {
      return badge(this.financeUnreadCount + this.appUpdateUnreadCount)
    },
  },

  actions: {
    async ensureLoaded() {
      if (!this.financeLoaded)
        await this.fetchFinanceList()
      if (!this.appUpdatesLoaded)
        await this.fetchAppUpdates()
    },

    // ─── Aktivitas Finance (realtime) ────────────────────────────────────────

    async fetchFinanceList() {
      this.financeLoading = true
      try {
        const { data } = await api.get('/notifications', { params: { per_page: 20 } })

        this.financeItems = Array.isArray(data?.data) ? data.data : []
      } catch {
        this.financeItems = []
      } finally {
        this.financeLoading = false
        this.financeLoaded = true
      }
    },

    async fetchFinanceUnreadCount() {
      try {
        const { data } = await api.get('/notifications/unread-count')

        this.financeUnreadCount = Number(data?.data?.count ?? 0)
      } catch {
        this.financeUnreadCount = 0
      }
    },

    async markFinanceRead(id) {
      const item = this.financeItems.find(n => n.id === id)
      if (item && !item.read_at)
        this.financeUnreadCount = Math.max(0, this.financeUnreadCount - 1)
      if (item)
        item.read_at = item.read_at ?? new Date().toISOString()

      try {
        await api.patch(`/notifications/${id}/read`)
      } catch {
        // Rollback ringan tidak krusial — fetchFinanceUnreadCount berikutnya akan koreksi.
      }
    },

    async markAllFinanceRead() {
      this.financeItems.forEach(n => { n.read_at = n.read_at ?? new Date().toISOString() })
      this.financeUnreadCount = 0

      try {
        await api.patch('/notifications/read-all')
      } catch {
        await this.fetchFinanceUnreadCount()
      }
    },

    handleIncomingNotification(payload) {
      this.financeItems.unshift({
        id: payload.id,
        category: payload.category,
        severity: payload.severity,
        title: payload.title,
        body: payload.body,
        route_name: payload.route_name,
        route_params: payload.route_params ?? {},
        entity_type: payload.entity_type,
        entity_id: payload.entity_id,
        actor_name: payload.actor_name,
        occurred_at: payload.occurred_at,
        read_at: null,
        created_at: payload.occurred_at,
      })
      this.financeItems = this.financeItems.slice(0, 50)
      this.financeUnreadCount += 1
    },

    connect(userId) {
      if (!userId || connectedUserId === userId)
        return

      this.disconnect()

      const echo = getEcho()

      echoChannel = echo.private(`App.Models.User.${userId}`)
      echoChannel.notification(payload => this.handleIncomingNotification(payload))
      connectedUserId = userId
    },

    disconnect() {
      if (connectedUserId) {
        getEcho().leave(`App.Models.User.${connectedUserId}`)
        connectedUserId = null
      }
      echoChannel = null
    },

    // ─── Update Aplikasi (static release file) ───────────────────────────────

    async fetchAppUpdates() {
      try {
        const response = await fetch('/iron-updates.json', { cache: 'no-store' })
        if (!response.ok)
          throw new Error('Gagal memuat iron-updates.json')

        const payload = await response.json()
        const authStore = useAuthStore()
        const roles = authStore.roles

        const updates = Array.isArray(payload?.updates) ? payload.updates : []

        this.appUpdates = updates
          .filter(u => !Array.isArray(u.target_roles) || u.target_roles.length === 0 || u.target_roles.some(r => roles.includes(r)))
          .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
      } catch {
        this.appUpdates = []
      } finally {
        this.appUpdatesLoaded = true
      }
    },

    markAppUpdateRead(id) {
      if (this.appUpdatesReadIds.has(id))
        return

      this.appUpdatesReadIds.add(id)
      saveReadIds(this.appUpdatesReadIds)
    },

    markAllAppUpdatesRead() {
      this.appUpdates.forEach(u => this.appUpdatesReadIds.add(u.id))
      saveReadIds(this.appUpdatesReadIds)
    },

    reset() {
      this.disconnect()
      this.financeItems = []
      this.financeUnreadCount = 0
      this.financeLoaded = false
      this.appUpdates = []
      this.appUpdatesLoaded = false
    },
  },
})
