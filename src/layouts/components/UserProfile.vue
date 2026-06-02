<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store.js'

const authStore = useAuthStore()
const router = useRouter()

const isMenuOpen     = ref(false)
const showLogoutOverlay = ref(false)
const logoutStep     = ref('')

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

async function doLogout() {
  isMenuOpen.value = false
  showLogoutOverlay.value = true
  logoutStep.value = 'Mengakhiri sesi dengan aman...'

  setTimeout(() => { logoutStep.value = 'Membersihkan data sesi...' }, 700)
  setTimeout(() => { logoutStep.value = 'Memutus koneksi aman...' }, 1400)

  await new Promise(r => setTimeout(r, 2200))
  await authStore.logout()
  await router.replace({ name: 'login' })
}
</script>

<template>
  <!-- ── Logout overlay ── -->
  <Teleport to="body">
    <Transition name="lov-fade">
      <div v-if="showLogoutOverlay" class="lov-root d-flex flex-column align-center justify-center">
        <div class="lov-wrap mb-6">
          <div class="lov-ring" />
          <div class="lov-box d-flex align-center justify-center">
            <VIcon icon="ri-logout-box-r-line" size="36" class="lov-icon" />
          </div>
        </div>
        <h2 class="lov-title">Keluar dari Sistem</h2>
        <p class="lov-name">Sampai jumpa, {{ namaLengkap }}</p>
        <p class="lov-status loading-dots">{{ logoutStep }}</p>
        <div class="lov-prog mt-6">
          <div class="lov-bar" />
        </div>
      </div>
    </Transition>
  </Teleport>

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

<style scoped>
/* ── Logout overlay ── */
.lov-root {
  position: fixed; inset: 0; z-index: 9999;
  background: rgb(var(--v-theme-background));
}
.lov-fade-enter-active, .lov-fade-leave-active { transition: opacity 0.35s ease; }
.lov-fade-enter-from, .lov-fade-leave-to       { opacity: 0; }

.lov-wrap {
  position: relative; width: 100px; height: 100px;
  display: flex; align-items: center; justify-content: center;
}
.lov-ring {
  position: absolute; inset: 0; border-radius: 50%;
  background: conic-gradient(from 0deg, transparent 38%, rgb(var(--v-theme-error)) 65%, transparent 70%);
  animation: lov-spin 1.4s linear infinite;
}
@keyframes lov-spin { to { transform: rotate(360deg); } }

.lov-box {
  width: 76px; height: 76px; border-radius: 50%;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  position: relative; z-index: 1;
}
.lov-icon   { color: rgb(var(--v-theme-error)) !important; }
.lov-title  { font-size: 1.3rem; font-weight: 800; margin-bottom: 0.25rem; }
.lov-name   { color: rgb(var(--v-theme-error)); font-size: 0.92rem; font-weight: 500; margin-bottom: 0.2rem; }
.lov-status { font-size: 0.8rem; opacity: 0.65; }

.lov-prog { width: 240px; height: 3px; background: rgba(var(--v-theme-error), 0.15); border-radius: 4px; overflow: hidden; }
.lov-bar  {
  height: 100%; border-radius: 4px;
  background: rgb(var(--v-theme-error));
  animation: lov-fill 2.2s cubic-bezier(0.4,0,0.2,1) forwards;
}
@keyframes lov-fill { 0%{width:0} 30%{width:35%} 65%{width:70%} 100%{width:100%} }

.loading-dots::after { content: ''; animation: ldots 1.5s steps(4,end) infinite; }
@keyframes ldots { 0%,20%{content:''} 40%{content:'.'} 60%{content:'..'} 80%,100%{content:'...'} }
</style>
