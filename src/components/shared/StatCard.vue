<template>
  <VRow class="mb-4">
    <VCol
      v-for="card in cards"
      :key="card.key"
      cols="12"
      sm="6"
      md="3"
    >
      <div
        class="glass-stat"
        :style="{ '--stat-c': `var(--v-theme-${card.color ?? 'primary'})` }"
      >
        <div class="glass-stat-icon">
          <VIcon :icon="card.icon ?? 'ri-file-list-3-line'" />
        </div>
        <div class="min-width-0">
          <div class="glass-stat-label">
            {{ card.label }}
          </div>
          <div class="glass-stat-value">
            {{ card.value ?? '-' }}
          </div>
          <div
            v-if="card.sub"
            class="text-caption"
            :class="card.subColor ? `text-${card.subColor}` : 'text-medium-emphasis'"
          >
            {{ card.sub }}
          </div>
        </div>
      </div>
    </VCol>
  </VRow>
</template>

<script setup>
defineProps({
  cards: { type: Array, default: () => [] },
})
</script>
