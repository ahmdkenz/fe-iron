export default [
  {
    path: '/finance/klien-ar',
    name: 'finance-klien-ar',
    component: () => import('@/modules/Finance/features/KlienAr/views/Index.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AR'] },
  },
  {
    path: '/finance/klien-ar/create',
    name: 'finance-klien-ar-create',
    component: () => import('@/modules/Finance/features/KlienAr/views/Form.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AR'] },
  },
  {
    path: '/finance/klien-ar/:id/edit',
    name: 'finance-klien-ar-edit',
    component: () => import('@/modules/Finance/features/KlienAr/views/Form.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AR'] },
  },
  {
    path: '/finance/invoices',
    name: 'finance-invoice-index',
    component: () => import('@/modules/Finance/features/Invoice/views/Index.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AR'] },
  },
  {
    path: '/finance/invoices/create',
    name: 'finance-invoice-create',
    component: () => import('@/modules/Finance/features/Invoice/views/Form.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AR'] },
  },
  {
    path: '/finance/invoices/:id',
    name: 'finance-invoice-show',
    component: () => import('@/modules/Finance/features/Invoice/views/Show.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AR'] },
  },
  {
    path: '/finance/invoices/:id/edit',
    name: 'finance-invoice-edit',
    component: () => import('@/modules/Finance/features/Invoice/views/Form.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AR'] },
  },
  {
    path: '/finance/opening-balance',
    name: 'finance-opening-balance',
    component: () => import('@/modules/Finance/features/OpeningBalance/views/Index.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AR'] },
  },
  {
    path: '/finance/opening-balance/create',
    name: 'finance-opening-balance-create',
    component: () => import('@/modules/Finance/features/OpeningBalance/views/Form.vue'),
    meta: { requiresAuth: true, roles: ['MANAGER', 'SUPERVISOR', 'AR'] },
  },
  {
    path: '/finance/opening-balance/:id/edit',
    name: 'finance-opening-balance-edit',
    component: () => import('@/modules/Finance/features/OpeningBalance/views/Form.vue'),
    meta: { requiresAuth: true, roles: ['MANAGER', 'SUPERVISOR', 'AR'] },
  },
  { path: '/finance/opening-balance/approval', redirect: { name: 'finance-opening-balance' } },
  {
    path: '/finance/ending-balance',
    name: 'finance-ending-balance',
    component: () => import('@/modules/Finance/features/EndingBalance/views/Index.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AR'] },
  },
  {
    path: '/finance/ending-balance/:id',
    name: 'finance-ending-balance-show',
    component: () => import('@/modules/Finance/features/EndingBalance/views/Detail.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AR'] },
  },
  { path: '/finance/ending-balance/koreksi/approval', redirect: { name: 'finance-ending-balance' } },
  // Halaman konsolidasi laporan
  {
    path: '/finance/laporan',
    name: 'finance-laporan',
    component: () => import('@/modules/Finance/features/Laporan/views/Index.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AR'] },
  },
  // Route dedicated per laporan
  {
    path: '/finance/laporan/jurnal-pic',
    name: 'finance-laporan-jurnal-pic',
    component: () => import('@/modules/Finance/features/Laporan/views/JurnalPic.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AR'] },
  },
  {
    path: '/finance/laporan/rekening-koran',
    name: 'finance-laporan-rekening-koran',
    component: () => import('@/modules/Finance/features/Laporan/views/RekeningKoran.vue'),
    // Laporan global lintas PIC — bukan untuk PIC AR murni.
    meta: { requiresAuth: true, roles: ['ADMIN', 'MANAGER', 'SUPERVISOR'] },
  },
  {
    path: '/finance/laporan/aging',
    name: 'finance-laporan-aging',
    component: () => import('@/modules/Finance/features/Laporan/views/AgingReport.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AR'] },
  },
  {
    path: '/finance/laporan/rekap-klien',
    name: 'finance-laporan-rekap-klien',
    component: () => import('@/modules/Finance/features/Laporan/views/RekapKlien.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AR'] },
  },
  {
    path: '/finance/laporan/riwayat-bayar',
    name: 'finance-laporan-riwayat-bayar',
    component: () => import('@/modules/Finance/features/Laporan/views/PembayaranAr.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AR'] },
  },
  {
    path: '/finance/laporan/mutasi-piutang',
    name: 'finance-laporan-mutasi-piutang',
    component: () => import('@/modules/Finance/features/Laporan/views/MutasiPiutang.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AR'] },
  },
  {
    path: '/finance/laporan/rekap-pembayaran',
    name: 'finance-laporan-rekap-pembayaran',
    component: () => import('@/modules/Finance/features/Laporan/views/RekapPembayaran.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AR'] },
  },
  {
    path: '/finance/laporan/kinerja-ar',
    name: 'finance-laporan-kinerja-ar',
    component: () => import('@/modules/Finance/features/Laporan/views/KinerjaAr.vue'),
    // Laporan komparatif lintas PIC — bukan untuk PIC AR murni.
    meta: { requiresAuth: true, roles: ['ADMIN', 'MANAGER', 'SUPERVISOR'] },
  },
  {
    path: '/finance/laporan/pdm',
    name: 'finance-laporan-pdm',
    component: () => import('@/modules/Finance/features/Laporan/views/PendapatanDiMuka.vue'),
    // Laporan global lintas PIC — bukan untuk PIC AR murni.
    meta: { requiresAuth: true, roles: ['ADMIN', 'MANAGER', 'SUPERVISOR'] },
  },
  // Redirect URL lama ke route dedicated masing-masing
  { path: '/finance/aging-report',     redirect: { name: 'finance-laporan-aging' } },
  { path: '/finance/rekap-klien',      redirect: { name: 'finance-laporan-rekap-klien' } },
  { path: '/finance/pembayaran',       redirect: { name: 'finance-laporan-riwayat-bayar' } },
  { path: '/finance/mutasi-piutang',   redirect: { name: 'finance-laporan-mutasi-piutang' } },
  { path: '/finance/rekening-koran',   redirect: { name: 'finance-laporan-rekening-koran' } },
  { path: '/finance/jatuh-tempo',      redirect: { name: 'finance-laporan' } },
  { path: '/finance/rekap-pembayaran', redirect: { name: 'finance-laporan-rekap-pembayaran' } },
  { path: '/finance/kinerja-ar',       redirect: { name: 'finance-laporan-kinerja-ar' } },
  {
    path: '/finance/export-data',
    name: 'finance-export-data',
    component: () => import('@/modules/Finance/features/ExportData/views/Index.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'MANAGER', 'SUPERVISOR'] },
  },
  {
    path: '/finance/rekonsiliasi-bank',
    name: 'finance-rekonsiliasi-bank',
    component: () => import('@/modules/Finance/features/RekonsiliasiBank/views/Index.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AR', 'AP'] },
  },
  {
    path: '/finance/rekonsiliasi-bank/:id',
    name: 'finance-rekonsiliasi-bank-show',
    component: () => import('@/modules/Finance/features/RekonsiliasiBank/views/Show.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AR', 'AP'] },
  },
  { path: '/finance/jurnal-pic', redirect: { name: 'finance-laporan-jurnal-pic' } },
]
