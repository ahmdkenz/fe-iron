<script setup>
import navItems from '@/navigation/vertical'
import { useAuthStore } from '@/stores/auth.store'
import { useFinanceNotificationStore } from '@/stores/finance-notification.store'
import { useConfigStore } from '@core/stores/config'
import { themeConfig } from '@themeConfig'

// Components
import Footer from '@/layouts/components/Footer.vue'
import MobileBottomNav from '@/layouts/components/MobileBottomNav.vue'
import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue'
import NavSidebarProfile from '@/layouts/components/NavSidebarProfile.vue'
import UserProfile from '@/layouts/components/UserProfile.vue'
import NavBarI18n from '@core/components/I18n.vue'
import GlobalMinimizeWidgets from '@/components/base/GlobalMinimizeWidgets.vue'

// @layouts plugin
import { VerticalNavLayout } from '@layouts'

const configStore = useConfigStore()
const authStore = useAuthStore()
const financeNotificationStore = useFinanceNotificationStore()
const route = useRoute()
let financeNotificationIntervalId = null
let ebKoreksiNotificationIntervalId = null
let tagihanApNotificationIntervalId = null

const canApproveEbKoreksi = computed(() =>
  authStore.canApproveEndingBalanceSpv || authStore.canApproveEndingBalanceManager
)

const enrichedNavItems = computed(() => navItems.map(item => {
  if (item.to?.name === 'ap-dashboard') {
    return {
      ...item,
      title: authStore.isApOnly ? 'Dashboard' : 'Dashboard AP',
    }
  }

  if (item.to?.name === 'finance-opening-balance') {
    return {
      ...item,
      badgeContent: financeNotificationStore.pendingOpeningBalanceBadge,
      badgeClass: financeNotificationStore.pendingOpeningBalanceBadge ? 'bg-error text-white' : undefined,
    }
  }

  if (item.to?.name === 'finance-ending-balance') {
    return {
      ...item,
      badgeContent: financeNotificationStore.pendingEndingBalanceKoreksieBadge,
      badgeClass: financeNotificationStore.pendingEndingBalanceKoreksieBadge ? 'bg-error text-white' : undefined,
    }
  }

  if (item.to?.name === 'ap-tagihan-index') {
    return {
      ...item,
      badgeContent: financeNotificationStore.pendingTagihanApBadge,
      badgeClass: financeNotificationStore.pendingTagihanApBadge ? 'bg-error text-white' : undefined,
    }
  }

  return item
}))

const filteredNavItems = computed(() => {
  const prunedItems = []
  let pendingHeading = null

  enrichedNavItems.value.forEach(item => {
    const canAccessItem = !item.roles?.length || authStore.hasAnyRole(item.roles)

    if ('heading' in item) {
      pendingHeading = canAccessItem ? item : null

      return
    }

    if (!canAccessItem)
      return

    if (pendingHeading) {
      prunedItems.push(pendingHeading)
      pendingHeading = null
    }

    prunedItems.push(item)
  })

  return prunedItems
})

async function refreshFinanceNotifications() {
  await financeNotificationStore.fetchPendingOpeningBalanceCount()
}

async function refreshEbKoreksiNotifications() {
  await financeNotificationStore.fetchPendingEndingBalanceKoreksiCount()
}

async function refreshTagihanApNotifications() {
  await financeNotificationStore.fetchPendingTagihanApCount()
}

async function refreshAllNotifications() {
  await Promise.all([
    authStore.canApproveOpeningBalance ? refreshFinanceNotifications() : Promise.resolve(),
    canApproveEbKoreksi.value ? refreshEbKoreksiNotifications() : Promise.resolve(),
    authStore.canApproveTagihanAp ? refreshTagihanApNotifications() : Promise.resolve(),
  ])
}

watch(() => authStore.canApproveOpeningBalance, async canApprove => {
  clearInterval(financeNotificationIntervalId)
  financeNotificationIntervalId = null

  if (!canApprove) {
    financeNotificationStore.pendingOpeningBalanceCount = 0

    return
  }

  await refreshFinanceNotifications()
  financeNotificationIntervalId = window.setInterval(refreshFinanceNotifications, 60000)
}, { immediate: true })

