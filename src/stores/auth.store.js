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
    isDirector: state => normalizeRoles(state.user).includes('DIREKTUR'),
    isDirectorOnly: state => normalizeRoles(state.user).includes('DIREKTUR')
      && !normalizeRoles(state.user).includes('ADMIN')
      && !normalizeRoles(state.user).includes('MANAGER')
      && !normalizeRoles(state.user).includes('SUPERVISOR')
      && !normalizeRoles(state.user).includes('AR')
      && !normalizeRoles(state.user).includes('AP'),
    isManager: state => normalizeRoles(state.user).includes('MANAGER'),
    isSupervisor: state => normalizeRoles(state.user).includes('SUPERVISOR'),
    isArOnly: state => (state.user?.role?.name === 'AR')
      || (
        normalizeRoles(state.user).includes('AR')
        && !normalizeRoles(state.user).includes('ADMIN')
        && !normalizeRoles(state.user).includes('DIREKTUR')
        && !normalizeRoles(state.user).includes('MANAGER')
        && !normalizeRoles(state.user).includes('SUPERVISOR')
      ),
    isPicArOnly: state => (state.user?.role?.name === 'AR')
      || (
        normalizeRoles(state.user).includes('AR')
        && !normalizeRoles(state.user).includes('ADMIN')
        && !normalizeRoles(state.user).includes('DIREKTUR')
        && !normalizeRoles(state.user).includes('MANAGER')
        && !normalizeRoles(state.user).includes('SUPERVISOR')
      ),
    canOperateOpeningBalance: state => hasAnyRole(state.user, ['MANAGER', 'SUPERVISOR', 'AR']),
    canViewOpeningBalance: state => hasAnyRole(state.user, ['ADMIN', 'DIREKTUR', 'MANAGER', 'SUPERVISOR', 'AR']),
    canApproveOpeningBalance: state => normalizeRoles(state.user).includes('DIREKTUR'),
  },

  actions: {
    initAuth() {
      if (!_initPromise) {
        const token = localStorage.getItem('auth_token')
        if (token) {
          _initPromise = this.fetchMe().catch(() => {
            localStorage.removeItem('auth_token')
          })
        } else {
          _initPromise = Promise.resolve()
        }
      }

      return _initPromise
    },

    async login(username, password) {
      const { data } = await api.post('/auth/login', { username, password })
      const { user, token } = data.data
      localStorage.setItem('auth_token', token)
      this.user = user
    },

    async fetchMe() {
      const { data } = await api.get('/auth/me')
      this.user = data.data
    },

    async logout() {
      await api.post('/auth/logout').catch(() => {})
      localStorage.removeItem('auth_token')
      this.user = null
    },
  },
})
