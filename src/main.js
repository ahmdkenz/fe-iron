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
  try {
    await authStore.fetchMe()
  } catch {
    // 401 = no active session, the router guard will redirect to /login
  }

  app.mount('#app')
}

void bootstrap()
