import { defineStore } from 'pinia'
import api from '@/utils/axios'

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
    async login(username, password) {
      const { data } = await api.post('/auth/login', { username, password })
      this.user = data.data.user
    },

    async fetchMe() {
      const { data } = await api.get('/auth/me')
      this.user = data.data
    },

    logout() {
      api.post('/auth/logout').catch(() => {})
      this.user = null
    },
  },
})
