<script setup>
import { useRouter } from 'vue-router'
import { useSystemNotificationStore } from '@/stores/system-notification.store'

const store = useSystemNotificationStore()
const router = useRouter()
const { formatDateTime } = useFormatter()

const isMenuOpen = ref(false)
const activeTab = ref('finance')

const severityMeta = {
  info: { color: 'info', icon: 'ri-information-line' },
  success: { color: 'success', icon: 'ri-checkbox-circle-line' },
  warning: { color: 'warning', icon: 'ri-alert-line' },
  error: { color: 'error', icon: 'ri-error-warning-line' },
}

function meta(severity) {
  return severityMeta[severity] || severityMeta.info
}

watch(isMenuOpen, async val => {
  if (!val)
    return

  if (!store.financeLoaded)
    await store.fetchFinanceList()
  if (!store.appUpdatesLoaded)
    await store.fetchAppUpdates()
})

async function openFinanceItem(item) {
  isMenuOpen.value = false

  if (!item.read_at)
    await store.markFinanceRead(item.id)

  if (item.route_name)
    router.push({ name: item.route_name, params: item.route_params || {} })
}

function openAppUpdate(update) {
  store.markAppUpdateRead(update.id)
}
</script>

<template>
  <VMenu
    v-model="isMenuOpen"
    width="420"
    location="bottom end"
    offset="15px"
  >
    <template #activator="{ props }">
      <VBadge
        :content="store.bellBadge"
        :model-value="!!store.bellBadge"
        color="error"
        offset-x="4"
        offset-y="4"
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
      <VTabs v-model="activeTab" grow density="comfortable">
        <VTab value="finance">
          Aktivitas Finance
          <VChip v-if="store.financeUnreadCount" size="x-small" color="error" class="ms-2">
            {{ store.financeBadge }}
          </VChip>
        </VTab>
        <VTab value="updates">
          Update Aplikasi
          <VChip v-if="store.appUpdateUnreadCount" size="x-small" color="error" class="ms-2">
            {{ store.appUpdateBadge }}
          </VChip>
        </VTab>
      </VTabs>

      <VDivider />

      <VWindow v-model="activeTab">
        <!-- ── Tab: Aktivitas Finance ── -->
        <VWindowItem value="finance">
          <div class="d-flex justify-end pa-2" v-if="store.financeItems.length">
            <VBtn
              size="small"
              variant="text"
              prepend-icon="ri-check-double-line"
              :disabled="!store.financeUnreadCount"
              @click="store.markAllFinanceRead()"
            >
              Tandai semua dibaca
            </VBtn>
          </div>

          <VList class="notification-list" density="compact">
            <template v-if="store.financeLoading">
              <div class="d-flex justify-center pa-6">
                <VProgressCircular indeterminate color="primary" size="28" />
              </div>
            </template>

            <template v-else-if="!store.financeItems.length">
              <div class="d-flex flex-column align-center pa-8 text-medium-emphasis">
                <VIcon icon="ri-notification-off-line" size="32" class="mb-2" />
                <span class="text-body-2">Belum ada aktivitas Finance</span>
              </div>
            </template>

            <template v-else>
              <VListItem
                v-for="item in store.financeItems"
                :key="item.id"
                class="notification-item"
                :class="{ 'notification-item--unread': !item.read_at }"
                @click="openFinanceItem(item)"
              >
                <template #prepend>
                  <VAvatar :color="meta(item.severity).color" variant="tonal" size="36">
                    <VIcon :icon="meta(item.severity).icon" size="20" />
                  </VAvatar>
                </template>

                <VListItemTitle class="text-body-2 font-weight-medium">
                  {{ item.title }}
                </VListItemTitle>
                <VListItemSubtitle class="text-wrap">
                  {{ item.body }}
                </VListItemSubtitle>
                <VListItemSubtitle class="text-caption mt-1">
                  {{ formatDateTime(item.occurred_at) }}
                </VListItemSubtitle>

                <template #append>
                  <VIcon v-if="!item.read_at" icon="ri-circle-fill" size="8" color="error" />
                </template>
              </VListItem>
            </template>
          </VList>
        </VWindowItem>

        <!-- ── Tab: Update Aplikasi ── -->
        <VWindowItem value="updates">
          <div class="d-flex justify-end pa-2" v-if="store.appUpdates.length">
            <VBtn
              size="small"
              variant="text"
              prepend-icon="ri-check-double-line"
              :disabled="!store.appUpdateUnreadCount"
              @click="store.markAllAppUpdatesRead()"
            >
              Tandai semua dibaca
            </VBtn>
          </div>

          <VList class="notification-list" density="compact">
            <template v-if="!store.appUpdates.length">
              <div class="d-flex flex-column align-center pa-8 text-medium-emphasis">
                <VIcon icon="ri-megaphone-line" size="32" class="mb-2" />
                <span class="text-body-2">Belum ada update aplikasi</span>
              </div>
            </template>

            <template v-else>
              <VListItem
                v-for="update in store.appUpdates"
                :key="update.id"
                class="notification-item"
                :class="{ 'notification-item--unread': !store.appUpdatesReadIds.has(update.id) }"
                @click="openAppUpdate(update)"
              >
                <template #prepend>
                  <VAvatar color="primary" variant="tonal" size="36">
                    <VIcon icon="ri-rocket-2-line" size="20" />
                  </VAvatar>
                </template>

                <VListItemTitle class="text-body-2 font-weight-medium">
                  {{ update.title }}
                  <VChip size="x-small" variant="tonal" class="ms-1">{{ update.version }}</VChip>
                </VListItemTitle>
                <VListItemSubtitle class="text-wrap">
                  {{ update.summary }}
                </VListItemSubtitle>
                <ul v-if="update.items?.length" class="update-items text-caption text-medium-emphasis">
                  <li v-for="(line, idx) in update.items" :key="idx">{{ line }}</li>
                </ul>
                <VListItemSubtitle class="text-caption mt-1">
                  {{ formatDateTime(update.published_at) }}
                </VListItemSubtitle>

                <template #append>
                  <VIcon
                    v-if="!store.appUpdatesReadIds.has(update.id)"
                    icon="ri-circle-fill"
                    size="8"
                    color="error"
                  />
                </template>
              </VListItem>
            </template>
          </VList>
        </VWindowItem>
      </VWindow>
    </VCard>
  </VMenu>
</template>

<style scoped>
.notification-list {
  max-block-size: 420px;
  overflow-y: auto;
}

.notification-item {
  cursor: pointer;
  border-block-end: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.notification-item--unread {
  background: rgba(var(--v-theme-primary), 0.04);
}

.update-items {
  margin-block-start: 4px;
  padding-inline-start: 18px;
}
</style>
