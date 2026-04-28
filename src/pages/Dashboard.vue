<template>
  <PicArDashboardSection v-if="authStore.isArOnly" />

  <div v-else>
    <!-- Modern Page Header with our custom 3D breadcrumb logic included in PageHeader if needed -->
    <PageHeader
      title="Overview Dashboard"
      subtitle="Ringkasan aktivitas bisnis dan finansial perusahaan"
    />

    <!-- Top Statistical Cards -->
    <VRow class="mb-4">
      <VCol
        cols="12"
        sm="6"
        lg="3"
      >
        <VCard
          elevation="2"
          class="rounded-xl stat-card"
        >
          <VCardText class="d-flex align-center justify-space-between text-white bg-primary-gradient fill-height">
            <div>
              <div class="text-subtitle-2 text-uppercase font-weight-medium mb-1 opacity-80">
                Total Pendapatan
              </div>
              <div class="text-h4 font-weight-bold">
                Rp 4.25M
              </div>
              <div class="text-caption mt-2 d-flex align-center">
                <VIcon
                  icon="ri-arrow-up-line"
                  size="14"
                  class="me-1"
                />
                <span>+12.5% bulan ini</span>
              </div>
            </div>
            <VAvatar
              size="54"
              color="rgba(255,255,255,0.2)"
              class="rounded-lg"
            >
              <VIcon
                icon="ri-funds-line"
                size="30"
              />
            </VAvatar>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        sm="6"
        lg="3"
      >
        <VCard
          elevation="2"
          class="rounded-xl stat-card"
        >
          <VCardText class="d-flex align-center justify-space-between fill-height bg-surface">
            <div>
              <div class="text-subtitle-2 text-medium-emphasis text-uppercase font-weight-medium mb-1">
                Piutang AR (Unpaid)
              </div>
              <div class="text-h4 font-weight-bold text-error">
                Rp 850Jt
              </div>
              <div class="text-caption mt-2 d-flex align-center text-error">
                <VIcon
                  icon="ri-arrow-up-line"
                  size="14"
                  class="me-1"
                />
                <span>+4.2% dari target</span>
              </div>
            </div>
            <VAvatar
              size="54"
              color="error"
              variant="tonal"
              class="rounded-lg"
            >
              <VIcon
                icon="ri-file-warning-line"
                size="30"
              />
            </VAvatar>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        sm="6"
        lg="3"
      >
        <VCard
          elevation="2"
          class="rounded-xl stat-card"
        >
          <VCardText class="d-flex align-center justify-space-between fill-height bg-surface">
            <div>
              <div class="text-subtitle-2 text-medium-emphasis text-uppercase font-weight-medium mb-1">
                Total Klien B2B
              </div>
              <div class="text-h4 font-weight-bold text-primary">
                124
              </div>
              <div class="text-caption mt-2 d-flex align-center text-success">
                <VIcon
                  icon="ri-arrow-up-line"
                  size="14"
                  class="me-1"
                />
                <span>+8 klien baru</span>
              </div>
            </div>
            <VAvatar
              size="54"
              color="info"
              variant="tonal"
              class="rounded-lg"
            >
              <VIcon
                icon="ri-building-4-line"
                size="30"
              />
            </VAvatar>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        sm="6"
        lg="3"
      >
        <VCard
          elevation="2"
          class="rounded-xl stat-card"
        >
          <VCardText class="d-flex align-center justify-space-between fill-height bg-surface">
            <div>
              <div class="text-subtitle-2 text-medium-emphasis text-uppercase font-weight-medium mb-1">
                Resto Aktif
              </div>
              <div class="text-h4 font-weight-bold text-success">
                48
              </div>
              <div class="text-caption mt-2 d-flex align-center text-success">
                <VIcon
                  icon="ri-check-line"
                  size="14"
                  class="me-1"
                />
                <span>100% beroperasi</span>
              </div>
            </div>
            <VAvatar
              size="54"
              color="success"
              variant="tonal"
              class="rounded-lg"
            >
              <VIcon
                icon="ri-store-2-line"
                size="30"
              />
            </VAvatar>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VRow>
      <!-- Revenue Chart -->
      <VCol
        cols="12"
        md="8"
      >
        <VCard
          elevation="2"
          class="rounded-xl h-100"
        >
          <VCardItem class="pb-0">
            <VCardTitle class="d-flex align-center text-h6 font-weight-bold">
              <VIcon
                icon="ri-bar-chart-grouped-line"
                class="me-2 text-primary"
              />
              Tren Invoicing & Pembayaran AR
            </VCardTitle>
            <VCardSubtitle>Catatan 6 bulan terakhir</VCardSubtitle>
          </VCardItem>
          <VCardText class="pt-4">
            <DeferredApexChart
              type="area"
              height="350"
              :options="revenueChartOptions"
              :series="revenueChartSeries"
            />
          </VCardText>
        </VCard>
      </VCol>

      <!-- Status Invoice Donut -->
      <VCol
        cols="12"
        md="4"
      >
        <VCard
          elevation="2"
          class="rounded-xl h-100"
        >
          <VCardItem class="pb-0">
            <VCardTitle class="text-h6 font-weight-bold">
              Status Invoice
            </VCardTitle>
            <VCardSubtitle>Proporsi tagihan aktif</VCardSubtitle>
          </VCardItem>
          <VCardText class="d-flex align-center justify-center pt-8">
            <DeferredApexChart
              type="donut"
              width="100%"
              height="300"
              :delay="300"
              :options="donutChartOptions"
              :series="donutChartSeries"
            />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VRow class="mb-4">
      <VCol cols="12">
        <VCard
          elevation="2"
          class="rounded-xl"
        >
          <VCardItem>
            <VCardTitle class="d-flex align-center text-h6 font-weight-bold">
              <VIcon
                icon="ri-history-line"
                class="me-2 text-primary"
              />
              Aktivitas Invoicing Terkini
            </VCardTitle>
          </VCardItem>
          <VCardText class="px-0">
            <VTable class="text-no-wrap">
              <thead>
                <tr>
                  <th class="text-uppercase font-weight-bold text-caption">
                    No. Invoice
                  </th>
                  <th class="text-uppercase font-weight-bold text-caption">
                    Klien
                  </th>
                  <th class="text-uppercase font-weight-bold text-caption">
                    Tanggal
                  </th>
                  <th class="text-uppercase font-weight-bold text-caption text-right">
                    Nominal
                  </th>
                  <th class="text-uppercase font-weight-bold text-caption text-center">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="invoice in recentInvoices"
                  :key="invoice.id"
                  class="table-row-hover"
                >
                  <td class="font-weight-medium text-primary">
                    {{ invoice.noInvoice }}
                  </td>
                  <td>
                    <div class="d-flex align-center">
                      <VAvatar
                        size="32"
                        color="surface-variant"
                        variant="tonal"
                        class="me-2 rounded"
                      >
                        <span class="text-caption font-weight-bold">{{ invoice.klien.charAt(0) }}</span>
                      </VAvatar>
                      {{ invoice.klien }}
                    </div>
                  </td>
                  <td class="text-body-2">
                    {{ invoice.date }}
                  </td>
                  <td class="text-right font-weight-medium">
                    Rp {{ invoice.amount.toLocaleString('id-ID') }}
                  </td>
                  <td class="text-center">
                    <VChip
                      :color="invoice.statusColor"
                      size="small"
                      label
                      class="font-weight-medium"
                    >
                      {{ invoice.status }}
                    </VChip>
                  </td>
                </tr>
              </tbody>
            </VTable>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useTheme } from 'vuetify'
