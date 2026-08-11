<script setup>
import { usePwaUpdate } from '@/composables/usePwaUpdate'

const { needRefresh, updateServiceWorker } = usePwaUpdate()

function reloadNow() {
  updateServiceWorker(true)
}

function dismiss() {
  needRefresh.value = false
}
</script>

<template>
  <VSnackbar
    :model-value="needRefresh"
    :timeout="-1"
    location="bottom"
    color="surface"
    @update:model-value="val => { if (!val) dismiss() }"
  >
    Versi baru IRON tersedia.

    <template #actions>
      <VBtn variant="text" color="primary" @click="reloadNow">
        Update
      </VBtn>
      <VBtn icon variant="text" size="small" aria-label="Tutup" @click="dismiss">
        <VIcon icon="ri-close-line" />
      </VBtn>
    </template>
  </VSnackbar>
</template>
