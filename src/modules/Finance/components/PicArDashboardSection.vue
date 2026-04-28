<template>
  <div>
    <PageHeader
      title="Dashboard AR"
      subtitle="Ringkasan klien, resto, invoice, dan pembayaran yang Anda handle"
    >
      <VChip
        color="primary"
        variant="tonal"
        label
      >
        {{ picArName }}
      </VChip>
    </PageHeader>

    <VAlert
      v-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ error }}
    </VAlert>

    <VRow class="mb-4">
      <VCol
        v-for="card in summaryCards"
        :key="card.title"
        cols="12"
        sm="6"
        lg="4"
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
              <div class="text-caption mt-2 text-medium-emphasis">
                {{ card.caption }}
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
              Tren Invoice vs Pembayaran
            </VCardTitle>
            <VCardSubtitle>6 bulan terakhir berdasarkan invoice yang Anda handle</VCardSubtitle>
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
            <VCardSubtitle>Breakdown invoice berdasarkan status</VCardSubtitle>
          </VCardItem>
          <VCardText class="pt-8">
            <div
              v-if="statusChartHasData"
              class="d-flex align-center justify-center"
            >
              <DeferredApexChart
                type="donut"
                width="100%"
                height="300"
                :delay="300"
                :options="donutChartOptions"
                :series="donutChartSeries"
              />
            </div>
            <div
              v-else
              class="text-center text-medium-emphasis py-16"
            >
              Belum ada invoice untuk ditampilkan.
            </div>
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
              5 Invoice Terbaru Anda
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
                    Klien / Resto
                  </th>
                  <th class="text-uppercase font-weight-bold text-caption">
                    Tanggal
                  </th>
                  <th class="text-uppercase font-weight-bold text-caption text-right">
                    Total Tagihan
                  </th>
                  <th class="text-uppercase font-weight-bold text-caption text-right">
                    Sisa
                  </th>
                  <th class="text-uppercase font-weight-bold text-caption text-center">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading">
                  <td
                    colspan="6"
                    class="text-center py-8 text-medium-emphasis"
                  >
                    Memuat data dashboard...
                  </td>
                </tr>
                <tr v-else-if="recentInvoices.length === 0">
                  <td
                    colspan="6"
                    class="text-center py-8 text-medium-emphasis"
                  >
                    Belum ada invoice yang ditangani AR ini.
                  </td>
                </tr>
                <tr
                  v-for="invoice in recentInvoices"
                  v-else
                  :key="invoice.id"
                  class="table-row-hover"
                >
                  <td class="font-weight-medium text-primary">
                    {{ invoice.noInvoice }}
                  </td>
                  <td>
                    <div class="d-flex flex-column py-2">
                      <span>{{ invoice.klien || '-' }}</span>
                      <span class="text-caption text-medium-emphasis">
                        {{ invoice.resto || 'Tanpa resto' }}
                      </span>
                    </div>
                  </td>
                  <td class="text-body-2">
                    {{ formatDate(invoice.tanggalInvoice) }}
                  </td>
                  <td class="text-right font-weight-medium">
                    {{ formatCurrency(invoice.totalTagihan) }}
                  </td>
                  <td
                    class="text-right font-weight-medium"
                    :class="invoice.sisaTagihan > 0 ? 'text-error' : 'text-success'"
                  >
                    {{ formatCurrency(invoice.sisaTagihan) }}
                  </td>
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
import { computed, onMounted, ref, shallowRef } from 'vue'
import { useTheme } from 'vuetify'
import { useAuthStore } from '@/stores/auth.store'
import DeferredApexChart from '@/components/shared/DeferredApexChart.vue'
import { useFormatter } from '@/composables/useFormatter'
import api from '@/utils/axios'
import InvoiceStatusBadge from './InvoiceStatusBadge.vue'

const authStore = useAuthStore()
const theme = useTheme()
const { formatCurrency, formatDate } = useFormatter()

const compactNumberFormatter = new Intl.NumberFormat('id-ID', {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 1,
})

const loading = ref(false)
const error = ref('')
const dashboard = shallowRef(createEmptyDashboard())

const picArName = computed(
  () => dashboard.value.picAr?.nama
    || authStore.user?.karyawan?.nama_karyawan
    || authStore.user?.username
    || 'AR',
)

const summary = computed(() => dashboard.value.summary ?? {})
const statusBreakdown = computed(() => dashboard.value.statusBreakdown ?? [])
const recentInvoices = computed(() => dashboard.value.recentInvoices ?? [])
const monthlyTrend = computed(() => dashboard.value.monthlyTrend ?? createEmptyDashboard().monthlyTrend)

const summaryCards = computed(() => [
  {
    title: 'Total Klien',
    value: loading.value ? '...' : summary.value.totalKlien ?? 0,
    caption: 'Klien AR aktif yang Anda handle',
    icon: 'ri-building-4-line',
    color: 'primary',
    textClass: 'text-primary',
  },
  {
    title: 'Resto Aktif',
    value: loading.value ? '...' : summary.value.totalRestoAktif ?? 0,
    caption: 'Resto aktif yang terhubung ke klien Anda',
    icon: 'ri-store-2-line',
    color: 'success',
    textClass: 'text-success',
  },
  {
    title: 'Total Invoice',
    value: loading.value ? '...' : summary.value.totalInvoice ?? 0,
    caption: 'Seluruh invoice dari klien yang Anda handle',
    icon: 'ri-file-list-3-line',
    color: 'info',
    textClass: 'text-info',
  },
  {
    title: 'Total Tagihan',
    value: loading.value ? '...' : formatCurrency(summary.value.totalTagihan ?? 0),
    caption: 'Akumulasi nominal tagihan',
    icon: 'ri-bill-line',
    color: 'warning',
    textClass: 'text-warning',
  },
  {
    title: 'Total Pembayaran',
    value: loading.value ? '...' : formatCurrency(summary.value.totalPembayaran ?? 0),
    caption: 'Akumulasi pembayaran yang sudah masuk',
    icon: 'ri-money-cny-circle-line',
    color: 'success',
    textClass: 'text-success',
  },
  {
    title: 'Sisa Piutang',
    value: loading.value ? '...' : formatCurrency(summary.value.totalSisa ?? 0),
    caption: 'Outstanding piutang yang masih berjalan',
    icon: 'ri-error-warning-line',
    color: 'error',
    textClass: 'text-error',
  },
])

