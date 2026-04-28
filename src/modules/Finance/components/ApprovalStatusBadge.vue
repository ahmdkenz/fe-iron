<template>
  <VChip
    :color="statusMap[status]?.color ?? 'secondary'"
    size="small"
    label
  >
    {{ statusMap[status]?.label ?? status }}
  </VChip>
</template>

<script setup>
defineProps({
  status: { type: String, default: '' },
})

const statusMap = {
  PENDING: { color: 'warning', label: 'Menunggu Persetujuan' },
  APPROVED: { color: 'success', label: 'Disetujui' },
  REJECTED: { color: 'error', label: 'Ditolak' },
}
</script>
