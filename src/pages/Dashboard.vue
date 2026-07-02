<template>
  <PicArDashboardSection v-if="authStore.isArOnly" />

  <ManagerDashboardSection v-else-if="authStore.isManager && !authStore.isAdmin" />

  <SupervisorDashboardSection v-else-if="authStore.isSupervisor && !authStore.isAdmin && !authStore.isManager" />

  <div v-else>
    <PageHeader
      title="Overview Dashboard"
      subtitle="Ringkasan aktivitas bisnis dan finansial perusahaan"
    />

    <VAlert
      v-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ error }}
    </VAlert>

    <!-- Summary Cards -->
    <VRow class="mb-4">
      <VCol
        v-for="card in summaryCards"
        :key="card.title"
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
                {{ card.title }}
              </div>
              <div
                class="text-h4 font-weight-bold"
                :class="card.textClass"
              >
                {{ card.value }}
              </div>
            </div>
            <VAvatar
              :color="card.color"
              variant="tonal"
              size="54"
              class="rounded-lg"
            >
              <VIcon
                :icon="card.icon"
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
            <template #append>
              <div class="d-flex flex-wrap gap-1">
                <VBtn
                  v-for="p in trendPeriods"
                  :key="p.value"
                  :variant="trendPeriod === p.value ? 'tonal' : 'text'"
                  :color="trendPeriod === p.value ? 'primary' : undefined"
                  size="x-small"
                  density="compact"
                  :loading="trendLoading && trendPeriod === p.value"
                  @click="selectTrendPeriod(p.value)"
                >{{ p.label }}</VBtn>
              </div>
            </template>
            <VCardSubtitle>{{ trendPeriodLabel }}</VCardSubtitle>
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
              v-if="statusChartHasData"
              type="donut"
              width="100%"
              height="300"
              :delay="300"
              :options="donutChartOptions"
              :series="donutChartSeries"
            />
            <div
              v-else
              class="text-center text-medium-emphasis py-16"
            >
              Belum ada data invoice.
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VRow class="mb-4 mt-0">
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
              5 Invoice Terbaru
            </VCardTitle>
          </VCardItem>
          <VCardText class="px-0">
            <VTable class="text-no-wrap">
              <thead>
                <tr>
                  <th class="text-uppercase font-weight-bold text-caption">No. Invoice</th>
                  <th class="text-uppercase font-weight-bold text-caption">Klien</th>
                  <th class="text-uppercase font-weight-bold text-caption">Tanggal</th>
                  <th class="text-uppercase font-weight-bold text-caption text-right">Total Tagihan</th>
                  <th class="text-uppercase font-weight-bold text-caption text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading">
                  <td colspan="5" class="text-center py-8 text-medium-emphasis">Memuat data...</td>
                </tr>
                <tr v-else-if="recentInvoices.length === 0">
                  <td colspan="5" class="text-center py-8 text-medium-emphasis">Belum ada data invoice.</td>
                </tr>
                <tr
                  v-for="invoice in recentInvoices"
                  v-else
                  :key="invoice.id"
                  class="table-row-hover"
                >
                  <td class="font-weight-medium text-primary">{{ invoice.noInvoice }}</td>
                  <td>{{ invoice.klien }}</td>
                  <td class="text-body-2">{{ invoice.tanggalInvoice }}</td>
                  <td class="text-right font-weight-medium">{{ formatCurrency(invoice.totalTagihan) }}</td>
                  <td class="text-center">
                    <InvoiceStatusBadge :status="invoice.status" />
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
import { computed, defineAsyncComponent, onMounted, ref, shallowRef } from 'vue'
import { useTheme } from 'vuetify'
import { useAuthStore } from '@/stores/auth.store'
import DeferredApexChart from '@/components/shared/DeferredApexChart.vue'
import InvoiceStatusBadge from '@/modules/Finance/shared/components/InvoiceStatusBadge.vue'
import { useFormatter } from '@/composables/useFormatter'
import api from '@/utils/axios'

const PicArDashboardSection = defineAsyncComponent(() => import('@/modules/Finance/features/Dashboard/components/PicArDashboardSection.vue'))
const ManagerDashboardSection = defineAsyncComponent(() => import('@/modules/Finance/features/Dashboard/components/ManagerDashboardSection.vue'))
const SupervisorDashboardSection = defineAsyncComponent(() => import('@/modules/Finance/features/Dashboard/components/SupervisorDashboardSection.vue'))

const authStore = useAuthStore()
const theme     = useTheme()
const { formatCurrency } = useFormatter()

// Mirrors the template's v-if/v-else-if chain — only this branch fetches/renders the full admin dashboard.
const showFullDashboard = computed(() => (
  !authStore.isArOnly
  && !(authStore.isManager && !authStore.isAdmin)
  && !(authStore.isSupervisor && !authStore.isAdmin && !authStore.isManager)
))

const compactFormatter = new Intl.NumberFormat('id-ID', {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 1,
})

const trendPeriods = [
  { label: '1D', value: '1D' },
  { label: '1W', value: '1W' },
  { label: '1M', value: '1M' },
  { label: '3M', value: '3M' },
  { label: '6M', value: '6M' },
  { label: 'YTD', value: 'YTD' },
  { label: '1Y', value: '1Y' },
  { label: '3Y', value: '3Y' },
  { label: '5Y', value: '5Y' },
]

const trendPeriodDescriptions = {
  '1D':  'Hari ini (semua PIC)',
  '1W':  '7 hari terakhir (semua PIC)',
  '1M':  '30 hari terakhir (semua PIC)',
  '3M':  '3 bulan terakhir (semua PIC)',
  '6M':  '6 bulan terakhir (semua PIC)',
  'YTD': 'Tahun berjalan (semua PIC)',
  '1Y':  '12 bulan terakhir (semua PIC)',
  '3Y':  '3 tahun terakhir (semua PIC)',
  '5Y':  '5 tahun terakhir (semua PIC)',
}

