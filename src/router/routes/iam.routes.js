export default [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/modules/IAM/views/LoginView.vue'),
    meta: { layout: 'blank', requiresGuest: true },
  },
  {
    path: '/iam/users',
    name: 'iam-users',
    component: () => import('@/modules/IAM/views/UserIndex.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN'] },
  },
  {
    path: '/iam/users/create',
    name: 'iam-users-create',
    component: () => import('@/modules/IAM/views/UserFormPage.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN'] },
  },
  {
    path: '/iam/users/:id/edit',
    name: 'iam-users-edit',
    component: () => import('@/modules/IAM/views/UserFormPage.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN'] },
  },
  {
    path: '/iam/roles',
    name: 'iam-roles',
    component: () => import('@/modules/IAM/views/RoleIndex.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN'] },
  },
  {
    path: '/iam/roles/create',
    name: 'iam-roles-create',
    component: () => import('@/modules/IAM/views/RoleForm.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN'] },
  },
  {
    path: '/iam/roles/:id/edit',
    name: 'iam-roles-edit',
    component: () => import('@/modules/IAM/views/RoleForm.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN'] },
  },
]
