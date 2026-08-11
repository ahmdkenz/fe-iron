<script setup>
import { useInstallPrompt } from '@/composables/useInstallPrompt'

const { canInstall, showIosInstructions, promptInstall } = useInstallPrompt()

const iosDialogOpen = ref(false)

function handleClick() {
  if (canInstall.value)
    promptInstall()
  else if (showIosInstructions.value)
    iosDialogOpen.value = true
}
</script>

<template>
  <VBtn
    v-if="canInstall || showIosInstructions"
    icon
    variant="text"
    color="default"
    aria-label="Install Aplikasi"
    @click="handleClick"
  >
    <VIcon icon="ri-download-line" size="24" />
    <VTooltip activator="parent" text="Install Aplikasi" />
  </VBtn>

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
