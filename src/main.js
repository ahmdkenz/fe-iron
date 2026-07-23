import { createApp } from 'vue'
import App from '@/App.vue'
import { registerPlugins } from '@core/utils/plugins'
import { store } from '@/plugins/2.pinia'
import { ensureCsrfCookie } from '@/utils/axios'

// Styles
import '@core/scss/template/index.scss'
import '@styles/styles.scss'

const app = createApp(App)
registerPlugins(app)

// Auth state itself is resolved by the router guard (per-route), not here —
// calling /auth/me unconditionally on every load would 401 on the login page
// before any session/cookie exists. See plugins/1.router/index.js.
async function bootstrap() {
  // Run CSRF priming and minimum splash duration in parallel.
  // Minimum 1.2s ensures decrypt + progress animations complete before loader dismisses.
  await Promise.allSettled([
    ensureCsrfCookie(),
    new Promise(resolve => setTimeout(resolve, 2400)),
  ])

  app.mount('#app')

  if (typeof window.__ironLoadingComplete === 'function') {
    window.__ironLoadingComplete()
  }
}

void bootstrap()
