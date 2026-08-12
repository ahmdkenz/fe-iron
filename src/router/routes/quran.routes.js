export default [
  {
    path: '/quran',
    name: 'quran-index',
    component: () => import('@/modules/Quran/features/Surah/views/Index.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/quran/:nomor',
    name: 'quran-baca',
    component: () => import('@/modules/Quran/features/Surah/views/Baca.vue'),
    meta: { requiresAuth: true },
  },
]
