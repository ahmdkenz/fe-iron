<template>
  <span class="d-inline-flex align-center gap-2">
    <VIcon
      :icon="statusMap[status]?.icon ?? 'ri-question-line'"
      :color="statusMap[status]?.color ?? 'secondary'"
      size="18"
    />
    <span class="text-body-2 font-weight-medium" :class="`text-${statusMap[status]?.color ?? 'secondary'}`">
      {{ statusMap[status]?.label ?? status }}
    </span>
  </span>
</template>

<script setup>
defineProps({
  status: { type: String, default: '' },
})

const statusMap = {
  DRAFT: { color: 'secondary', label: 'Draft', icon: 'ri-pencil-line' },
  DITERIMA: { color: 'info', label: 'Diterima', icon: 'ri-inbox-archive-line' },
  SEBAGIAN: { color: 'warning', label: 'Sebagian', icon: 'ri-loader-4-line' },
  LUNAS: { color: 'success', label: 'Lunas', icon: 'ri-checkbox-circle-line' },
}
</script>
