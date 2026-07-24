<template>
  <span class="d-inline-flex align-center gap-2">
    <VIcon
      :icon="statusMap[status]?.icon ?? 'ri-question-line'"
      :color="statusMap[status]?.color ?? 'secondary'"
      size="18"
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
  NEW: { color: 'secondary', label: 'Baru', icon: 'ri-inbox-line' },
  READY_FOR_AP: { color: 'info', label: 'Siap Dikonversi', icon: 'ri-checkbox-circle-line' },
  CONVERTED: { color: 'success', label: 'Sudah Jadi Tagihan', icon: 'ri-file-check-line' },
  IGNORED: { color: 'secondary', label: 'Diabaikan', icon: 'ri-close-circle-line' },
}
</script>
