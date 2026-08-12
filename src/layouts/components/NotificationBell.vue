<script setup>
import { useDisplay } from 'vuetify'
import { useConfigStore } from '@core/stores/config'
import { useSystemNotificationStore } from '@/stores/system-notification.store'
import NotificationPanel from '@/layouts/components/NotificationPanel.vue'

const store = useSystemNotificationStore()
const configStore = useConfigStore()
const { xs: isMobile } = useDisplay()

const isMenuOpen = ref(false)

watch(isMenuOpen, async val => {
  if (!val)
    return

  await store.ensureLoaded()
})
</script>

<template>
  <VBadge
    :content="store.bellBadge"
    :model-value="!!store.bellBadge"
    color="error"
    offset-x="4"
    offset-y="4"
    class="me-3"
  >
    <!-- Mobile: bell membuka halaman notifikasi penuh, bukan popup -->
    <VBtn
      v-if="isMobile"
      icon
      variant="text"
      color="default"
      aria-label="Notifikasi"
      :to="{ name: 'notifications' }"
    >
      <VIcon icon="ri-notification-3-line" size="24" />
    </VBtn>

    <!-- Desktop: tetap popup VMenu seperti sebelumnya -->
    <VMenu
      v-else
      v-model="isMenuOpen"
      :width="configStore.isLessThanOverlayNavBreakpoint ? '92vw' : 420"
      :max-width="configStore.isLessThanOverlayNavBreakpoint ? 360 : undefined"
      location="bottom end"
      offset="15px"
      :close-on-content-click="false"
    >
      <template #activator="{ props }">
        <VBtn
          v-bind="props"
          icon
          variant="text"
          color="default"
          aria-label="Notifikasi"
        >
          <VIcon icon="ri-notification-3-line" size="24" />
        </VBtn>
      </template>

      <VCard>
        <NotificationPanel
          :compact="configStore.isLessThanOverlayNavBreakpoint"
          @close="isMenuOpen = false"
        />
      </VCard>
    </VMenu>
  </VBadge>
</template>
