import { defineStore } from 'pinia'
import api from '@/utils/axios'

// Module-level singleton — bukan Pinia state karena Promise tidak serializable.
// Menyimpan satu promise yang sama agar fetchMe() tidak dipanggil dua kali.
let _initPromise = null

function normalizeRoles(user) {
  const roles = Array.isArray(user?.roles)
    ? [...user.roles]
    : user?.roles
      ? Object.values(user.roles)
      : []

  if (user?.role?.name)
    roles.unshift(user.role.name)

  return [...new Set(roles.filter(Boolean))]
}

function hasAnyRole(user, targetRoles = []) {
  const userRoles = normalizeRoles(user)

  return targetRoles.some(role => userRoles.includes(role))
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
  }),

  getters: {
    isLoggedIn: state => state.user !== null,
    roles: state => normalizeRoles(state.user),
    primaryRole: state => state.user?.role?.name ?? normalizeRoles(state.user)[0] ?? null,
    hasRole: state => role => normalizeRoles(state.user).includes(role),
    hasAnyRole: state => targetRoles => hasAnyRole(state.user, targetRoles),
    isAdmin: state => normalizeRoles(state.user).includes('ADMIN'),
    isManager: state => normalizeRoles(state.user).includes('MANAGER'),
    isSupervisor: state => normalizeRoles(state.user).includes('SUPERVISOR'),
    isArOnly: state => (state.user?.role?.name === 'AR')
      || (
        normalizeRoles(state.user).includes('AR')
        && !normalizeRoles(state.user).includes('ADMIN')
        && !normalizeRoles(state.user).includes('MANAGER')
        && !normalizeRoles(state.user).includes('SUPERVISOR')
      ),
    isPicArOnly: state => (state.user?.role?.name === 'AR')
      || (
        normalizeRoles(state.user).includes('AR')
        && !normalizeRoles(state.user).includes('ADMIN')
        && !normalizeRoles(state.user).includes('MANAGER')
        && !normalizeRoles(state.user).includes('SUPERVISOR')
      ),
    canOperateOpeningBalance: state => hasAnyRole(state.user, ['MANAGER', 'SUPERVISOR', 'AR']),
    canViewOpeningBalance: state => hasAnyRole(state.user, ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AR']),
    canApproveOpeningBalance: state => hasAnyRole(state.user, ['MANAGER', 'SUPERVISOR']),
    canViewEndingBalance: state => hasAnyRole(state.user, ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AR']),
    canOperateEndingBalance: state => hasAnyRole(state.user, ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AR']),
    canLockEndingBalance: state => hasAnyRole(state.user, ['ADMIN', 'MANAGER', 'SUPERVISOR']),
    canApproveEndingBalanceSpv: state => hasAnyRole(state.user, ['ADMIN', 'SUPERVISOR']),
    canApproveEndingBalanceManager: state => hasAnyRole(state.user, ['ADMIN', 'MANAGER', 'SUPERVISOR']),
  },

  actions: {
    initAuth() {
      if (!_initPromise) {
        _initPromise = this.fetchMe().catch(error => {
          this.user = null

          // 401 murni berarti memang belum login — state normal, tidak perlu di-log.
          // Selain itu (network/500/dll) tetap dimunculkan agar tidak tersamar jadi "belum login".
          if (error?.response?.status !== 401) {
            console.error('Gagal memuat sesi user:', error)
          }
        })
      }

      return _initPromise
    },

    async login(username, password) {
      const { data } = await api.post('/auth/login', { username, password })
      const { user, token, refresh_token } = data.data
      localStorage.setItem('auth_token', token)
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token)
      }
      this.user = user
    },

    async refreshAccessToken() {
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) throw new Error('No refresh token')

      const { data } = await api.post('/auth/refresh', { refresh_token: refreshToken })
      const { token, refresh_token } = data.data
      localStorage.setItem('auth_token', token)
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token)
      }
      return token
    },

    async fetchMe() {
      const { data } = await api.get('/auth/me')
      this.user = data.data
    },

    async logout() {
      await api.post('/auth/logout').catch(() => {})
      localStorage.removeItem('auth_token')
      localStorage.removeItem('refresh_token')
      this.user = null
    },
  },
})
