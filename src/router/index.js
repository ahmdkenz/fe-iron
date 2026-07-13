import iamRoutes from './routes/iam.routes.js'
import masterRoutes from './routes/master.routes.js'
import financeRoutes from './routes/finance.routes.js'
import apRoutes from './routes/ap.routes.js'

export default [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/pages/Dashboard.vue'),
    meta: { requiresAuth: true },
  },
  ...iamRoutes,
  ...masterRoutes,
  ...financeRoutes,
  ...apRoutes,
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/pages/[...error].vue'),
  },
]
