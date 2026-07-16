const AP_ROLES = ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AP']

export default [
  {
    path: '/ap/dashboard',
    name: 'ap-dashboard',
    component: () => import('@/modules/AP/features/Dashboard/views/Index.vue'),
    meta: { requiresAuth: true, roles: AP_ROLES },
  },
  {
    path: '/ap/vendors',
    name: 'ap-vendor-index',
    component: () => import('@/modules/AP/features/VendorAp/views/Index.vue'),
    meta: { requiresAuth: true, roles: AP_ROLES },
  },
  {
    path: '/ap/tagihan',
    name: 'ap-tagihan-index',
    component: () => import('@/modules/AP/features/TagihanAp/views/Index.vue'),
    meta: { requiresAuth: true, roles: AP_ROLES },
  },
  {
    path: '/ap/tagihan/create',
    name: 'ap-tagihan-create',
    component: () => import('@/modules/AP/features/TagihanAp/views/Form.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'AP'] },
  },
  { path: '/ap/tagihan/approval', redirect: { name: 'ap-tagihan-index', hash: '#approval-tagihan' } },
  {
    path: '/ap/tagihan/:id',
    name: 'ap-tagihan-show',
    component: () => import('@/modules/AP/features/TagihanAp/views/Show.vue'),
    meta: { requiresAuth: true, roles: AP_ROLES },
  },
  {
    path: '/ap/tagihan/:id/edit',
    name: 'ap-tagihan-edit',
    component: () => import('@/modules/AP/features/TagihanAp/views/Form.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'AP'] },
  },
  {
    path: '/ap/pembayaran',
    name: 'ap-pembayaran-index',
    component: () => import('@/modules/AP/features/PembayaranAp/views/Index.vue'),
    meta: { requiresAuth: true, roles: AP_ROLES },
  },
  {
    path: '/ap/shz360-import',
    name: 'ap-shz360-import-index',
    component: () => import('@/modules/AP/features/Shz360Import/views/Index.vue'),
    meta: { requiresAuth: true, roles: AP_ROLES },
  },
]
