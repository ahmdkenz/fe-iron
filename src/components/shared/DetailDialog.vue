<template>
  <VDialog
    :model-value="modelValue"
    width="500"
    scrollable
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <VCard class="overflow-hidden">
      <!-- Gradient band (background only) -->
      <div class="detail-band">
        <VBtn
          icon
          variant="text"
          size="small"
          class="detail-band-close"
          @click="$emit('update:modelValue', false)"
        >
          <VIcon
            icon="ri-close-line"
            size="20"
            color="white"
          />
        </VBtn>
      </div>

      <!-- Profile floating section (overlaps band) -->
      <div class="detail-profile text-center">
        <slot name="hero" />
      </div>

      <!-- Section label -->
      <div class="d-flex align-center gap-2 px-5 py-2">
        <VIcon
          icon="ri-information-line"
          color="primary"
          size="15"
        />
        <span class="text-caption font-weight-semibold text-medium-emphasis text-uppercase detail-label">
          {{ title }}
        </span>
      </div>
      <VDivider />

      <!-- Detail rows -->
      <VCardText class="pa-0">
        <slot />
      </VCardText>
    </VCard>
  </VDialog>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, required: true },
  title: { type: String, required: true },
})
defineEmits(['update:modelValue'])
</script>

<style scoped>
.detail-band {
  height: 110px;
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgba(var(--v-theme-primary), 0.7) 100%);
  position: relative;
  flex-shrink: 0;
}

.detail-band-close {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0.85;
  transition: opacity 0.2s;
}

.detail-band-close:hover {
  opacity: 1;
}

.detail-profile {
  margin-top: -46px;
  padding: 0 24px 16px;
}

/* Avatar inside hero slot: white ring + shadow so it floats above the band */
.detail-profile :deep(.v-avatar) {
  border: 4px solid rgb(var(--v-theme-surface));
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.detail-label {
  letter-spacing: 0.08em;
}
</style>
