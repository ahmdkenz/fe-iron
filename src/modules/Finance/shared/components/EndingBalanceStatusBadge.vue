<template>
  <span class="d-inline-flex align-center gap-2">
    <VIcon
      :icon="statusMap[status]?.icon ?? 'ri-question-line'"
      :color="statusMap[status]?.color ?? 'warning'"
      size="18"
      :class="statusMap[status]?.anim"
    />
    <span
      class="text-body-2 font-weight-medium"
      :class="`text-${statusMap[status]?.color ?? 'warning'}`"
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
  DRAFT: { color: 'warning', label: 'Draft', icon: 'ri-pencil-line', anim: 'badge-icon-wiggle' },
  LOCKED: { color: 'success', label: 'Locked', icon: 'ri-lock-line', anim: 'badge-icon-lock' },
}
</script>

<style scoped>
@keyframes badge-wiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
}

@keyframes badge-lock {
  0%, 40% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(0.85) rotate(-6deg); }
  60% { transform: scale(1.08) rotate(4deg); }
  70%, 100% { transform: scale(1) rotate(0deg); }
}

.badge-icon-wiggle {
  animation: badge-wiggle 1.6s ease-in-out infinite;
  transform-origin: center;
}

.badge-icon-lock {
  animation: badge-lock 2.4s ease-in-out infinite;
  transform-origin: center;
}

@media (prefers-reduced-motion: reduce) {
  .badge-icon-wiggle,
  .badge-icon-lock {
    animation: none;
  }
}
</style>
