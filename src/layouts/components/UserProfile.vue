<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthTransition } from '@/composables/useAuthTransition.js'
import { useAuthStore } from '@/stores/auth.store.js'
import { useConfigStore } from '@core/stores/config'

const authStore = useAuthStore()
const configStore = useConfigStore()
const router = useRouter()
const { start: startAuthTransition, setStatus: setAuthTransitionStatus, leave: leaveAuthTransition, reset: resetAuthTransition } = useAuthTransition()

const isMenuOpen = ref(false)
const avatarRef  = ref(null)

const namaLengkap = computed(() =>
  authStore.user?.karyawan?.nama_karyawan
  || authStore.user?.username
  || '-')

const username = computed(() => authStore.user?.username || '-')

const roleName = computed(() =>
  authStore.user?.role?.nama_role
  || authStore.user?.role?.name
  || authStore.user?.roles?.[0]
  || '-')

function doLogout() {
  isMenuOpen.value = false

  const el = avatarRef.value?.$el
  const rect = el?.getBoundingClientRect()
  const originX = rect ? ((rect.left + rect.width / 2) / window.innerWidth) * 100 : 92
  const originY = rect ? ((rect.top + rect.height / 2) / window.innerHeight) * 100 : 6

  // Fire the real logout immediately — only the *navigation* needs to wait
  // until the circle has covered the screen, so it happens hidden behind it.
  const logoutPromise = authStore.logout()

  startAuthTransition({
    variant: 'logout',
    employeeName: namaLengkap.value,
    originX,
    originY,
    statusText: 'Mengakhiri sesi dengan aman...',
  })

  setTimeout(() => {
    setAuthTransitionStatus('Membersihkan data sesi...')
  }, 700)

  setTimeout(() => {
    setAuthTransitionStatus('Memutus koneksi aman...')
  }, 1400)

  setTimeout(async () => {
    await logoutPromise
    router.replace({ name: 'login' })
  }, 750)

  setTimeout(() => {
    leaveAuthTransition()
  }, 2200)

  setTimeout(() => {
    resetAuthTransition()
  }, 3000)
}
</script>

<template>
  <VMenu
    v-model="isMenuOpen"
    width="250"
    location="bottom end"
    offset="15px"
  >
    <template #activator="{ props }">
      <VBadge
        dot
        bordered
        location="bottom right"
        offset-x="2"
        offset-y="2"
        color="success"
        class="user-profile-badge"
      >
        <VAvatar
          ref="avatarRef"
          v-bind="props"
          class="cursor-pointer user-profile-activator"
          size="38"
          color="primary"
          role="button"
          aria-label="Open user menu"
        >
          <span class="text-button font-weight-bold">
            {{ namaLengkap.charAt(0).toUpperCase() }}
          </span>
        </VAvatar>
      </VBadge>
    </template>

    <VList>
      <VListItem class="px-4 py-3">
        <div class="d-flex gap-x-3 align-center">
          <VAvatar
            color="primary"
            size="42"
          >
            <span class="text-body-1 font-weight-bold">
              {{ namaLengkap.charAt(0).toUpperCase() }}
            </span>
          </VAvatar>
          <div>
            <div class="text-body-2 font-weight-semibold text-high-emphasis">
              {{ namaLengkap }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ username }}
            </div>
            <VChip
              color="primary"
              size="x-small"
              variant="tonal"
              class="mt-1"
              label
            >
              {{ roleName }}
            </VChip>
          </div>
        </div>
      </VListItem>

      <template v-if="!configStore.isLessThanOverlayNavBreakpoint">
        <VDivider class="my-1" />

        <VListItem
          prepend-icon="ri-settings-3-line"
          title="Pengaturan Profil"
          :to="{ name: 'profile-settings' }"
          @click="isMenuOpen = false"
        />
      </template>

      <VDivider class="my-1" />

      <VListItem class="px-4 pb-3">
        <VBtn
          block
          color="error"
          size="small"
          append-icon="ri-logout-box-r-line"
          @click="doLogout"
        >
          Logout
        </VBtn>
      </VListItem>
    </VList>
  </VMenu>
</template>

<style lang="scss">
.user-profile-badge {
  &.v-badge--bordered.v-badge--dot .v-badge__badge::after {
    color: rgb(var(--v-theme-background));
  }
}

.user-profile-activator {
  user-select: none;
}
</style>
