<template>
  <div class="d-flex py-2">
    <span
      class="text-body-2 text-medium-emphasis"
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
  labelWidth: { type: String, default: '130px' },
})
</script>
