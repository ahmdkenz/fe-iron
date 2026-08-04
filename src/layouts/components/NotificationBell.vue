<script setup>
import { useConfigStore } from '@core/stores/config'
import { useSystemNotificationStore } from '@/stores/system-notification.store'
import NotificationPanel from '@/layouts/components/NotificationPanel.vue'

const store = useSystemNotificationStore()
const configStore = useConfigStore()

const isMenuOpen = ref(false)

watch(isMenuOpen, async val => {
  if (!val)
    return

  if (!store.financeLoaded)
    await store.fetchFinanceList()
  if (!store.appUpdatesLoaded)
    await store.fetchAppUpdates()
})
</script>

<template>
  <VMenu
    v-model="isMenuOpen"
    :width="configStore.isLessThanOverlayNavBreakpoint ? '92vw' : 420"
    :max-width="configStore.isLessThanOverlayNavBreakpoint ? 360 : undefined"
    location="bottom end"
    offset="15px"
    :close-on-content-click="false"
  >
    <template #activator="{ props }">
      <VBadge
        :content="store.bellBadge"
        :model-value="!!store.bellBadge"
        color="error"
        offset-x="4"
        offset-y="4"
        class="me-3"
      >
        <VBtn
          v-bind="props"
          icon
          variant="text"
          color="default"
          aria-label="Notifikasi"
        >
          <VIcon icon="ri-notification-3-line" size="24" />
        </VBtn>
      </VBadge>
    </template>

    <VCard>
      <NotificationPanel
        :compact="configStore.isLessThanOverlayNavBreakpoint"
        @close="isMenuOpen = false"
      />
    </VCard>
  </VMenu>
</template>
