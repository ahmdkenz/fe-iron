<script setup>
import { useAuthStore } from '@/stores/auth.store.js'
import { layoutConfig } from '@layouts'
import { useLayoutConfigStore } from '@layouts/stores/config'

const props = defineProps({
  toggleOverlay: {
    type: Function,
    default: () => {},
  },
})

const authStore = useAuthStore()
const configStore = useLayoutConfigStore()

const nama = computed(() =>
  authStore.user?.karyawan?.nama_karyawan
  || authStore.user?.username
  || '-',
)

const entitas = computed(() =>
  authStore.user?.karyawan?.perusahaan?.nama_perusahaan || '',
)

const isMini = configStore.isVerticalNavMini()
</script>

<template>
  <div class="nav-profile-section">
    <VAvatar
      color="primary"
      size="38"
    >
      <VIcon icon="ri-user-3-line" />
    </VAvatar>

    <Transition name="vertical-nav-app-title">
      <div
        v-show="!isMini"
        class="nav-profile-info"
      >
        <div class="nav-profile-name text-body-2 font-weight-semibold">
          {{ nama }}
        </div>
        <div class="nav-profile-entity text-caption">
          {{ entitas }}
        </div>
      </div>
    </Transition>
  </div>

  <div class="header-action">
    <Component
      :is="layoutConfig.app.iconRenderer || 'div'"
      v-show="configStore.isVerticalNavCollapsed"
      class="d-none nav-unpin"
      :class="configStore.isVerticalNavCollapsed && 'd-lg-block'"
      v-bind="layoutConfig.icons.verticalNavUnPinned"
      @click="configStore.isVerticalNavCollapsed = !configStore.isVerticalNavCollapsed"
    />
    <Component
      :is="layoutConfig.app.iconRenderer || 'div'"
      v-show="!configStore.isVerticalNavCollapsed"
      class="d-none nav-pin"
      :class="!configStore.isVerticalNavCollapsed && 'd-lg-block'"
      v-bind="layoutConfig.icons.verticalNavPinned"
      @click="configStore.isVerticalNavCollapsed = !configStore.isVerticalNavCollapsed"
    />
    <Component
      :is="layoutConfig.app.iconRenderer || 'div'"
      class="d-lg-none"
      v-bind="layoutConfig.icons.close"
      @click="props.toggleOverlay(false)"
    />
  </div>
</template>

<style scoped>
.nav-profile-section {
  display: flex;
  align-items: center;
  column-gap: 0.65rem;
  margin-inline-end: auto;
  overflow: hidden;
}

.nav-profile-info {
  overflow: hidden;
}

.nav-profile-name {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.nav-profile-entity {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  opacity: 0.72;
}
</style>
