import { setupLayouts } from 'virtual:meta-layouts'
import { createRouter, createWebHistory } from 'vue-router'
import routes from '@/router/index'
import { useAuthStore } from '@/stores/auth.store'
import { hasSessionMarker } from '@/utils/session-marker'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to) {
    if (to.hash)
      return { el: to.hash, behavior: 'smooth', top: 60 }

    return { top: 0 }
  },
  routes: setupLayouts(routes),
})

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

// Auth guard — resolves auth state per-route (no global bootstrap check anymore)
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(r => r.meta.requiresAuth)
  const requiresGuest = to.matched.some(r => r.meta.requiresGuest)

  // Protected route: selalu cek sesi penuh, silent refresh diizinkan.
  // Halaman guest (mis. /login): tanpa marker sesi, jangan tembak /auth/me
  // sama sekali — browser ini belum pernah login, pasti 401 tanpa cookie
  // apapun. Kalau marker ada, cek ulang supaya user yang masih login
  // (token mungkin sudah expired tapi refresh token masih hidup) tetap
  // diarahkan ke home, bukan disodori form login lagi.
  if (requiresAuth || (requiresGuest && hasSessionMarker()))
    await authStore.initAuth()

  const isLoggedIn = authStore.isLoggedIn
  const roles = normalizeRoles(authStore.user)
  const routeRoles = to.matched.flatMap(r => r.meta.roles ?? [])

  // AP murni tidak punya akses ke dashboard global, jadi "home"-nya adalah ap-dashboard.
  const homeRouteName = authStore.isApOnly ? 'ap-dashboard' : 'dashboard'

  if (requiresAuth && !isLoggedIn)
    return next({ name: 'login' })

  if (requiresGuest && isLoggedIn)
    return next({ name: homeRouteName })

  if (requiresAuth && isLoggedIn && to.name === 'dashboard' && authStore.isApOnly)
    return next({ name: homeRouteName })

  if (requiresAuth && routeRoles.length > 0 && !routeRoles.some(role => roles.includes(role)))
    return next({ name: homeRouteName })

  next()
})

export { router }
export default function (app) {
  app.use(router)
}