import { useAuthStore } from '@/stores/auth.store'
import DeferredApexChart from '@/components/shared/DeferredApexChart.vue'
import PicArDashboardSection from '@/modules/Finance/components/PicArDashboardSection.vue'

const authStore = useAuthStore()
const theme = useTheme()

/* --- Dummy Data --- */
// Series data for Area Chart
const revenueChartSeries = ref([
  {
    name: 'Total Ditagihkan',
    data: [310, 420, 280, 510, 420, 690],
  },
  {
    name: 'Total Dibayar',
    data: [210, 320, 180, 410, 390, 520],
  },
])

// Vue ApexCharts Options for Area
const revenueChartOptions = computed(() => {
  const currentTheme = theme.current.value.colors
  
  return {
    chart: {
      type: 'area',
      fontFamily: 'inherit',
      toolbar: { show: false },
      sparkline: { enabled: false },
      dropShadow: {
        enabled: true,
        top: 2,
        left: 0,
        blur: 4,
        color: '#000',
        opacity: 0.1,
      },
    },
    colors: [currentTheme.primary, currentTheme.success],
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.05,
        stops: [0, 90, 100],
      },
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: currentTheme['on-surface'], fontSize: '12px' },
      },
    },
    yaxis: {
      labels: {
        style: { colors: currentTheme['on-surface'] },
        formatter: val => "Rp " + val + " Jt",
      },
    },
    grid: {
      borderColor: 'rgba(var(--v-theme-on-surface), 0.1)',
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      labels: { colors: currentTheme['on-surface'] },
    },
    tooltip: {
      theme: theme.global.name.value,
    },
  }
})

