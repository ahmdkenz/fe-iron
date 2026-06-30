<template>
  <div>
    <PageHeader
      title="Dashboard Supervisor"
      subtitle="Monitoring operasional harian — overdue, pembayaran, dan piutang berjalan"
    >
      <VChip color="secondary" variant="tonal" label>Supervisor</VChip>
    </PageHeader>

    <VAlert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</VAlert>

    <!-- Summary Cards -->
    <VRow class="mb-4">
      <VCol v-for="card in summaryCards" :key="card.title" cols="12" sm="6" lg="3">
        <VCard elevation="2" class="rounded-xl stat-card">
          <VCardText class="d-flex align-center justify-space-between fill-height bg-surface">
            <div>
              <div class="text-subtitle-2 text-medium-emphasis text-uppercase font-weight-medium mb-1">
                {{ card.title }}
              </div>
              <div class="text-h4 font-weight-bold" :class="card.textClass">
                {{ card.value }}
              </div>
              <div class="text-caption mt-1 text-medium-emphasis">{{ card.caption }}</div>
            </div>
            <VAvatar :color="card.color" variant="tonal" size="54" class="rounded-lg">
              <VIcon :icon="card.icon" size="30" />
            </VAvatar>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- KPI Cards -->
    <VRow class="mb-4">
      <VCol v-for="kpi in kpiCards" :key="kpi.title" cols="12" sm="4">
        <VCard elevation="2" class="rounded-xl">
          <VCardText class="bg-surface">
            <div class="d-flex align-center justify-space-between mb-3">
              <span class="text-caption text-uppercase font-weight-bold text-medium-emphasis">{{ kpi.title }}</span>
              <VIcon :icon="kpi.icon" size="18" :color="kpi.color" />
            </div>
            <div class="text-h5 font-weight-bold mb-1" :class="`text-${kpi.color}`">{{ kpi.value }}</div>
            <div class="text-caption text-medium-emphasis">{{ kpi.caption }}</div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VRow>
      <!-- Revenue Trend -->
      <VCol cols="12" md="8">
        <VCard elevation="2" class="rounded-xl h-100">
          <VCardItem class="pb-0">
            <VCardTitle class="d-flex align-center text-h6 font-weight-bold">
              <VIcon icon="ri-bar-chart-grouped-line" class="me-2 text-primary" />
              Tren Invoicing & Pembayaran
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
            <DeferredApexChart type="area" height="320" :options="revenueChartOptions" :series="revenueChartSeries" />
          </VCardText>
        </VCard>
      </VCol>

      <!-- Invoice Status Donut -->
      <VCol cols="12" md="4">
        <VCard elevation="2" class="rounded-xl h-100">
          <VCardItem class="pb-0">
            <VCardTitle class="text-h6 font-weight-bold">Status Invoice</VCardTitle>
            <VCardSubtitle>Proporsi tagihan aktif</VCardSubtitle>
          </VCardItem>
          <VCardText class="d-flex align-center justify-center pt-8">
            <DeferredApexChart
              v-if="statusChartHasData"
              type="donut" width="100%" height="280" :delay="300"
              :options="donutChartOptions" :series="donutChartSeries"
            />
            <div v-else class="text-center text-medium-emphasis py-16">Belum ada data invoice.</div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Aging Chart -->
    <VRow class="mt-0 mb-0">
      <VCol cols="12">
        <VCard elevation="2" class="rounded-xl">
          <VCardItem class="pb-0">
            <VCardTitle class="d-flex align-center text-h6 font-weight-bold">
              <VIcon icon="ri-time-line" class="me-2 text-warning" />
              Aging Piutang
            </VCardTitle>
            <VCardSubtitle>Distribusi outstanding berdasarkan umur tagihan</VCardSubtitle>
          </VCardItem>
          <VCardText class="pt-4">
            <DeferredApexChart type="bar" height="200" :delay="300" :options="agingChartOptions" :series="agingChartSeries" />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VRow class="mt-0">
      <!-- Invoice Jatuh Tempo List -->
      <VCol cols="12" md="6">
        <VCard elevation="2" class="rounded-xl">
          <VCardItem>
            <VCardTitle class="d-flex align-center text-h6 font-weight-bold">
              <VIcon icon="ri-calendar-close-line" class="me-2 text-error" />
              Invoice Jatuh Tempo
            </VCardTitle>
            <VCardSubtitle>Invoice segera atau sudah jatuh tempo</VCardSubtitle>
          </VCardItem>
          <VCardText class="px-0">
            <VTable class="text-no-wrap">
              <thead>
                <tr>
                  <th class="text-uppercase font-weight-bold text-caption">No. Invoice</th>
                  <th class="text-uppercase font-weight-bold text-caption">Klien</th>
                  <th class="text-uppercase font-weight-bold text-caption text-right">Sisa Tagihan</th>
                  <th class="text-uppercase font-weight-bold text-caption text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingJatuhTempo">
                  <td colspan="4" class="text-center py-8 text-medium-emphasis">Memuat data...</td>
                </tr>
                <tr v-else-if="jatuhTempoList.length === 0">
                  <td colspan="4" class="text-center py-8 text-medium-emphasis">Tidak ada invoice jatuh tempo.</td>
                </tr>
                <tr v-for="inv in jatuhTempoList" v-else :key="inv.id" class="table-row-hover">
                  <td class="font-weight-medium text-primary">{{ inv.no_invoice }}</td>
                  <td>{{ inv.klien ?? inv.nama_klien ?? '—' }}</td>
                  <td class="text-right font-weight-medium text-error">{{ formatCurrency(inv.sisa_tagihan ?? inv.total_sisa ?? 0) }}</td>
                  <td class="text-center">
                    <InvoiceStatusBadge :status="inv.status" />
                  </td>
                </tr>
              </tbody>
            </VTable>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Recent Invoices -->
      <VCol cols="12" md="6">
        <VCard elevation="2" class="rounded-xl">
          <VCardItem>
            <VCardTitle class="d-flex align-center text-h6 font-weight-bold">
              <VIcon icon="ri-history-line" class="me-2 text-primary" />
              5 Invoice Terbaru
            </VCardTitle>
          </VCardItem>
          <VCardText class="px-0">
            <VTable class="text-no-wrap">
              <thead>
                <tr>
                  <th class="text-uppercase font-weight-bold text-caption">No. Invoice</th>
                  <th class="text-uppercase font-weight-bold text-caption">Klien</th>
                  <th class="text-uppercase font-weight-bold text-caption text-right">Sisa</th>
                  <th class="text-uppercase font-weight-bold text-caption text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading">
                  <td colspan="4" class="text-center py-8 text-medium-emphasis">Memuat data...</td>
                </tr>
                <tr v-else-if="recentInvoices.length === 0">
                  <td colspan="4" class="text-center py-8 text-medium-emphasis">Belum ada data.</td>
                </tr>
                <tr v-for="inv in recentInvoices" v-else :key="inv.id" class="table-row-hover">
                  <td class="font-weight-medium text-primary">{{ inv.noInvoice }}</td>
                  <td>{{ inv.klien }}</td>
                  <td class="text-right font-weight-medium" :class="inv.sisaTagihan > 0 ? 'text-error' : 'text-success'">
                    {{ formatCurrency(inv.sisaTagihan) }}
                  </td>
                  <td class="text-center">
                    <InvoiceStatusBadge :status="inv.status" />
                  </td>
                </tr>
              </tbody>
            </VTable>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Recent Payments -->
    <VRow class="mt-0">
      <VCol cols="12">
        <VCard elevation="2" class="rounded-xl">
          <VCardItem>
            <VCardTitle class="d-flex align-center justify-space-between text-h6 font-weight-bold">
              <div class="d-flex align-center">
                <VIcon icon="ri-money-cny-circle-line" class="me-2 text-success" />
                5 Pembayaran Terbaru
              </div>
              <VChip
                v-if="rekonPendingCount > 0"
                color="warning" size="small" variant="tonal" label
              >
                {{ rekonPendingCount }} belum direkonsiliasi
              </VChip>
            </VCardTitle>
          </VCardItem>
          <VCardText class="px-0">
            <VTable class="text-no-wrap">
              <thead>
                <tr>
                  <th class="text-uppercase font-weight-bold text-caption">No. Referensi</th>
                  <th class="text-uppercase font-weight-bold text-caption">Invoice / Klien</th>
                  <th class="text-uppercase font-weight-bold text-caption">Tgl Bayar</th>
                  <th class="text-uppercase font-weight-bold text-caption text-right">Jumlah</th>
                  <th class="text-uppercase font-weight-bold text-caption text-center">Metode</th>
                  <th class="text-uppercase font-weight-bold text-caption text-center">Status Rekon</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingPayments">
                  <td colspan="6" class="text-center py-8 text-medium-emphasis">Memuat data...</td>
                </tr>
                <tr v-else-if="recentPayments.length === 0">
                  <td colspan="6" class="text-center py-8 text-medium-emphasis">Belum ada pembayaran tercatat.</td>
                </tr>
                <tr v-for="pay in recentPayments" v-else :key="pay.id" class="table-row-hover">
                  <td class="font-weight-medium">{{ pay.no_referensi ?? '—' }}</td>
                  <td>
                    <div class="d-flex flex-column py-1">
                      <span class="font-weight-medium">{{ pay.no_invoice ?? '—' }}</span>
                      <span class="text-caption text-medium-emphasis">{{ pay.klien ?? '' }}</span>
                    </div>
                  </td>
                  <td class="text-body-2">{{ formatDate(pay.tanggal_pembayaran) }}</td>
                  <td class="text-right font-weight-medium text-success">{{ formatCurrency(pay.jumlah_pembayaran) }}</td>
                  <td class="text-center">
                    <VChip
                      :color="metodeColorMap[pay.metode_pembayaran] ?? 'default'"
                      size="x-small" variant="tonal" label
                    >
                      {{ pay.metode_pembayaran }}
                    </VChip>
                  </td>
                  <td class="text-center">
                    <VChip
                      v-if="pay.status_rekonsiliasi"
                      :color="rekonColorMap[pay.status_rekonsiliasi] ?? 'default'"
                      size="x-small" variant="tonal" label
                    >
                      {{ pay.status_rekonsiliasi }}
                    </VChip>
                    <VChip v-else size="x-small" variant="tonal" color="warning" label>Belum Diproses</VChip>
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
import DeferredApexChart from '@/components/shared/DeferredApexChart.vue'
import PageHeader from '@/components/shared/PageHeader.vue'
import InvoiceStatusBadge from '@/modules/Finance/shared/components/InvoiceStatusBadge.vue'
import { useFormatter } from '@/composables/useFormatter'
import api from '@/utils/axios'