const loading      = ref(false)
const trendLoading = ref(false)
const trendPeriod  = ref('6M')
const trendData    = ref({ labels: [], invoiceTotals: [], paymentTotals: [] })
const error        = ref('')
const dashboard    = shallowRef({ summary: {}, statusBreakdown: [], recentInvoices: [] })

const trendPeriodLabel = computed(() => trendPeriodDescriptions[trendPeriod.value] ?? trendPeriod.value)

const summaryCards = computed(() => {
  const s = dashboard.value.summary
  return [
    { title: 'Total Klien', value: loading.value ? '...' : (s.totalKlien ?? 0), icon: 'ri-building-4-line', color: 'primary', textClass: 'text-primary' },
    { title: 'Total Invoice', value: loading.value ? '...' : (s.totalInvoice ?? 0), icon: 'ri-file-list-3-line', color: 'info', textClass: 'text-info' },
    { title: 'Total Tagihan', value: loading.value ? '...' : formatCurrency(s.totalTagihan ?? 0), icon: 'ri-bill-line', color: 'warning', textClass: 'text-warning' },
    { title: 'Sisa Piutang', value: loading.value ? '...' : formatCurrency(s.totalSisa ?? 0), icon: 'ri-error-warning-line', color: 'error', textClass: 'text-error' },
  ]
})

const recentInvoices = computed(() => dashboard.value.recentInvoices ?? [])

const revenueChartSeries = computed(() => [
  { name: 'Total Ditagihkan', data: trendData.value.invoiceTotals },
  { name: 'Total Dibayar',    data: trendData.value.paymentTotals },
])

const revenueChartOptions = computed(() => {
  const c = theme.current.value.colors
  return {
    chart: { type: 'area', fontFamily: 'inherit', toolbar: { show: false } },
    colors: [c.primary, c.success],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 90, 100] } },
    xaxis: {
      categories: trendData.value.labels,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: c['on-surface'], fontSize: '12px' } },
    },
    yaxis: { labels: { style: { colors: c['on-surface'] }, formatter: val => compactFormatter.format(val) } },
    grid: { borderColor: 'rgba(var(--v-theme-on-surface), 0.1)', strokeDashArray: 4 },
    legend: { position: 'top', horizontalAlign: 'right', labels: { colors: c['on-surface'] } },
    tooltip: { theme: theme.global.name.value, y: { formatter: value => formatCurrency(value) } },
  }
})

const statusBreakdown   = computed(() => dashboard.value.statusBreakdown ?? [])
const donutChartSeries  = computed(() => statusBreakdown.value.map(i => i.count))
const statusChartHasData = computed(() => donutChartSeries.value.some(v => v > 0))

const donutChartOptions = computed(() => {
  const c = theme.current.value.colors
  return {
    chart: { type: 'donut', fontFamily: 'inherit' },
    labels: statusBreakdown.value.map(i => i.label),
    colors: [c.info, c.warning, c.primary, c.success],
    plotOptions: { pie: { donut: { size: '70%', labels: { show: true, total: { show: true, showAlways: true, label: 'Total', color: c['on-surface'], formatter: w => w.globals.seriesTotals.reduce((a, b) => a + b, 0) } } } } },
    dataLabels: { enabled: false },
    stroke: { show: false },
    legend: { position: 'bottom', labels: { colors: c['on-surface'] } },
    tooltip: { theme: theme.global.name.value, y: { formatter: v => `${v} invoice` } },
  }
})

async function loadTrend(period) {
  trendLoading.value = true
  try {
    const { data } = await api.get('/finance/dashboard/global', { params: { period } })
    const t = data.data?.monthly_trend ?? {}
    trendData.value = {
      labels:        t.labels ?? [],
      invoiceTotals: (t.invoice_totals ?? []).map(Number),
      paymentTotals: (t.payment_totals ?? []).map(Number),
    }
  } catch {
    // keep existing data on error
  } finally {
    trendLoading.value = false
  }
}

function selectTrendPeriod(period) {
  trendPeriod.value = period
  loadTrend(period)
}

async function loadDashboard() {
  loading.value = true
  error.value   = ''
  try {
    const { data } = await api.get('/finance/dashboard/global')
    const p = data.data
    dashboard.value = {
      summary: {
        totalKlien:      Number(p.summary?.total_klien ?? 0),
        totalInvoice:    Number(p.summary?.total_invoice ?? 0),
        totalTagihan:    Number(p.summary?.total_tagihan ?? 0),
        totalPembayaran: Number(p.summary?.total_pembayaran ?? 0),
        totalSisa:       Number(p.summary?.total_sisa ?? 0),
      },
      statusBreakdown: (p.status_breakdown ?? []).map(i => ({
        status: i.status, label: i.label,
        count: Number(i.count ?? 0),
      })),
      recentInvoices: (p.recent_invoices ?? []).map(i => ({
        id: i.id, noInvoice: i.no_invoice, tanggalInvoice: i.tanggal_invoice,
        klien: i.klien, totalTagihan: Number(i.total_tagihan ?? 0), status: i.status,
      })),
    }
    trendData.value = {
      labels:        p.monthly_trend?.labels ?? [],
      invoiceTotals: (p.monthly_trend?.invoice_totals ?? []).map(Number),
      paymentTotals: (p.monthly_trend?.payment_totals ?? []).map(Number),
    }
  } catch (err) {
    error.value = err.response?.data?.message ?? 'Gagal memuat dashboard'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (showFullDashboard.value)
    loadDashboard()
})
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
