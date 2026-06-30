export default [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/modules/IAM/features/Auth/views/Login.vue'),
    meta: { layout: 'blank', requiresGuest: true },
  },
  {
    path: '/iam/users',
    name: 'iam-users',
    component: () => import('@/modules/IAM/features/Users/views/Index.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN'] },
  },
  {
    path: '/iam/users/create',
    name: 'iam-users-create',
    component: () => import('@/modules/IAM/features/Users/views/Form.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN'] },
  },
  {
    path: '/iam/users/:id/edit',
    name: 'iam-users-edit',
    component: () => import('@/modules/IAM/features/Users/views/Form.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN'] },
  },
  {
    path: '/iam/roles',
    name: 'iam-roles',
    component: () => import('@/modules/IAM/features/Roles/views/Index.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN'] },
  },
  {
    path: '/iam/roles/create',
    name: 'iam-roles-create',
    component: () => import('@/modules/IAM/features/Roles/views/Form.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN'] },
  },
  {
    path: '/iam/roles/:id/edit',
    name: 'iam-roles-edit',
    component: () => import('@/modules/IAM/features/Roles/views/Form.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN'] },
  },
  {
    path: '/profile',
    name: 'profile-settings',
    component: () => import('@/modules/IAM/features/Profile/views/Settings.vue'),
    meta: { requiresAuth: true },
  },
]
