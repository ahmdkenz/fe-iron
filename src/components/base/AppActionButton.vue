<template>
  <VBtn
    v-bind="$attrs"
    :color="resolvedColor"
    :variant="resolvedVariant"
    :loading="loading"
    :disabled="disabled"
  >
    <VIcon
      v-if="resolvedIcon"
      :icon="resolvedIcon"
      size="16"
      class="me-1"
    />
    <slot>{{ resolvedLabel }}</slot>
  </VBtn>
</template>

<script setup>
const ACTION_MAP = {
  simpan: { color: 'primary', variant: 'flat', icon: 'ri-save-line', label: 'Simpan' },
  ajukan: { color: 'primary', variant: 'flat', icon: 'ri-send-plane-2-line', label: 'Ajukan' },
  cocokkan: { color: 'primary', variant: 'flat', icon: 'ri-link-m', label: 'Cocokkan' },
  lanjutkan: { color: 'primary', variant: 'flat', icon: 'ri-arrow-right-line', label: 'Lanjutkan' },
  gunakan: { color: 'primary', variant: 'flat', icon: 'ri-exchange-dollar-line', label: 'Gunakan' },
  batalkan: { color: 'error', variant: 'tonal', icon: 'ri-close-line', label: 'Batalkan' },
  hapus: { color: 'error', variant: 'flat', icon: 'ri-delete-bin-line', label: 'Hapus Data' },
  custom: { color: 'primary', variant: 'flat', icon: '', label: '' },
}

const props = defineProps({
  action: { type: String, default: 'custom' },
  label: { type: String, default: '' },
  icon: { type: String, default: '' },
  color: { type: String, default: '' },
  variant: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const base = computed(() => ACTION_MAP[props.action] ?? ACTION_MAP.custom)
const resolvedColor = computed(() => props.color || base.value.color)
const resolvedVariant = computed(() => props.variant || base.value.variant)
const resolvedIcon = computed(() => props.icon || base.value.icon)
const resolvedLabel = computed(() => props.label || base.value.label)
</script>
