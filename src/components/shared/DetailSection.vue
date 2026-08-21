<template>
  <div class="detail-section">
    <div
      v-if="title"
      class="detail-section-header"
    >
      <div
        v-if="icon"
        class="detail-section-icon-badge"
      >
        <VIcon
          :icon="icon"
          size="16"
        />
      </div>
      <span class="detail-section-title">{{ title }}</span>
      <div class="detail-section-line" />
    </div>
    <div class="detail-section-grid">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  icon: { type: String, default: '' },
})
</script>

<style scoped>
.detail-section + .detail-section {
  margin-top: 24px;
}

.detail-section-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-section-icon-badge {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}

.detail-section-title {
  flex-shrink: 0;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgb(var(--v-theme-on-surface));
}

.detail-section-line {
  flex: 1 1 auto;
  height: 1px;
  background: linear-gradient(90deg, rgba(var(--v-border-color), var(--v-border-opacity)) 0%, transparent 100%);
}

.detail-section-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 16px;
}

@media (max-width: 599.98px) {
  .detail-section-grid {
    grid-template-columns: 1fr;
  }
}
</style>
