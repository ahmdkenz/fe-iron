<script setup>
import { useDisplay } from 'vuetify'
import { useUserLocation } from '@/composables/useUserLocation'
import { useWibClock } from '@/composables/useWibClock'

const { timeLabel } = useWibClock()
const { locationLabel } = useUserLocation()
const { xs: isMobile } = useDisplay()
</script>

<template>
  <div
    v-if="!isMobile"
    class="header-status-pill d-flex align-center"
  >
    <VIcon
      icon="ri-time-line"
      size="16"
      color="primary"
      class="me-1"
    />
    <span class="text-body-2 font-weight-medium">{{ timeLabel }} WIB</span>

    <Transition name="fade">
      <span
        v-if="locationLabel"
        class="d-flex align-center"
      >
        <span class="header-status-pill__divider" />
        <VIcon
          icon="ri-map-pin-line"
          size="16"
          color="primary"
          class="me-1"
        />
        <span class="text-body-2 font-weight-medium">{{ locationLabel }}</span>
      </span>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.header-status-pill {
  padding-block: 6px;
  padding-inline: 14px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  margin-inline-end: 12px;
  transition: background-color 0.2s ease;

  &:hover {
    background: rgba(var(--v-theme-primary), 0.08);
  }
}

.header-status-pill__divider {
  inline-size: 1px;
  block-size: 14px;
  background: rgba(var(--v-theme-on-surface), 0.16);
  margin-inline: 10px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
