<template>
  <span class="d-inline-flex align-center gap-2">
    <VIcon
      :icon="statusMap[status]?.icon ?? 'ri-question-line'"
      :color="statusMap[status]?.color ?? 'secondary'"
      size="18"
      :class="statusMap[status]?.anim"
    />
    <span
      class="text-body-2 font-weight-medium"
      :class="`text-${statusMap[status]?.color ?? 'secondary'}`"
    >
      {{ statusMap[status]?.label ?? status }}
    </span>
  </span>
</template>

<script setup>
defineProps({
  status: { type: String, default: '' },
})

const statusMap = {
  DRAFT: { color: 'secondary', label: 'Draft', icon: 'ri-pencil-line', anim: 'badge-icon-wiggle' },
  TERKIRIM: { color: 'info', label: 'Terkirim', icon: 'ri-send-plane-line', anim: 'badge-icon-fly' },
  SEBAGIAN: { color: 'warning', label: 'Sebagian', icon: 'ri-loader-4-line', anim: 'badge-icon-spin' },
  LUNAS: { color: 'success', label: 'Lunas', icon: 'ri-checkbox-circle-line', anim: 'badge-icon-pop' },
}
</script>

<style scoped>
@keyframes badge-wiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
}

@keyframes badge-fly {
  0% { transform: translate(0, 0); opacity: 1; }
  60% { transform: translate(5px, -5px); opacity: 0.35; }
  61% { transform: translate(-5px, 5px); opacity: 0.35; }
  100% { transform: translate(0, 0); opacity: 1; }
}

@keyframes badge-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes badge-pop {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.18); }
}

.badge-icon-wiggle {
  animation: badge-wiggle 1.6s ease-in-out infinite;
  transform-origin: center;
}

.badge-icon-fly {
  animation: badge-fly 1.8s ease-in-out infinite;
}

.badge-icon-spin {
  animation: badge-spin 1.1s linear infinite;
  transform-origin: center;
}

.badge-icon-pop {
  animation: badge-pop 1.6s ease-in-out infinite;
  transform-origin: center;
}

@media (prefers-reduced-motion: reduce) {
  .badge-icon-wiggle,
  .badge-icon-fly,
  .badge-icon-spin,
  .badge-icon-pop {
    animation: none;
  }
}
</style>