const theme = useTheme()
const { formatCurrency, formatDate } = useFormatter()

const compactFormatter = new Intl.NumberFormat('id-ID', {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 1,
})

const metodeColorMap = { TRANSFER: 'info', CASH: 'success', GIRO: 'warning' }
const rekonColorMap  = { MATCHED: 'success', POSSIBLE: 'warning', UNMATCHED: 'error', DIABAIKAN: 'secondary' }

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
  '1D':  'Hari ini',
  '1W':  '7 hari terakhir',
  '1M':  '30 hari terakhir',
  '3M':  '3 bulan terakhir',
  '6M':  '6 bulan terakhir',
  'YTD': 'Tahun berjalan',
  '1Y':  '12 bulan terakhir',
  '3Y':  '3 tahun terakhir',
  '5Y':  '5 tahun terakhir',
}

const loading           = ref(false)
const loadingJatuhTempo = ref(false)
const loadingPayments   = ref(false)
const trendLoading      = ref(false)
const trendPeriod       = ref('6M')
const trendData         = ref({ labels: [], invoiceTotals: [], paymentTotals: [] })
const error             = ref('')

const trendPeriodLabel = computed(() => trendPeriodDescriptions[trendPeriod.value] ?? trendPeriod.value)

const dashboard      = shallowRef(createEmptyDashboard())
const kpi            = shallowRef(createEmptyKpi())
const jatuhTempoList = ref([])
const recentPayments = ref([])
const rekonPendingCount = ref(0)

