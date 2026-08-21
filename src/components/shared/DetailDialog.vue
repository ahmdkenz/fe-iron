<template>
  <VDialog
    :model-value="modelValue"
    :width="dialogWidth"
    :fullscreen="xs"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <VCard class="detail-card overflow-hidden">
      <div
        class="detail-shell"
        :class="[`detail-shell--${size}`, { 'detail-shell--mobile': xs }]"
      >
        <div class="detail-sidebar">
          <div class="detail-sidebar-content">
            <span class="detail-eyebrow">{{ title }}</span>
            <div class="detail-hero">
              <slot name="hero" />
            </div>

            <div
              v-if="status !== null"
              class="detail-meta-status-wrap"
            >
              <StatusChip :active="status" />
            </div>

            <div
              v-if="hasAudit"
              class="detail-meta"
            >
              <div
                v-if="createdBy || createdAt"
                class="detail-meta-item detail-meta-item--first"
              >
                <span class="detail-meta-label">Dibuat</span>
                <span class="detail-meta-value">{{ createdBy || '-' }}</span>
                <span
                  v-if="createdAt"
                  class="detail-meta-date"
                >{{ createdAt }}</span>
              </div>
              <div
                v-if="updatedBy || updatedAt"
                class="detail-meta-item"
              >
                <span class="detail-meta-label">Diubah</span>
                <span class="detail-meta-value">{{ updatedBy || '-' }}</span>
                <span
                  v-if="updatedAt"
                  class="detail-meta-date"
                >{{ updatedAt }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-content">
          <div class="detail-content-header">
            <span class="detail-content-title">Informasi Lengkap</span>
            <VBtn
              icon
              variant="outlined"
              size="small"
              class="detail-close-btn"
              @click="$emit('update:modelValue', false)"
            >
              <VIcon
                icon="ri-close-line"
                size="16"
              />
            </VBtn>
          </div>
          <div class="detail-content-body">
            <slot />
          </div>
        </div>
      </div>
    </VCard>
  </VDialog>
</template>

<script setup>
import { computed } from 'vue'
import { useDisplay } from 'vuetify'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  title: { type: String, required: true },
  size: { type: String, default: 'md' },
  status: { type: Boolean, default: null },
  createdBy: { type: String, default: '' },
  updatedBy: { type: String, default: '' },
  createdAt: { type: String, default: '' },
  updatedAt: { type: String, default: '' },
})
defineEmits(['update:modelValue'])

const { xs } = useDisplay()

const dialogWidth = computed(() => (props.size === 'lg' ? 960 : 760))

const hasAudit = computed(() => (
  !!props.createdBy || !!props.updatedBy || !!props.createdAt || !!props.updatedAt
))
</script>

<style scoped>
.detail-card {
  position: relative;
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(var(--v-border-color), var(--v-border-opacity));
}

.detail-shell {
  display: flex;
  max-height: 85vh;
  position: relative;
}

.detail-shell--mobile {
  flex-direction: column;
  max-height: 100dvh;
  height: 100%;
}

/* ─── Sidebar ─────────────────────────────────────────────────────────── */
.detail-sidebar {
  flex-shrink: 0;
  width: 220px;
  position: relative;
  overflow-y: auto;
  background: rgb(var(--v-theme-primary));
}

.detail-shell--lg .detail-sidebar {
  width: 260px;
}

.detail-shell--mobile .detail-sidebar {
  width: 100%;
  flex-shrink: 0;
  overflow: visible;
}

.detail-sidebar-content {
  position: relative;
  min-height: 100%;
  padding: 40px 20px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: #fff;
}

.detail-shell--mobile .detail-sidebar-content {
  padding: 28px 20px 20px;
}

.detail-eyebrow {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.75);
  margin-bottom: 14px;
}

.detail-hero {
  color: #fff;
}

.detail-hero :deep(.v-avatar) {
  border: 3px solid rgba(255, 255, 255, 0.85);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
}

.detail-meta {
  width: 100%;
  margin-top: auto;
  background: rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  padding: 14px 16px;
}

.detail-meta-status-wrap {
  display: inline-flex;
  padding: 5px 14px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 24px;
}

.detail-meta-status-wrap :deep(.text-success),
.detail-meta-status-wrap :deep(.text-error) {
  color: #fff !important;
}

.detail-meta-status-wrap :deep(.status-chip-dot.bg-success) {
  box-shadow: 0 0 8px rgb(var(--v-theme-success));
}

.detail-meta-status-wrap :deep(.status-chip-dot.bg-error) {
  box-shadow: 0 0 8px rgb(var(--v-theme-error));
}

.detail-meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-meta-item--first {
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.25);
}

.detail-meta-label {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.65);
}

.detail-meta-value {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #fff;
}

.detail-meta-date {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.7);
}

/* ─── Content ─────────────────────────────────────────────────────────── */
.detail-content {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.detail-content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.detail-content-title {
  font-size: 0.8125rem;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface), 0.6);
}

.detail-close-btn {
  border-radius: 8px !important;
  width: 32px !important;
  height: 32px !important;
}

.detail-content-body {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 24px 28px;
}

.detail-content-body::-webkit-scrollbar {
  width: 6px;
}

.detail-content-body::-webkit-scrollbar-track {
  background: transparent;
}

.detail-content-body::-webkit-scrollbar-thumb {
  background: rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 10px;
}

.detail-content-body::-webkit-scrollbar-thumb:hover {
  background: rgb(var(--v-theme-primary));
}

.detail-shell--mobile .detail-content-body {
  padding: 20px;
}

@media (max-width: 599.98px) {
  .detail-sidebar {
    width: 100%;
  }
}
</style>
