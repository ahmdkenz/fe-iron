<script setup>
import { ref } from 'vue'
import { useInstallPrompt } from '@/composables/useInstallPrompt'
import { usePwaUpdate } from '@/composables/usePwaUpdate'

const { canInstall, showIosInstructions, canShowPrompt, promptInstall, dismissInstallPrompt } = useInstallPrompt()
const { needRefresh } = usePwaUpdate()

const iosDialogOpen = ref(false)

function handleInstallClick() {
  if (canInstall.value)
    promptInstall()
  else if (showIosInstructions.value)
    iosDialogOpen.value = true
}
</script>

<template>
  <VSnackbar
    :model-value="canShowPrompt && !needRefresh"
    :timeout="-1"
    location="top"
    color="surface"
    class="install-app-toast"
    @update:model-value="val => { if (!val) dismissInstallPrompt() }"
  >
    Install aplikasi IRON untuk akses lebih cepat.

    <template #actions>
      <VBtn variant="text" color="primary" @click="handleInstallClick">
        Install
      </VBtn>
      <VBtn icon variant="text" size="small" aria-label="Tutup" @click="dismissInstallPrompt">
        <VIcon icon="ri-close-line" />
      </VBtn>
    </template>
  </VSnackbar>

  <VDialog v-model="iosDialogOpen" max-width="380">
    <VCard title="Install Aplikasi IRON">
      <VCardText>
        Ketuk tombol <strong>Share</strong>
        <VIcon icon="ri-share-forward-line" size="18" class="mx-1" />
        di Safari, lalu pilih <strong>"Add to Home Screen"</strong>.
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn variant="text" @click="iosDialogOpen = false">
          Tutup
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style lang="scss" scoped>
@use "@configured-variables" as variables;

// Header aplikasi pakai position: sticky custom (bukan VAppBar Vuetify), jadi
// --v-layout-top tidak otomatis kehitung. Turunkan manual sebesar tinggi
// navbar supaya toast muncul tepat di bawah header, bukan menimpanya
// (z-index snackbar Vuetify jauh lebih tinggi dari header).
.install-app-toast {
  padding-block-start: calc(#{variables.$layout-vertical-nav-navbar-height} + env(safe-area-inset-top, 0px)) !important;
}
</style>
