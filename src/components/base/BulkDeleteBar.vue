<template>
  <Transition name="bulk-bar">
    <div
      v-if="selected.length > 0"
      class="bulk-bar-root"
      :class="{ 'bulk-bar-above-nav': configStore.isLessThanOverlayNavBreakpoint }"
    >
      <VCard
        elevation="8"
        rounded="pill"
      >
        <VCardText class="py-2 px-4">
          <div class="d-flex flex-wrap align-center justify-center gap-3">
            <span class="text-body-2 font-weight-medium text-no-wrap">
              {{ selected.length }} data dipilih
            </span>
            <VDivider
              vertical
              style="height: 20px;"
              class="d-none d-sm-block"
            />
            <AppActionButton
              action="hapus"
              size="small"
              :compact="xs"
              @click="$emit('delete')"
            />
            <AppActionButton
              action="custom"
              icon="ri-close-line"
              label="Batal Pilih"
              color="secondary"
              variant="text"
              size="small"
              :compact="xs"
              @click="$emit('clear')"
            />
          </div>
        </VCardText>
      </VCard>
    </div>
  </Transition>
</template>

<script setup>
import { useConfigStore } from '@core/stores/config'
import { useDisplay } from 'vuetify'

defineProps({
  selected: { type: Array, default: () => [] },
})
defineEmits(['delete', 'clear'])

const configStore = useConfigStore()
const { xs } = useDisplay()
</script>

<style scoped>
.bulk-bar-root {
  position: fixed;
  z-index: 2000;
  inset-inline-start: 50%;
  inset-block-end: 24px;
  max-inline-size: calc(100vw - 32px);
  transform: translateX(-50%);
}

/* Clear the fixed MobileBottomNav (60px + safe-area) so the bar stays tappable. */
.bulk-bar-root.bulk-bar-above-nav {
  inset-block-end: calc(60px + env(safe-area-inset-bottom, 0px) + 16px);
}

.bulk-bar-enter-active,
.bulk-bar-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.bulk-bar-enter-from,
.bulk-bar-leave-to {
  transform: translateX(-50%) translateY(16px);
  opacity: 0;
}
</style>
