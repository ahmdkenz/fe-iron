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
  DRAFT: { color: 'secondary', label: 'Draft' },
  TERKIRIM: { color: 'info',      label: 'Terkirim' },
  SEBAGIAN: { color: 'warning',   label: 'Sebagian' },
  LUNAS: { color: 'success',   label: 'Lunas' },
}
</script>
