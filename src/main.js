import { createApp } from 'vue'
import App from '@/App.vue'
import { registerPlugins } from '@core/utils/plugins'
import { store } from '@/plugins/2.pinia'
import { useAuthStore } from '@/stores/auth.store'

// Styles
import '@core/scss/template/index.scss'
import '@styles/styles.scss'
import 'sweetalert2/dist/sweetalert2.min.css'
import './styles/sweetalert.scss'

const app = createApp(App)
registerPlugins(app)

const authStore = useAuthStore(store)

// Always verify session state before mounting.
// This ensures the router guard has accurate auth state on first load/refresh,
// preventing a flash-redirect to login for authenticated users.
async function bootstrap() {
  // Run auth check and minimum splash duration in parallel.
  // The splash must show for at least 2.8s so the decrypt + progress animations
  // complete fully before the loader dismisses.
  await Promise.allSettled([
    authStore.fetchMe().catch(() => {}),
    new Promise(resolve => setTimeout(resolve, 2800)),
  ])

  app.mount('#app')

  if (typeof window.__ironLoadingComplete === 'function') {
    window.__ironLoadingComplete()
  }
}

void bootstrap()
