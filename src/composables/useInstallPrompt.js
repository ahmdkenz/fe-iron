import { computed, ref } from 'vue'

// Module-level singleton: the beforeinstallprompt event only ever fires once
// per page load and must be captured immediately, regardless of how many
// components ask for install state.
const deferredPrompt = ref(null)
const isInstalled = ref(false)
let listenersBound = false

const DISMISS_STORAGE_KEY = 'iron:install-prompt:v1:dismissed-until'
const DISMISS_DURATION_MS = 14 * 24 * 60 * 60 * 1000 // 14 hari

function loadDismissedUntil() {
  try {
    const raw = window.localStorage.getItem(DISMISS_STORAGE_KEY)

    return raw ? Number(raw) : 0
  }
  catch {
    // localStorage tidak tersedia (privasi/kuota) - abaikan
    return 0
  }
}

const dismissedUntil = ref(0)

function checkStandalone() {
  const mql = window.matchMedia?.('(display-mode: standalone)')

  return !!mql?.matches || window.navigator.standalone === true
}

function bindListeners() {
  if (listenersBound)
    return

  listenersBound = true
  isInstalled.value = checkStandalone()
  dismissedUntil.value = loadDismissedUntil()

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

// Bind immediately at module-evaluation time (imported eagerly from main.js,
// before the splash-screen delay / app mount) — beforeinstallprompt fires as
// soon as Chrome's installability check passes, which can happen before the
// user logs in and before any component that calls useInstallPrompt() exists.
// A listener attached lazily, from InstallAppToast.vue alone, misses it.
bindListeners()

function dismissInstallPrompt() {
  dismissedUntil.value = Date.now() + DISMISS_DURATION_MS

  try {
    window.localStorage.setItem(DISMISS_STORAGE_KEY, String(dismissedUntil.value))
  }
  catch {
    // localStorage tidak tersedia (privasi/kuota) - abaikan
  }
}

export function useInstallPrompt() {
  bindListeners()

  const isIos = computed(() => /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream)
  const canInstall = computed(() => !!deferredPrompt.value && !isInstalled.value)
  const showIosInstructions = computed(() => isIos.value && !isInstalled.value && !canInstall.value)

  // Boleh ditawarkan lagi 14 hari setelah user terakhir menutup/menolak saran install.
  const canShowPrompt = computed(() =>
    (canInstall.value || showIosInstructions.value)
    && Date.now() > dismissedUntil.value,
  )

  async function promptInstall() {
    if (!deferredPrompt.value)
      return null

    deferredPrompt.value.prompt()

    const choice = await deferredPrompt.value.userChoice

    deferredPrompt.value = null

    // User menolak lewat dialog native browser - snooze juga, sama seperti menutup banner.
    if (choice?.outcome === 'dismissed')
      dismissInstallPrompt()

    return choice
  }

  return {
    canInstall,
    isInstalled,
    isIos,
    showIosInstructions,
    canShowPrompt,
    promptInstall,
    dismissInstallPrompt,
  }
}
