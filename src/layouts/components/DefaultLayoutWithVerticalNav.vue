<script setup>
import navItems from '@/navigation/vertical'
import { useAuthStore } from '@/stores/auth.store'
import { useFinanceNotificationStore } from '@/stores/finance-notification.store'
import { useConfigStore } from '@core/stores/config'
import { themeConfig } from '@themeConfig'

// Components
import Footer from '@/layouts/components/Footer.vue'
import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue'
import UserProfile from '@/layouts/components/UserProfile.vue'
import NavBarI18n from '@core/components/I18n.vue'

// @layouts plugin
import { VerticalNavLayout } from '@layouts'

const configStore = useConfigStore()
const authStore = useAuthStore()
const financeNotificationStore = useFinanceNotificationStore()
const route = useRoute()
let financeNotificationIntervalId = null

const enrichedNavItems = computed(() => navItems.map(item => {
  if (item.to?.name !== 'finance-opening-balance-approval')
    return item

  return {
    ...item,
    badgeContent: financeNotificationStore.pendingOpeningBalanceBadge,
    badgeClass: financeNotificationStore.pendingOpeningBalanceBadge ? 'bg-error text-white' : undefined,
  }
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

watch(() => authStore.canApproveOpeningBalance, async canApprove => {
  clearInterval(financeNotificationIntervalId)
  financeNotificationIntervalId = null

  if (!canApprove) {
    financeNotificationStore.reset()

    return
  }

  await refreshFinanceNotifications()
  financeNotificationIntervalId = window.setInterval(refreshFinanceNotifications, 60000)
}, { immediate: true })

watch(() => route.fullPath, () => {
  if (authStore.canApproveOpeningBalance)
    refreshFinanceNotifications()
})

onMounted(() => {
  window.addEventListener('focus', refreshFinanceNotifications)
})

onBeforeUnmount(() => {
  window.removeEventListener('focus', refreshFinanceNotifications)
  clearInterval(financeNotificationIntervalId)
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
    <!-- 👉 navbar -->
    <template #navbar="{ toggleVerticalOverlayNavActive }">
      <div class="d-flex h-100 align-center">
        <IconBtn
          id="vertical-nav-toggle-btn"
          class="ms-n2 d-lg-none"
          @click="toggleVerticalOverlayNavActive(true)"
        >
          <VIcon icon="ri-menu-line" />
        </IconBtn>

        <NavbarThemeSwitcher />

        <VSpacer />

        <NavBarI18n
          v-if="themeConfig.app.i18n.enable && themeConfig.app.i18n.langConfig?.length"
          :languages="themeConfig.app.i18n.langConfig"
        />
        <UserProfile />
      </div>
    </template>

    <!-- 👉 Pages -->
    <slot />

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
</style>