watch(canApproveEbKoreksi, async canApprove => {
  clearInterval(ebKoreksiNotificationIntervalId)
  ebKoreksiNotificationIntervalId = null

  if (!canApprove) {
    financeNotificationStore.pendingEndingBalanceKoreksiCount = 0

    return
  }

  await refreshEbKoreksiNotifications()
  ebKoreksiNotificationIntervalId = window.setInterval(refreshEbKoreksiNotifications, 60000)
}, { immediate: true })

watch(() => authStore.canApproveTagihanAp, async canApprove => {
  clearInterval(tagihanApNotificationIntervalId)
  tagihanApNotificationIntervalId = null

  if (!canApprove) {
    financeNotificationStore.pendingTagihanApCount = 0

    return
  }

  await refreshTagihanApNotifications()
  tagihanApNotificationIntervalId = window.setInterval(refreshTagihanApNotifications, 60000)
}, { immediate: true })

watch(() => route.fullPath, () => {
  if (authStore.canApproveOpeningBalance)
    refreshFinanceNotifications()
  if (canApproveEbKoreksi.value)
    refreshEbKoreksiNotifications()
  if (authStore.canApproveTagihanAp)
    refreshTagihanApNotifications()
})

onMounted(() => {
  window.addEventListener('focus', refreshAllNotifications)
})

onBeforeUnmount(() => {
  window.removeEventListener('focus', refreshAllNotifications)
  clearInterval(financeNotificationIntervalId)
  clearInterval(ebKoreksiNotificationIntervalId)
  clearInterval(tagihanApNotificationIntervalId)
})

// ℹ️ Provide animation name for vertical nav collapse icon.
const verticalNavHeaderActionAnimationName = ref(null)

watch([
  () => configStore.isVerticalNavCollapsed,
  () => configStore.isAppRTL,
], val => {
  if (configStore.isAppRTL)
    verticalNavHeaderActionAnimationName.value = val[0] ? 'rotate-back-180' : 'rotate-180'
  else
    verticalNavHeaderActionAnimationName.value = val[0] ? 'rotate-180' : 'rotate-back-180'
}, { immediate: true })
</script>

<template>
  <VerticalNavLayout :nav-items="filteredNavItems">
    <!-- 👉 Sidebar header: profil karyawan -->
    <template #vertical-nav-header="{ toggleOverlay }">
      <NavSidebarProfile :toggle-overlay="toggleOverlay" />
    </template>

    <!-- 👉 navbar -->
    <template #navbar>
      <div class="d-flex h-100 align-center">
        <NavbarThemeSwitcher />

        <VSpacer />

        <NavBarI18n
          v-if="themeConfig.app.i18n.enable && themeConfig.app.i18n.langConfig?.length"
          :languages="themeConfig.app.i18n.langConfig"
        />
        <UserProfile />
      </div>

      <MobileBottomNav :nav-items="filteredNavItems" />
    </template>

    <!-- 👉 Pages -->
    <slot />

    <!-- 👉 Global Minimize Widgets -->
    <GlobalMinimizeWidgets />

    <!-- 👉 Footer -->
    <template #footer>
      <Footer />
    </template>

    <!-- 👉 Customizer -->
    <!-- <TheCustomizer /> -->
  </VerticalNavLayout>
</template>

<style lang="scss">
@keyframes rotate-180 {
  from { transform: rotate(0deg); }
  to { transform: rotate(180deg); }
}

@keyframes rotate-back-180 {
  from { transform: rotate(180deg); }
  to { transform: rotate(0deg); }
}

.layout-vertical-nav {
  .nav-header {
    .header-action {
      animation-duration: 0.35s;
      animation-fill-mode: forwards;
      animation-name: v-bind(verticalNavHeaderActionAnimationName);
      transform: rotate(0deg);
    }
  }
}

// 👉 Reserve space for the fixed mobile bottom nav so page content/footer aren't hidden behind it
.layout-wrapper.layout-overlay-nav .layout-content-wrapper {
  padding-block-end: calc(60px + env(safe-area-inset-bottom, 0px));
}
</style>
