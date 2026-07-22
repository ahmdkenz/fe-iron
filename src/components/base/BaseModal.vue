<template>
  <VDialog
    v-model="isOpen"
    :max-width="width"
    :content-class="mobile ? 'base-modal-mobile' : undefined"
    scrollable
    persistent
  >
    <VCard class="base-modal-card">
      <VCardTitle
        class="pa-4 d-flex align-center justify-space-between ga-2"
        style="background: rgba(var(--v-theme-primary), 0.07); border-left: 4px solid rgb(var(--v-theme-primary))"
      >
        <span class="text-body-1 font-weight-bold text-truncate">{{ title }}</span>
        <div class="d-flex ga-1 flex-shrink-0">
          <VBtn
            v-if="minimizable"
            icon
            size="small"
            variant="text"
            @click="$emit('minimize')"
          >
            <VIcon icon="ri-subtract-line" />
          </VBtn>
          <VBtn
            icon
            size="small"
            variant="text"
            @click="isOpen = false"
          >
            <VIcon icon="ri-close-line" />
          </VBtn>
        </div>
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
      <VCardActions class="pa-4 justify-end gap-2 flex-wrap">
        <slot name="actions">
          <AppActionButton
            action="batalkan"
            :disabled="loading"
            @click="isOpen = false"
          />
          <AppActionButton
            :action="confirmAction"
            :label="confirmLabel"
            :icon="confirmIcon"
            :loading="loading"
            :disabled="disabled"
            @click="$emit('confirm')"
          />
        </slot>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup>
import { useDisplay } from 'vuetify'

defineProps({
  title: { type: String, default: '' },
  width: { type: [String, Number], default: 600 },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  minimizable: { type: Boolean, default: false },
  confirmAction: { type: String, default: 'simpan' },
  confirmLabel: { type: String, default: '' },
  confirmIcon: { type: String, default: '' },
})
defineEmits(['confirm', 'minimize'])

const isOpen = defineModel({ type: Boolean, default: false })
// `xs` (<600px) matches the phone breakpoint used elsewhere (BaseTable's
// mobileCards), not Vuetify's broader `mobile` flag (true up to 1280px).
const { xs: mobile } = useDisplay()
</script>

<style scoped>
:deep(.base-modal-mobile) {
  margin: 8px;
  max-inline-size: calc(100% - 16px);
}

:deep(.base-modal-mobile) .base-modal-card {
  max-block-size: 90dvh;
}

/* Ringkas padding modal di ponsel supaya lebih banyak ruang untuk isi form.
   Hanya aktif untuk dialog mobile (<600px) → tampilan desktop tidak berubah. */
:deep(.base-modal-mobile) .base-modal-card > .v-card-title,
:deep(.base-modal-mobile) .base-modal-card > .v-card-text,
:deep(.base-modal-mobile) .base-modal-card > .v-card-actions {
  padding: 12px !important;
}

/* Hero banner form (opt-in lewat kelas .mgmt-hero) ikut diringkas di ponsel. */
:deep(.base-modal-mobile) .mgmt-hero {
  margin-block-end: 12px !important;
  padding: 10px !important;
}
</style>
