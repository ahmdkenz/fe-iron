import iamRoutes from './routes/iam.routes.js'
import masterRoutes from './routes/master.routes.js'
import financeRoutes from './routes/finance.routes.js'
import apRoutes from './routes/ap.routes.js'
import quranRoutes from './routes/quran.routes.js'

export default [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/pages/Dashboard.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/notifications',
    name: 'notifications',
    component: () => import('@/pages/Notifications.vue'),
    meta: { requiresAuth: true },
  },
  ...iamRoutes,
  ...masterRoutes,
  ...financeRoutes,
  ...apRoutes,
  ...quranRoutes,
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/pages/[...error].vue'),
  },
]