// ─── Summary Cards ────────────────────────────────────────────────────────────

const summaryCards = computed(() => {
  const s = dashboard.value.summary
  const k = kpi.value
  const pembayaranBulanIni = dashboard.value.monthlyTrend?.paymentTotals?.at(-1) ?? 0

  return [
    {
      title: 'Invoice Aktif',
      value: loading.value ? '...' : (s.totalInvoice ?? 0),
      caption: 'Total invoice seluruh status',
      icon: 'ri-file-list-3-line', color: 'primary', textClass: 'text-primary',
    },
    {
      title: 'Invoice Overdue',
      value: loading.value ? '...' : (k.overdueCount ?? 0),
      caption: `${k.overduePercentage ?? 0}% dari total, > 30 hari`,
      icon: 'ri-alarm-warning-line',
      color: (k.overdueCount ?? 0) > 0 ? 'error' : 'success',
      textClass: (k.overdueCount ?? 0) > 0 ? 'text-error' : 'text-success',
    },
    {
      title: 'Pembayaran Bulan Ini',
      value: loading.value ? '...' : formatCurrency(pembayaranBulanIni),
      caption: 'Total diterima bulan berjalan',
      icon: 'ri-money-cny-circle-line', color: 'success', textClass: 'text-success',
    },
    {
      title: 'Rekonsiliasi Tertunda',
      value: loadingPayments.value ? '...' : rekonPendingCount.value,
      caption: rekonPendingCount.value > 0 ? 'Transaksi perlu diproses' : 'Semua sudah diproses',
      icon: 'ri-bank-line',
      color: rekonPendingCount.value > 0 ? 'warning' : 'success',
      textClass: rekonPendingCount.value > 0 ? 'text-warning' : 'text-success',
    },
  ]
})

