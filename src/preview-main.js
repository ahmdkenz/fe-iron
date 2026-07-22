import { createApp } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import vuetifyPlugin from '@/plugins/vuetify'
import LaporanIndex from '@/modules/Finance/features/Laporan/views/Index.vue'
import '@core/scss/template/index.scss'
import '@styles/styles.scss'

const dummy = { template: '<div />' }

const routes = [
  { path: '/', name: 'dashboard', component: dummy },
  { path: '/jurnal-pic', name: 'finance-laporan-jurnal-pic', component: dummy },
  { path: '/rekening-koran', name: 'finance-laporan-rekening-koran', component: dummy },
  { path: '/aging', name: 'finance-laporan-aging', component: dummy },
  { path: '/rekap-klien', name: 'finance-laporan-rekap-klien', component: dummy },
  { path: '/riwayat-bayar', name: 'finance-laporan-riwayat-bayar', component: dummy },
  { path: '/mutasi-piutang', name: 'finance-laporan-mutasi-piutang', component: dummy },
  { path: '/rekap-pembayaran', name: 'finance-laporan-rekap-pembayaran', component: dummy },
  { path: '/kinerja-ar', name: 'finance-laporan-kinerja-ar', component: dummy },
  { path: '/pdm', name: 'finance-laporan-pdm', component: dummy },
]

const router = createRouter({ history: createMemoryHistory(), routes })

const app = createApp({
  components: { LaporanIndex },
  template: '<div style="padding: 24px; max-width: 1440px; margin: 0 auto;"><LaporanIndex /></div>',
})

app.use(router)
vuetifyPlugin(app)
app.mount('#app')
