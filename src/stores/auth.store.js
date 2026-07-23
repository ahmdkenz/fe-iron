import { defineStore } from 'pinia'
import api from '@/utils/axios'
import { clearFetchAllCache } from '@/composables/useCrud'

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

    // ─── Account Payable (AP) ───────────────────────────────────────────────
    isApOnly: state => (state.user?.role?.name === 'AP')
      || (
        normalizeRoles(state.user).includes('AP')
        && !normalizeRoles(state.user).includes('ADMIN')
        && !normalizeRoles(state.user).includes('MANAGER')
        && !normalizeRoles(state.user).includes('SUPERVISOR')
      ),
    canViewVendorAp: state => hasAnyRole(state.user, ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AP']),
    canOperateVendorAp: state => hasAnyRole(state.user, ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AP']),
    canViewTagihanAp: state => hasAnyRole(state.user, ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AP']),
    canOperateTagihanAp: state => hasAnyRole(state.user, ['ADMIN', 'AP']),
    canViewPembayaranAp: state => hasAnyRole(state.user, ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AP']),
    canOperatePembayaranAp: state => hasAnyRole(state.user, ['ADMIN', 'AP']),

    // Staging import SHZ360 — role AP diberi akses penuh setara Admin/Manager/Supervisor.
    canOperateApShz360Import: state => hasAnyRole(state.user, ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AP']),
    canViewOpeningBalanceAp: state => hasAnyRole(state.user, ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AP']),
    canOperateOpeningBalanceAp: state => hasAnyRole(state.user, ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AP']),
    canApproveOpeningBalanceAp: state => hasAnyRole(state.user, ['MANAGER', 'SUPERVISOR']),
    canViewEndingBalanceAp: state => hasAnyRole(state.user, ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AP']),
    canOperateEndingBalanceAp: state => hasAnyRole(state.user, ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AP']),
    canLockEndingBalanceAp: state => hasAnyRole(state.user, ['ADMIN', 'MANAGER', 'SUPERVISOR']),
    canApproveEndingBalanceAp: state => hasAnyRole(state.user, ['ADMIN', 'MANAGER', 'SUPERVISOR']),
  },

  actions: {
    // force: true → abaikan _initPromise lama, paksa fetchMe ulang (dipakai
    // setelah reload paksa/butuh data user terbaru).
    initAuth({ force = false } = {}) {
      if (force)
        _initPromise = null

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

      clearFetchAllCache()
      this.user = data.data.user
    },

    // Dipakai router guard di route requiresGuest (mis. /login) — baca sesi lewat
    // endpoint publik /auth/session (selalu 200, baca cookie HttpOnly server-side)
    // alih-alih marker localStorage. refresh_required berarti auth_token sudah
    // habis tapi refresh_token masih hidup: refresh dulu baru fetchMe supaya guard
    // punya data user lengkap untuk redirect ke dashboard.
    async checkGuestSession() {
      try {
        const { data } = await api.get('/auth/session')
        const session = data.data

        if (!session.authenticated) {
          this.user = null

          return
        }

        if (session.refresh_required) {
          await api.post('/auth/refresh')
          await this.fetchMe()

          return
        }

        this.user = session.user
      } catch (error) {
        this.user = null
        console.error('Gagal memeriksa sesi:', error)
      }
    },

    async fetchMe() {
      const { data } = await api.get('/auth/me')
      const nextUser = data.data

      // Sesi bisa berganti user (mis. token direstore untuk akun lain) tanpa
      // lewat login()/logout() eksplisit — bersihkan cache dropdown lama.
      if (this.user && nextUser && this.user.id !== nextUser.id)
        clearFetchAllCache()

      this.user = nextUser
    },

    async logout() {
      await api.post('/auth/logout').catch(() => {})
      localStorage.removeItem('auth_token')
      localStorage.removeItem('refresh_token')
      clearFetchAllCache()
      this.user = null
    },
  },
})
