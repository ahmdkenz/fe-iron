import { setupLayouts } from 'virtual:meta-layouts'
import { createRouter, createWebHistory } from 'vue-router'
import routes from '@/router/index'

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

// Auth guard
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const roles = normalizeRoles(user)
  const requiresAuth = to.matched.some(r => r.meta.requiresAuth)
  const requiresGuest = to.matched.some(r => r.meta.requiresGuest)
  const routeRoles = to.matched.flatMap(r => r.meta.roles ?? [])

  if (requiresAuth && !token)
    return next({ name: 'login' })

  if (requiresGuest && token)
    return next({ name: 'dashboard' })

  if (requiresAuth && routeRoles.length > 0 && !routeRoles.some(role => roles.includes(role)))
    return next({ name: 'dashboard' })

  next()
})

export { router }
export default function (app) {
  app.use(router)
}
