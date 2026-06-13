<template>
  <div class="detail-row-item d-flex align-start px-5 py-3">
    <span
      class="text-body-2 text-medium-emphasis flex-shrink-0"
      :style="{ minWidth: labelWidth }"
    >{{ label }}</span>
    <span class="text-body-2 font-weight-medium">
      <slot>{{ value || '-' }}</slot>
    </span>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], default: '' },
  labelWidth: { type: String, default: '140px' },
})
</script>

<style scoped>
.detail-row-item {
  border-bottom: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.detail-row-item:last-child {
  border-bottom: none;
}
</style>
