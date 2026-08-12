<template>
  <div>
    <PageHeader title="Notifikasi">
      <template #default="{ mobile }">
        <AppActionButton
          action="custom"
          color="secondary"
          variant="tonal"
          icon="ri-arrow-left-line"
          label="Kembali"
          :compact="mobile"
          @click="router.back()"
        />
      </template>
    </PageHeader>

    <VCard>
      <NotificationPanel
        :compact="false"
        page-mode
      />
    </VCard>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import NotificationPanel from '@/layouts/components/NotificationPanel.vue'
import { useSystemNotificationStore } from '@/stores/system-notification.store'

const router = useRouter()
const store = useSystemNotificationStore()

onMounted(() => {
  store.ensureLoaded()
})
</script>
