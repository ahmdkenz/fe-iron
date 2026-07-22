<template>
  <div>
    <PageHeader
      title="Laporan AP"
      subtitle="Laporan hutang, histori pembayaran, dan aging hutang vendor"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'ap-dashboard' } },
        { title: 'Laporan', disabled: true },
      ]"
    />

    <VRow>
      <VCol
        v-for="report in reports"
        :key="report.route"
        cols="12"
        sm="6"
        md="4"
      >
        <VCard
          flat
          height="100%"
          class="report-card"
          :style="{ borderInlineStartColor: `rgb(var(--v-theme-${report.color}))` }"
        >
          <VCardText class="d-flex flex-column h-100">
            <div class="d-flex align-start justify-space-between gap-2 mb-2">
              <VAvatar
                :color="report.color"
                variant="tonal"
                size="44"
                class="rounded-lg"
              >
                <VIcon
                  :icon="report.icon"
                  size="22"
                />
              </VAvatar>
              <VBtn
                icon
                variant="text"
                size="small"
                :color="report.color"
                :to="{ name: report.route }"
              >
                <VIcon
                  icon="ri-arrow-right-up-line"
                  size="18"
                />
              </VBtn>
            </div>
            <div class="text-subtitle-1 font-weight-bold mb-1">
              {{ report.title }}
            </div>
            <div class="text-body-2 text-medium-emphasis mb-3 flex-grow-1">
              {{ report.description }}
            </div>
            <VBtn
              variant="tonal"
              :color="report.color"
              size="small"
              append-icon="ri-arrow-right-line"
              :to="{ name: report.route }"
            >
              Lihat laporan
            </VBtn>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>

<script setup>
const reports = [
  {
    title: 'Hutang per Vendor',
    description: 'Ringkasan outstanding tagihan per vendor, termasuk overdue dan jatuh tempo terdekat',
    route: 'ap-laporan-hutang-vendor',
    icon: 'ri-store-2-line',
    color: 'primary',
  },
  {
    title: 'Histori Pembayaran',
    description: 'Riwayat alokasi payment voucher per vendor dan per tagihan',
    route: 'ap-laporan-histori-pembayaran',
    icon: 'ri-exchange-funds-line',
    color: 'success',
  },
  {
    title: 'Aging Hutang',
    description: 'Umur hutang belum terbayar per vendor (bucket current/1-30/31-60/61-90/90+)',
    route: 'ap-laporan-aging',
    icon: 'ri-time-line',
    color: 'warning',
  },
]
</script>

<style scoped>
.report-card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-inline-start: 3px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 8px;
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.report-card:hover {
  border-color: rgba(var(--v-theme-on-surface), 0.18);
  transform: translateY(-2px);
}
</style>
