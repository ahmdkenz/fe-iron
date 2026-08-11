import { useRegisterSW } from 'virtual:pwa-register/vue'

// Module-level singleton: useRegisterSW() calls navigator.serviceWorker.register
// internally, so it must only run once even if this composable is used from
// multiple components.
let singleton = null

export function usePwaUpdate() {
  if (!singleton) {
    singleton = useRegisterSW({
      immediate: true,
      onRegisterError(error) {
        console.error('[pwa] service worker registration failed', error)
      },
    })
  }

  return singleton
}
