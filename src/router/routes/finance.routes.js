export default [
  {
    path: '/finance/klien-ar',
    name: 'finance-klien-ar',
    component: () => import('@/modules/Finance/views/KlienArIndex.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'DIREKTUR', 'MANAGER', 'SUPERVISOR', 'AR'] },
  },
  {
    path: '/finance/klien-ar/create',
    name: 'finance-klien-ar-create',
    component: () => import('@/modules/Finance/views/KlienArFormPage.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'MANAGER', 'SUPERVISOR'] },
  },
  {
    path: '/finance/klien-ar/:id/edit',
    name: 'finance-klien-ar-edit',
    component: () => import('@/modules/Finance/views/KlienArFormPage.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'MANAGER', 'SUPERVISOR'] },
  },
  {
    path: '/finance/invoices',
    name: 'finance-invoice-index',
    component: () => import('@/modules/Finance/views/InvoiceIndex.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AR'] },
  },
  {
    path: '/finance/invoices/create',
    name: 'finance-invoice-create',
    component: () => import('@/modules/Finance/views/InvoiceCreate.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AR'] },
  },
  {
    path: '/finance/invoices/:id',
    name: 'finance-invoice-show',
    component: () => import('@/modules/Finance/views/InvoiceShow.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'DIREKTUR', 'MANAGER', 'SUPERVISOR', 'AR'] },
  },
  {
    path: '/finance/invoices/:id/edit',
    name: 'finance-invoice-edit',
    component: () => import('@/modules/Finance/views/InvoiceEdit.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AR'] },
  },
  {
    path: '/finance/opening-balance',
    name: 'finance-opening-balance',
    component: () => import('@/modules/Finance/views/OpeningBalanceIndex.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AR'] },
  },
  {
    path: '/finance/opening-balance/create',
    name: 'finance-opening-balance-create',
    component: () => import('@/modules/Finance/views/OpeningBalanceCreate.vue'),
    meta: { requiresAuth: true, roles: ['MANAGER', 'SUPERVISOR', 'AR'] },
  },
  {
    path: '/finance/opening-balance/:id/edit',
    name: 'finance-opening-balance-edit',
    component: () => import('@/modules/Finance/views/OpeningBalanceCreate.vue'),
    meta: { requiresAuth: true, roles: ['MANAGER', 'SUPERVISOR', 'AR'] },
  },
  {
    path: '/finance/opening-balance/approval',
    name: 'finance-opening-balance-approval',
    component: () => import('@/modules/Finance/views/OpeningBalanceApprovalIndex.vue'),
    meta: { requiresAuth: true, roles: ['DIREKTUR'] },
  },
]
