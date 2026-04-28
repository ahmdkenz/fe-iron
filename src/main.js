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

// Create vue app
const app = createApp(App)

// Register plugins
registerPlugins(app)

const authStore = useAuthStore(store)

app.mount('#app')

async function bootstrap() {
  if (authStore.token) {
    try {
      await authStore.fetchMe()
    } catch {
      authStore.logout()
    }
  }

}

void bootstrap()
