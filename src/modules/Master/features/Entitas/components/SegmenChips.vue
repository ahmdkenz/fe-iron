<template>
  <div
    v-if="segmen?.length"
    class="d-flex gap-1 flex-wrap"
  >
    <VChip
      v-for="s in segmen"
      :key="s"
      :color="s === 'B2B' ? 'info' : 'primary'"
      size="small"
      variant="tonal"
      label
    >
      {{ s }}
    </VChip>
  </div>
  <span v-else>-</span>
</template>

<script setup>
defineProps({
  segmen: { type: Array, default: () => [] },
})
</script>
