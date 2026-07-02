<template>
  <span class="d-inline-flex align-center gap-2">
    <span
      class="status-chip-dot flex-shrink-0"
      :class="active ? 'bg-success' : 'bg-error'"
    />
    <span
      class="text-body-2 font-weight-medium"
      :class="active ? 'text-success' : 'text-error'"
    >
      {{ active ? 'Aktif' : 'Nonaktif' }}
    </span>
  </span>
</template>

<script setup>
defineProps({
  active: {
    type: Boolean,
    default: false,
  },
})
</script>

<style scoped lang="scss">
.status-chip-dot {
  inline-size: 8px;
  block-size: 8px;
  border-radius: 50%;
  animation: status-chip-pulse 1.8s ease-in-out infinite;
}

@keyframes status-chip-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

@media (prefers-reduced-motion: reduce) {
  .status-chip-dot {
    animation: none;
  }
}
</style>
