<template>
  <VDialog
    v-model="isOpen"
    :max-width="width"
    persistent
  >
    <VCard>
      <VCardTitle
        class="pa-4 d-flex align-center justify-space-between"
        style="background: rgba(var(--v-theme-primary), 0.07); border-left: 4px solid rgb(var(--v-theme-primary))"
      >
        <span class="text-body-1 font-weight-bold">{{ title }}</span>
        <VBtn
          icon
          size="small"
          variant="text"
          @click="isOpen = false"
        >
          <VIcon icon="ri-close-line" />
        </VBtn>
      </VCardTitle>
      <VProgressLinear
        v-if="loading"
        indeterminate
        color="primary"
        height="2"
      />
      <VDivider v-else />
      <VCardText class="pa-4">
        <slot />
      </VCardText>
      <VDivider />
      <VCardActions class="pa-4 justify-end gap-2">
        <slot name="actions">
          <VBtn
            variant="tonal"
            color="secondary"
            :disabled="loading"
            @click="isOpen = false"
          >
            Batal
          </VBtn>
          <VBtn
            color="primary"
            :loading="loading"
            @click="$emit('confirm')"
          >
            <VIcon
              icon="ri-save-line"
              size="16"
              class="me-1"
            />
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