// ─── KPI Cards ────────────────────────────────────────────────────────────────

const kpiCards = computed(() => {
  const k = kpi.value
  return [
    {
      title: 'DSO',
      value: loading.value ? '...' : `${k.dso ?? 0} hari`,
      caption: 'Rata-rata hari piutang beredar',
      icon: 'ri-calendar-check-line',
      color: (k.dso ?? 0) > 30 ? 'error' : (k.dso ?? 0) > 15 ? 'warning' : 'success',
    },
    {
      title: 'Collection Rate',
      value: loading.value ? '...' : `${k.collectionRate ?? 0}%`,
      caption: 'Piutang berhasil terkumpul',
      icon: 'ri-percent-line',
      color: (k.collectionRate ?? 0) >= 90 ? 'success' : (k.collectionRate ?? 0) >= 70 ? 'warning' : 'error',
    },
    {
      title: 'Invoice Overdue',
      value: loading.value ? '...' : `${k.overduePercentage ?? 0}%`,
      caption: `${k.overdueCount ?? 0} invoice belum lunas > 30 hari`,
      icon: 'ri-alarm-warning-line',
      color: (k.overduePercentage ?? 0) > 20 ? 'error' : (k.overduePercentage ?? 0) > 10 ? 'warning' : 'success',
    },
  ]
})

// ─── Charts ───────────────────────────────────────────────────────────────────

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

const statusBreakdown    = computed(() => dashboard.value.statusBreakdown ?? [])
const donutChartSeries   = computed(() => statusBreakdown.value.map(i => i.count))
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

const agingChartSeries = computed(() => {
  const s = kpi.value.agingSummary
  return [{ name: 'Sisa Piutang', data: [s.current ?? 0, s.hari_1_30 ?? 0, s.hari_31_60 ?? 0, s.hari_61_90 ?? 0, s.hari_91_plus ?? 0] }]
})

const agingChartOptions = computed(() => {
  const c = theme.current.value.colors
  return {
    chart: { type: 'bar', fontFamily: 'inherit', toolbar: { show: false } },
    plotOptions: { bar: { horizontal: true, borderRadius: 6, dataLabels: { position: 'top' } } },
    colors: [c.success, c.info, c.warning, c.error, '#8B0000'],
    fill: { type: 'solid' },
    dataLabels: {
      enabled: true,
      formatter: val => compactFormatter.format(val),
      style: { colors: [c['on-surface']] },
      offsetX: 4,
    },
    xaxis: {
      categories: ['Belum Jatuh Tempo', '1–30 Hari', '31–60 Hari', '61–90 Hari', '>90 Hari'],
      labels: { style: { colors: c['on-surface'] }, formatter: val => compactFormatter.format(val) },
    },
    yaxis: { labels: { style: { colors: c['on-surface'] } } },
    grid: { borderColor: 'rgba(var(--v-theme-on-surface), 0.08)' },
    tooltip: { theme: theme.global.name.value, y: { formatter: value => formatCurrency(value) } },
    legend: { show: false },
  }
})

const recentInvoices = computed(() => dashboard.value.recentInvoices ?? [])

