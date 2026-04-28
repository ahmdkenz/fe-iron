<script setup>
import { nextTick, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from 'vuetify'
import ScrollToTop from '@core/components/ScrollToTop.vue'
import initCore from '@core/initCore'
import {
  initConfigStore,
  useConfigStore,
} from '@core/stores/config'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { consumeFlashAlert } from '@/utils/flashAlert'
import { hexToRgb } from '@core/utils/colorConverter'

const { global } = useTheme()
const route = useRoute()
const { showAlert } = useSweetAlert()

// ℹ️ Sync current theme with initial loader theme
initCore()
initConfigStore()

const configStore = useConfigStore()

async function flushFlashAlert() {
  const flashAlert = consumeFlashAlert()
  if (!flashAlert)
    return

  await nextTick()
  await showAlert(flashAlert)
}

watch(() => route.fullPath, () => {
  void flushFlashAlert()
}, { flush: 'post' })

onMounted(() => {
  void flushFlashAlert()
})
</script>

<template>
  <VLocaleProvider :rtl="configStore.isAppRTL">
    <!-- ℹ️ This is required to set the background color of active nav link based on currently active global theme's primary -->
    <VApp :style="`--v-global-theme-primary: ${hexToRgb(global.current.value.colors.primary)}`">
      <RouterView />

      <ScrollToTop />
    </VApp>
  </VLocaleProvider>
</template>
