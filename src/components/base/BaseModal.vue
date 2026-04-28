<template>
  <VDialog
    v-model="isOpen"
    :max-width="width"
    persistent
  >
    <VCard>
      <VCardTitle class="pa-4 d-flex align-center justify-space-between">
        <span>{{ title }}</span>
        <VBtn
          icon
          size="small"
          variant="text"
          @click="isOpen = false"
        >
          <VIcon icon="ri-close-line" />
        </VBtn>
      </VCardTitle>
      <VDivider />
      <VCardText class="pa-4">
        <slot />
      </VCardText>
      <VDivider />
      <VCardActions class="pa-4 justify-end gap-2">
        <slot name="actions">
          <VBtn
            variant="tonal"
            color="secondary"
            @click="isOpen = false"
          >
            Batal
          </VBtn>
          <VBtn
            color="primary"
            :disabled="loading"
            @click="$emit('confirm')"
          >
            Simpan
          </VBtn>
        </slot>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  width: { type: [String, Number], default: 600 },
  loading: { type: Boolean, default: false },
})
defineEmits(['confirm'])

const isOpen = defineModel({ type: Boolean, default: false })
</script>