// ─── Data Loading ─────────────────────────────────────────────────────────────

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
    const [dashRes, kpiRes] = await Promise.all([
      api.get('/finance/dashboard/global'),
      api.get('/finance/dashboard/kpi'),
    ])
    dashboard.value = normalizeDashboard(dashRes.data.data)
    kpi.value       = normalizeKpi(kpiRes.data.data)
    trendData.value = { ...dashboard.value.monthlyTrend }
  } catch (err) {
    error.value = err.response?.data?.message ?? 'Gagal memuat dashboard'
  } finally {
    loading.value = false
  }
}

async function loadJatuhTempo() {
  loadingJatuhTempo.value = true
  try {
    const { data } = await api.get('/finance/jatuh-tempo', { params: { per_page: 10 } })
    jatuhTempoList.value = data.data ?? []
  } catch {
    // non-critical
  } finally {
    loadingJatuhTempo.value = false
  }
}

async function loadRecentPayments() {
  loadingPayments.value = true
  try {
    const { data } = await api.get('/finance/jurnal-pic', { params: { per_page: 5, page: 1 } })
    recentPayments.value  = data.data ?? []
    const summary = data.summary ?? {}
    rekonPendingCount.value = summary.total_belum_cocok ?? 0
  } catch {
    // non-critical
  } finally {
    loadingPayments.value = false
  }
}

// ─── Normalizers ─────────────────────────────────────────────────────────────

function normalizeDashboard(p = {}) {
  return {
    summary: {
      totalKlien:      Number(p.summary?.total_klien ?? 0),
      totalInvoice:    Number(p.summary?.total_invoice ?? 0),
      totalTagihan:    Number(p.summary?.total_tagihan ?? 0),
      totalPembayaran: Number(p.summary?.total_pembayaran ?? 0),
      totalSisa:       Number(p.summary?.total_sisa ?? 0),
    },
    statusBreakdown: (p.status_breakdown ?? []).map(i => ({
      status: i.status, label: i.label, count: Number(i.count ?? 0),
    })),
    monthlyTrend: {
      labels:        p.monthly_trend?.labels ?? [],
      invoiceTotals: (p.monthly_trend?.invoice_totals ?? []).map(Number),
      paymentTotals: (p.monthly_trend?.payment_totals ?? []).map(Number),
    },
    recentInvoices: (p.recent_invoices ?? []).map(i => ({
      id: i.id, noInvoice: i.no_invoice, tanggalInvoice: i.tanggal_invoice,
      klien: i.klien, totalTagihan: Number(i.total_tagihan ?? 0),
      sisaTagihan: Number(i.sisa_tagihan ?? 0), status: i.status,
    })),
  }
}

function normalizeKpi(p = {}) {
  return {
    dso:               Number(p.dso ?? 0),
    collectionRate:    Number(p.collection_rate ?? 0),
    overdueCount:      Number(p.overdue_count ?? 0),
    overduePercentage: Number(p.overdue_percentage ?? 0),
    agingSummary: {
      current:      Number(p.aging_summary?.current ?? 0),
      hari_1_30:    Number(p.aging_summary?.hari_1_30 ?? 0),
      hari_31_60:   Number(p.aging_summary?.hari_31_60 ?? 0),
      hari_61_90:   Number(p.aging_summary?.hari_61_90 ?? 0),
      hari_91_plus: Number(p.aging_summary?.hari_91_plus ?? 0),
    },
  }
}

function createEmptyDashboard() {
  return {
    summary: { totalKlien: 0, totalInvoice: 0, totalTagihan: 0, totalPembayaran: 0, totalSisa: 0 },
    statusBreakdown: [
      { status: 'DRAFT', label: 'Draft', count: 0 },
      { status: 'TERKIRIM', label: 'Terkirim', count: 0 },
      { status: 'SEBAGIAN', label: 'Sebagian', count: 0 },
      { status: 'LUNAS', label: 'Lunas', count: 0 },
    ],
    monthlyTrend: { labels: [], invoiceTotals: [], paymentTotals: [] },
    recentInvoices: [],
  }
}

function createEmptyKpi() {
  return {
    dso: 0, collectionRate: 0, overdueCount: 0, overduePercentage: 0,
    agingSummary: { current: 0, hari_1_30: 0, hari_31_60: 0, hari_61_90: 0, hari_91_plus: 0 },
  }
}

onMounted(() => {
  loadDashboard()
  loadJatuhTempo()
  loadRecentPayments()
})
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
</style>