// Series data for Donut Chart
const donutChartSeries = ref([45, 25, 30]) // Example percentages

const donutChartOptions = computed(() => {
  const currentTheme = theme.current.value.colors
  
  return {
    chart: {
      type: 'donut',
      fontFamily: 'inherit',
    },
    labels: ['Paid', 'Unpaid', 'Overdue'],
    colors: [currentTheme.success, currentTheme.warning, currentTheme.error],
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: { show: true },
            value: {
              show: true,
              formatter: val => val + "%",
              color: currentTheme['on-surface'],
            },
            total: {
              show: true,
              showAlways: true,
              label: 'Total',
              color: currentTheme['on-surface'],
              formatter: function (w) {
                return w.globals.seriesTotals.reduce((a, b) => {
                  return a + b
                }, 0) + "%"
              },
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: false },
    legend: {
      position: 'bottom',
      labels: { colors: currentTheme['on-surface'] },
    },
    tooltip: { theme: theme.global.name.value },
  }
})

// Recent Invoices Dummy
const recentInvoices = ref([
  { id: 1, noInvoice: 'INV/2026/04/001', klien: 'PT Maju Bersama', date: '15 Apr 2026', amount: 45000000, status: 'Paid', statusColor: 'success' },
  { id: 2, noInvoice: 'INV/2026/04/002', klien: 'Resto Rasa Nusantara', date: '16 Apr 2026', amount: 12500000, status: 'Unpaid', statusColor: 'warning' },
  { id: 3, noInvoice: 'INV/2026/04/003', klien: 'Budi Investama', date: '17 Apr 2026', amount: 68000000, status: 'Overdue', statusColor: 'error' },
  { id: 4, noInvoice: 'INV/2026/04/004', klien: 'Kopi Kenangan Senja', date: '18 Apr 2026', amount: 9200000, status: 'Draft', statusColor: 'info' },
  { id: 5, noInvoice: 'INV/2026/04/005', klien: 'PT Sinergi Pangan', date: '19 Apr 2026', amount: 34500000, status: 'Paid', statusColor: 'success' },
])
</script>

<style scoped>
.bg-primary-gradient {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgba(var(--v-theme-primary), 0.7) 100%);
}

.stat-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1) !important;
}

.stat-card::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(45deg, transparent 40%, rgba(255, 255, 255, 0.05) 50%, transparent 60%);
  z-index: 0;
  pointer-events: none;
}

.table-row-hover {
  transition: background-color 0.2s ease;
}

.table-row-hover:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.03);
}

.opacity-80 {
  opacity: 0.8;
}
</style>
