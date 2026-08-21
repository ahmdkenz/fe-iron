<template>
  <div
    class="detail-field"
    :class="{ 'detail-field--span': span }"
  >
    <span class="detail-field-label">{{ label }}</span>
    <span
      class="detail-field-value"
      :class="{ 'detail-field-value--empty': isEmpty }"
    >
      <slot>{{ value || '-' }}</slot>
    </span>
  </div>
</template>

<script setup>
import { computed, useSlots } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], default: '' },
  span: { type: Boolean, default: false },
})

const slots = useSlots()
const isEmpty = computed(() => !slots.default && !props.value)
</script>

<style scoped>
.detail-field {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 20px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  min-width: 0;
  overflow: hidden;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.detail-field::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: rgb(var(--v-theme-primary));
  opacity: 0;
  transition: opacity 0.2s ease;
}

.detail-field:hover {
  background: rgba(var(--v-theme-on-surface), 0.055);
  border-color: rgba(var(--v-theme-primary), 0.4);
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
}

.detail-field:hover::before {
  opacity: 1;
}

.detail-field--span {
  grid-column: 1 / -1;
}

.detail-field-label {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgb(var(--v-theme-on-surface), 0.6);
}

.detail-field-value {
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.4;
  color: rgb(var(--v-theme-on-surface));
  word-break: break-word;
}

.detail-field-value--empty {
  font-weight: 400;
  font-style: italic;
  color: rgb(var(--v-theme-on-surface), 0.38);
}
</style>
