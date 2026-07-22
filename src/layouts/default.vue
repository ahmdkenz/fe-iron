<script setup>
import { useDisplay } from 'vuetify'
import { useConfigStore } from '@core/stores/config'
import { AppContentLayoutNav } from '@layouts/enums'
import { switchToVerticalNavOnLtOverlayNavBreakpoint } from '@layouts/utils'

const DefaultLayoutWithHorizontalNav = defineAsyncComponent(() => import('./components/DefaultLayoutWithHorizontalNav.vue'))
const DefaultLayoutWithVerticalNav = defineAsyncComponent(() => import('./components/DefaultLayoutWithVerticalNav.vue'))
const configStore = useConfigStore()
const { mobile } = useDisplay()
const keepAliveRouteNames = new Set([
  'finance-opening-balance',
  'iam-users', 'iam-roles',
  'master-karyawan', 'master-perusahaan', 'master-investor', 'master-resto', 'master-brand',
  'finance-klien-ar',
  'ap-vendor-index',
])

// Halaman finance berat (tabel, dialog, form besar sekaligus) — tidak sepadan
// disimpan penuh di memori pada layar mobile, hanya di-keep-alive di desktop.
// Sebagian nama di bawah ini belum ada di `keepAliveRouteNames` sama sekali
// (jadi belum di-keep-alive di desktop juga) — tetap didaftarkan di sini agar
// niatnya terlihat dan langsung berlaku begitu suatu saat ditambahkan ke sana.
const mobileExcludedRouteNames = new Set([
  'finance-opening-balance',
  'finance-export-data',
  'finance-rekonsiliasi-bank',
  'finance-rekonsiliasi-bank-show',
  'finance-ending-balance-show',
  'ap-shz360-import-index',
  'ap-ending-balance-show',
  'finance-laporan-jurnal-pic',
  'finance-laporan-rekening-koran',
  'finance-laporan-aging',
  'finance-laporan-rekap-klien',
  'finance-laporan-riwayat-bayar',
  'finance-laporan-mutasi-piutang',
  'finance-laporan-rekap-pembayaran',
  'finance-laporan-kinerja-ar',
  'finance-laporan-pdm',
  'ap-laporan-hutang-vendor',
  'ap-laporan-histori-pembayaran',
  'ap-laporan-aging',

  // Halaman admin/master ini kini disembunyikan dari menu mobile (masih bisa
  // diakses lewat URL langsung sesuai role), jadi tidak perlu di-keep-alive di mobile.
  'iam-users',
  'iam-roles',
  'master-karyawan',
  'master-perusahaan',
  'master-investor',
  'master-resto',
  'master-brand',
])

// ℹ️ This will switch to vertical nav when define breakpoint is reached when in horizontal nav layout

// Remove below composable usage if you are not using horizontal nav layout in your app
switchToVerticalNavOnLtOverlayNavBreakpoint()

const { layoutAttrs, injectSkinClasses } = useSkins()

injectSkinClasses()

// SECTION: Loading Indicator
const isFallbackStateActive = ref(false)
const refLoadingIndicator = ref(null)

watch([
  isFallbackStateActive,
  refLoadingIndicator,
], () => {
  if (isFallbackStateActive.value && refLoadingIndicator.value)
    refLoadingIndicator.value.fallbackHandle()
  if (!isFallbackStateActive.value && refLoadingIndicator.value)
    refLoadingIndicator.value.resolveHandle()
}, { immediate: true })

function shouldKeepRouteAlive(route) {
  if (mobile.value && mobileExcludedRouteNames.has(route.name))
    return false

  return keepAliveRouteNames.has(route.name)
}
// !SECTION
</script>

<template>
  <Component
    v-bind="layoutAttrs"
    :is="configStore.appContentLayoutNav === AppContentLayoutNav.Vertical ? DefaultLayoutWithVerticalNav : DefaultLayoutWithHorizontalNav"
  >
    <AppLoadingIndicator ref="refLoadingIndicator" />

    <RouterView v-slot="{ Component, route }">
      <Suspense
        :timeout="0"
        @fallback="isFallbackStateActive = true"
        @resolve="isFallbackStateActive = false"
      >
        <KeepAlive v-if="shouldKeepRouteAlive(route)">
          <Component
            :is="Component"
            :key="route.name"
          />
        </KeepAlive>
        <Component
          :is="Component"
          v-else
        />
      </Suspense>
    </RouterView>
  </Component>
</template>

<style lang="scss">
// As we are using `layouts` plugin we need its styles to be imported
@use "@layouts/styles/default-layout";
</style>