const revenueChartSeries = computed(() => [
  {
    name: 'Total Ditagihkan',
    data: monthlyTrend.value.invoiceTotals,
  },
  {
    name: 'Total Dibayar',
    data: monthlyTrend.value.paymentTotals,
  },
])

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
      categories: monthlyTrend.value.labels,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: currentTheme['on-surface'], fontSize: '12px' },
      },
    },
    yaxis: {
      labels: {
        style: { colors: currentTheme['on-surface'] },
        formatter: val => formatCompactNumber(val),
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
      y: {
        formatter: value => formatCurrency(value),
      },
    },
  }
})

const donutChartSeries = computed(() => statusBreakdown.value.map(item => item.count))
const statusChartHasData = computed(() => donutChartSeries.value.some(value => value > 0))

const donutChartOptions = computed(() => {
  const currentTheme = theme.current.value.colors

  return {
    chart: {
      type: 'donut',
      fontFamily: 'inherit',
    },
    labels: statusBreakdown.value.map(item => item.label),
    colors: [
      currentTheme.info,
      currentTheme.warning,
      currentTheme.primary,
      currentTheme.success,
    ],
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: { show: true },
            value: {
              show: true,
              formatter: value => `${value} invoice`,
              color: currentTheme['on-surface'],
            },
            total: {
              show: true,
              showAlways: true,
              label: 'Total',
              color: currentTheme['on-surface'],
              formatter: w => w.globals.seriesTotals.reduce((total, value) => total + value, 0),
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
    tooltip: {
      theme: theme.global.name.value,
      y: {
        formatter: value => `${value} invoice`,
      },
    },
  }
})

async function loadDashboard() {
  loading.value = true
  error.value = ''

  try {
    const { data } = await api.get('/finance/dashboard/pic-ar')

    dashboard.value = normalizeDashboard(data.data)
  } catch (err) {
    error.value = err.response?.data?.message ?? 'Gagal memuat dashboard AR'
  } finally {
    loading.value = false
  }
}

function createEmptyDashboard() {
  return {
    picAr: {
      nama: '',
    },
    summary: {
      totalKlien: 0,
      totalRestoAktif: 0,
      totalInvoice: 0,
      totalTagihan: 0,
      totalPembayaran: 0,
      totalSisa: 0,
    },
    statusBreakdown: [
      { status: 'DRAFT', label: 'Draft', count: 0 },
      { status: 'TERKIRIM', label: 'Terkirim', count: 0 },
      { status: 'SEBAGIAN', label: 'Sebagian', count: 0 },
      { status: 'LUNAS', label: 'Lunas', count: 0 },
    ],
    monthlyTrend: {
      labels: [],
      invoiceTotals: [],
      paymentTotals: [],
    },
    recentInvoices: [],
  }
}

function formatCompactNumber(value) {
  return compactNumberFormatter.format(value ?? 0)
}

function normalizeDashboard(payload = {}) {
  return {
    picAr: {
      nama: payload.pic_ar?.nama ?? '',
    },
    summary: {
      totalKlien: Number(payload.summary?.total_klien ?? 0),
      totalRestoAktif: Number(payload.summary?.total_resto_aktif ?? 0),
      totalInvoice: Number(payload.summary?.total_invoice ?? 0),
      totalTagihan: Number(payload.summary?.total_tagihan ?? 0),
      totalPembayaran: Number(payload.summary?.total_pembayaran ?? 0),
      totalSisa: Number(payload.summary?.total_sisa ?? 0),
    },
    statusBreakdown: (payload.status_breakdown ?? []).map(item => ({
      status: item.status,
      label: item.label,
      count: Number(item.count ?? 0),
      totalTagihan: Number(item.total_tagihan ?? 0),
      totalSisa: Number(item.total_sisa ?? 0),
    })),
    monthlyTrend: {
      labels: payload.monthly_trend?.labels ?? [],
      invoiceTotals: (payload.monthly_trend?.invoice_totals ?? []).map(value => Number(value ?? 0)),
      paymentTotals: (payload.monthly_trend?.payment_totals ?? []).map(value => Number(value ?? 0)),
    },
    recentInvoices: (payload.recent_invoices ?? []).map(item => ({
      id: item.id,
      noInvoice: item.no_invoice,
      tanggalInvoice: item.tanggal_invoice,
      klien: item.klien,
      resto: item.resto,
      totalTagihan: Number(item.total_tagihan ?? 0),
      totalPembayaran: Number(item.total_pembayaran ?? 0),
      sisaTagihan: Number(item.sisa_tagihan ?? 0),
      status: item.status,
    })),
  }
}

onMounted(loadDashboard)
</script>

<style scoped>
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
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
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
</style>
