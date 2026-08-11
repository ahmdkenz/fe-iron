import { computed, ref } from 'vue'

// Module-level singleton: the beforeinstallprompt event only ever fires once
// per page load and must be captured immediately, regardless of how many
// components ask for install state.
const deferredPrompt = ref(null)
const isInstalled = ref(false)
let listenersBound = false

function checkStandalone() {
  const mql = window.matchMedia?.('(display-mode: standalone)')

  return !!mql?.matches || window.navigator.standalone === true
}

function bindListeners() {
  if (listenersBound)
    return

  listenersBound = true
  isInstalled.value = checkStandalone()

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault()
    deferredPrompt.value = event
  })

  window.addEventListener('appinstalled', () => {
    isInstalled.value = true
    deferredPrompt.value = null
  })

  window.matchMedia?.('(display-mode: standalone)')
    .addEventListener?.('change', event => { isInstalled.value = event.matches })
}

export function useInstallPrompt() {
  bindListeners()

  const isIos = computed(() => /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream)
  const canInstall = computed(() => !!deferredPrompt.value && !isInstalled.value)
  const showIosInstructions = computed(() => isIos.value && !isInstalled.value && !canInstall.value)

  async function promptInstall() {
    if (!deferredPrompt.value)
      return null

    deferredPrompt.value.prompt()

    const choice = await deferredPrompt.value.userChoice

    deferredPrompt.value = null

    return choice
  }

  return {
    canInstall,
    isInstalled,
    isIos,
    showIosInstructions,
    promptInstall,
  }
}
