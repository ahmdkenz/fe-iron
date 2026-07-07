<script setup>
import { useConfigStore } from '@core/stores/config'

const { y } = useWindowScroll()
const configStore = useConfigStore()

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}
</script>

<template>
  <VScaleTransition
    style="transform-origin: center;"
    class="scroll-to-top d-print-none"
    :class="{ 'scroll-to-top--above-mobile-nav': configStore.isLessThanOverlayNavBreakpoint }"
  >
    <VBtn
      v-show="y > 200"
      icon
      density="comfortable"
      @click="scrollToTop"
    >
      <VIcon
        size="22"
        icon="ri-arrow-up-line"
      />
    </VBtn>
  </VScaleTransition>
</template>

<style lang="scss">
.scroll-to-top {
  position: fixed !important;

  // To keep button on top of v-layout. E.g. Email app
  z-index: 999;
  inset-block-end: 5%;
  inset-inline-end: 25px;

  // ℹ️ On mobile, MobileBottomNav sits fixed at the very bottom (60px tall)
  // with a higher z-index, so the default 5% offset gets buried under it.
  // Lift the button above the bar and above its z-index.
  &--above-mobile-nav {
    z-index: 1003;
    inset-block-end: calc(60px + env(safe-area-inset-bottom, 0) + 16px);
  }
}
</style>
