import { createApp } from 'vue'
import App from '@/App.vue'
import { registerPlugins } from '@core/utils/plugins'
import { store } from '@/plugins/2.pinia'
import { useAuthStore } from '@/stores/auth.store'
import { ensureCsrfCookie } from '@/utils/axios'

// Styles
import '@core/scss/template/index.scss'
import '@styles/styles.scss'

const app = createApp(App)
registerPlugins(app)

const authStore = useAuthStore(store)

// Always verify session state before mounting.
// This ensures the router guard has accurate auth state on first load/refresh,
// preventing a flash-redirect to login for authenticated users.
async function bootstrap() {
  // Run auth check and minimum splash duration in parallel.
  // Minimum 1.2s ensures decrypt + progress animations complete before loader dismisses.
  await Promise.allSettled([
    ensureCsrfCookie(),
    authStore.initAuth(),
    new Promise(resolve => setTimeout(resolve, 2400)),
  ])

  app.mount('#app')

  if (typeof window.__ironLoadingComplete === 'function') {
    window.__ironLoadingComplete()
  }
}

void bootstrap()
