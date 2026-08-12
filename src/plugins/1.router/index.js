import { setupLayouts } from 'virtual:meta-layouts'
import { createRouter, createWebHistory } from 'vue-router'
import routes from '@/router/index'
import { useAuthStore } from '@/stores/auth.store'
import { layoutConfig } from '@themeConfig'

// Breakpoint sama dengan yang menentukan kapan MobileBottomNav tampil
// (lihat @layouts/stores/config.js) — dipakai langsung via matchMedia (bukan
// Pinia store) karena guard ini bisa jalan sebelum ada komponen ter-mount.
function isMobileViewport() {
  return window.matchMedia(`(max-width: ${layoutConfig.app.overlayNavFromBreakpoint}px)`).matches
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (to.hash)
      return { el: to.hash, behavior: 'smooth', top: 60 }

    // Navigasi yang cuma mengganti query di path yang sama (mis. sinkronisasi
    // tab/filter/id terpilih ke URL lewat router.replace) bukan perpindahan
    // halaman — jangan lompat ke atas, biarkan posisi scroll user tetap.
    if (to.path === from.path)
      return savedPosition || false

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

  // Protected route: cek sesi penuh lewat /auth/me, silent refresh diizinkan.
  // Halaman guest (mis. /login): cek lewat /auth/session — endpoint publik yang
  // selalu 200 dan membaca cookie HttpOnly server-side, jadi tidak pernah memicu
  // 401 di console meski browser belum pernah login sama sekali.
  if (requiresAuth)
    await authStore.initAuth()
  else if (requiresGuest)
    await authStore.checkGuestSession()

  const isLoggedIn = authStore.isLoggedIn
  const roles = normalizeRoles(authStore.user)
  const routeRoles = to.matched.flatMap(r => r.meta.roles ?? [])

  // AP murni tidak punya akses ke dashboard global, jadi "home"-nya adalah ap-dashboard.
  const homeRouteName = authStore.isApOnly ? 'ap-dashboard' : 'dashboard'

  if (requiresAuth && !isLoggedIn)
    return next({ name: 'login', query: { redirect: to.fullPath } })

  if (requiresGuest && isLoggedIn)
    return next({ name: homeRouteName })

  if (requiresAuth && isLoggedIn && to.name === 'dashboard' && authStore.isApOnly)
    return next({ name: homeRouteName })

  // ADMIN/MANAGER/SUPERVISOR kini melihat ringkasan AP lewat dashboard gabungan,
  // jadi halaman Dashboard AP mandiri hanya untuk AP murni.
  if (requiresAuth && isLoggedIn && to.name === 'ap-dashboard' && !authStore.isApOnly)
    return next({ name: 'dashboard' })

  if (requiresAuth && routeRoles.length > 0 && !routeRoles.some(role => roles.includes(role)))
    return next({ name: homeRouteName })

  // Fitur tertentu (Laporan, Import Master Data) sengaja tidak dibuka di
  // viewport mobile — selain hilang dari menu, akses URL langsung juga diblokir.
  const routeDesktopOnly = to.matched.some(r => r.meta.desktopOnly)

  if (requiresAuth && isLoggedIn && routeDesktopOnly && isMobileViewport())
    return next({ name: homeRouteName })

  next()
})

export { router }
export default function (app) {
  app.use(router)
}
