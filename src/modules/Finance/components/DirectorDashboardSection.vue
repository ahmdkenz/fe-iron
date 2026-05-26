<template>
  <div>
    <PageHeader
      title="Dashboard Direktur"
      subtitle="Ringkasan eksekutif kinerja keuangan dan piutang perusahaan"
    >
      <VChip color="primary" variant="tonal" label>Direktur</VChip>
    </PageHeader>

    <VAlert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</VAlert>

    <!-- Approval Alert -->
    <VAlert
      v-if="pendingApprovals > 0"
      type="warning"
      variant="tonal"
      class="mb-4"
      :icon="false"
    >
      <div class="d-flex align-center justify-space-between">
        <div class="d-flex align-center gap-2">
          <VIcon icon="ri-time-line" class="me-2" />
          <span>
            Terdapat <strong>{{ pendingApprovals }} Opening Balance</strong> yang menunggu persetujuan Anda.
          </span>
        </div>
        <RouterLink to="/finance/opening-balance/approval">
          <VBtn color="warning" variant="tonal" size="small" append-icon="ri-arrow-right-line">
            Tinjau Sekarang
          </VBtn>
        </RouterLink>
      </div>
    </VAlert>

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
      <VCol v-for="kpi in kpiCards" :key="kpi.title" cols="12" sm="6" lg="3">
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
      <!-- Revenue Trend 12 Bulan -->
      <VCol cols="12" md="8">
        <VCard elevation="2" class="rounded-xl h-100">
          <VCardItem class="pb-0">
            <VCardTitle class="d-flex align-center text-h6 font-weight-bold">
              <VIcon icon="ri-bar-chart-grouped-line" class="me-2 text-primary" />
              Tren Invoicing & Pembayaran AR
            </VCardTitle>
            <VCardSubtitle>12 bulan terakhir (semua PIC)</VCardSubtitle>
          </VCardItem>
          <VCardText class="pt-4">
            <DeferredApexChart type="area" height="350" :options="revenueChartOptions" :series="revenueChartSeries" />
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
              type="donut" width="100%" height="300" :delay="300"
              :options="donutChartOptions" :series="donutChartSeries"
            />
            <div v-else class="text-center text-medium-emphasis py-16">Belum ada data invoice.</div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Aging Distribution -->
    <VRow class="mt-0 mb-0">
      <VCol cols="12">
        <VCard elevation="2" class="rounded-xl">
          <VCardItem class="pb-0">
            <VCardTitle class="d-flex align-center text-h6 font-weight-bold">
              <VIcon icon="ri-time-line" class="me-2 text-warning" />
              Aging Piutang — Distribusi Outstanding
            </VCardTitle>
            <VCardSubtitle>Nilai sisa piutang berdasarkan umur tagihan</VCardSubtitle>
          </VCardItem>
          <VCardText class="pt-4">
            <DeferredApexChart type="bar" height="200" :delay="300" :options="agingChartOptions" :series="agingChartSeries" />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VRow class="mt-0">
      <!-- AR Performance Table -->
      <VCol cols="12" md="7">
        <VCard elevation="2" class="rounded-xl h-100">
          <VCardItem>
            <VCardTitle class="d-flex align-center text-h6 font-weight-bold">
              <VIcon icon="ri-team-line" class="me-2 text-info" />
              Kinerja Tim AR
            </VCardTitle>
            <VCardSubtitle>Perbandingan kinerja per PIC AR bulan berjalan</VCardSubtitle>
          </VCardItem>
          <VCardText class="px-0">
            <VTable class="text-no-wrap">
              <thead>
                <tr>
                  <th class="text-uppercase font-weight-bold text-caption">Nama AR</th>
                  <th class="text-uppercase font-weight-bold text-caption text-right">Klien</th>
                  <th class="text-uppercase font-weight-bold text-caption text-right">Total Tagihan</th>
                  <th class="text-uppercase font-weight-bold text-caption text-right">Terkumpul</th>
                  <th class="text-uppercase font-weight-bold text-caption text-center">Collection Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingKinerja">
                  <td colspan="5" class="text-center py-8 text-medium-emphasis">Memuat data...</td>
                </tr>
                <tr v-else-if="arPerformance.length === 0">
                  <td colspan="5" class="text-center py-8 text-medium-emphasis">Tidak ada data kinerja AR.</td>
                </tr>
                <tr v-for="ar in arPerformance" v-else :key="ar.karyawan_id" class="table-row-hover">
                  <td class="font-weight-medium">{{ ar.nama_karyawan }}</td>
                  <td class="text-right">{{ ar.jumlah_klien }}</td>
                  <td class="text-right">{{ formatCurrency(ar.total_tagihan) }}</td>
                  <td class="text-right text-success font-weight-medium">{{ formatCurrency(ar.total_terkumpul) }}</td>
                  <td class="text-center">
                    <VChip
                      :color="ar.collection_rate >= 90 ? 'success' : ar.collection_rate >= 70 ? 'warning' : 'error'"
                      size="x-small" variant="tonal" label
                    >
                      {{ ar.collection_rate }}%
                    </VChip>
                  </td>
                </tr>
              </tbody>
            </VTable>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Top 5 Klien by Outstanding -->
      <VCol cols="12" md="5">
        <VCard elevation="2" class="rounded-xl h-100">
          <VCardItem>
            <VCardTitle class="d-flex align-center text-h6 font-weight-bold">
              <VIcon icon="ri-building-4-line" class="me-2 text-error" />
              Top 5 Klien — Sisa Piutang Terbesar
            </VCardTitle>
            <VCardSubtitle>Klien dengan outstanding tertinggi saat ini</VCardSubtitle>
          </VCardItem>
          <VCardText class="px-0">
            <VTable class="text-no-wrap">
              <thead>
                <tr>
                  <th class="text-uppercase font-weight-bold text-caption">Klien</th>
                  <th class="text-uppercase font-weight-bold text-caption text-right">Invoice</th>
                  <th class="text-uppercase font-weight-bold text-caption text-right">Sisa Piutang</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingTopClients">
                  <td colspan="3" class="text-center py-8 text-medium-emphasis">Memuat data...</td>
                </tr>
                <tr v-else-if="topClients.length === 0">
                  <td colspan="3" class="text-center py-8 text-medium-emphasis">Tidak ada data.</td>
                </tr>
                <tr v-for="(klien, idx) in topClients" v-else :key="klien.id" class="table-row-hover">
                  <td>
                    <div class="d-flex align-center gap-2">
                      <VAvatar :color="topClientColors[idx]" variant="tonal" size="28" class="text-caption font-weight-bold">
                        {{ idx + 1 }}
                      </VAvatar>
                      <div>
                        <div class="font-weight-medium">{{ klien.nama_klien }}</div>
                        <div class="text-caption text-medium-emphasis">{{ klien.kode_klien }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="text-right text-body-2">{{ klien.jumlah_invoice }}</td>
                  <td class="text-right font-weight-bold text-error">{{ formatCurrency(klien.total_sisa) }}</td>
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
import { RouterLink } from 'vue-router'
import { useTheme } from 'vuetify'
import DeferredApexChart from '@/components/shared/DeferredApexChart.vue'
import PageHeader from '@/components/shared/PageHeader.vue'
import { useFormatter } from '@/composables/useFormatter'
import api from '@/utils/axios'

const theme = useTheme()
const { formatCurrency } = useFormatter()

const compactFormatter = new Intl.NumberFormat('id-ID', {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 1,
})

const loading           = ref(false)
const loadingKinerja    = ref(false)
const loadingTopClients = ref(false)
const error             = ref('')

const dashboard       = shallowRef(createEmptyDashboard())
const kpi             = shallowRef(createEmptyKpi())
const arPerformance   = ref([])
const topClients      = ref([])
const pendingApprovals = ref(0)

const topClientColors = ['error', 'warning', 'orange', 'info', 'secondary']

// ─── Summary Cards ────────────────────────────────────────────────────────────

const summaryCards = computed(() => {
  const s = dashboard.value.summary
  const k = kpi.value
  return [
    {
      title: 'Total Tagihan',
      value: loading.value ? '...' : formatCurrency(s.totalTagihan ?? 0),
      caption: 'Akumulasi seluruh tagihan',
      icon: 'ri-bill-line', color: 'warning', textClass: 'text-warning',
    },
    {
      title: 'Sisa Piutang',
      value: loading.value ? '...' : formatCurrency(s.totalSisa ?? 0),
      caption: 'Outstanding yang belum terbayar',
      icon: 'ri-error-warning-line', color: 'error', textClass: 'text-error',
    },
    {
      title: 'Collection Rate',
      value: loading.value ? '...' : `${k.collectionRate ?? 0}%`,
      caption: 'Persentase piutang terkumpul',
      icon: 'ri-percent-line', color: 'success', textClass: 'text-success',
    },
    {
      title: 'Invoice Overdue',
      value: loading.value ? '...' : (k.overdueCount ?? 0),
      caption: `${k.overduePercentage ?? 0}% dari total invoice`,
      icon: 'ri-alarm-warning-line', color: 'error', textClass: 'text-error',
    },
  ]
})

// ─── KPI Cards ────────────────────────────────────────────────────────────────

const kpiCards = computed(() => {
  const k = kpi.value
  const aging91 = k.agingSummary?.hari_91_plus ?? 0
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
    {
      title: 'Piutang > 90 Hari',
      value: loading.value ? '...' : formatCurrency(aging91),
      caption: 'Nominal outstanding kritis',
      icon: 'ri-fire-line',
      color: aging91 > 0 ? 'error' : 'success',
    },
  ]
})

// ─── Charts ───────────────────────────────────────────────────────────────────

const revenueChartSeries = computed(() => [
  { name: 'Total Ditagihkan', data: dashboard.value.monthlyTrend?.invoiceTotals ?? [] },
  { name: 'Total Dibayar',    data: dashboard.value.monthlyTrend?.paymentTotals ?? [] },
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
      categories: dashboard.value.monthlyTrend?.labels ?? [],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: c['on-surface'], fontSize: '11px' } },
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

// ─── Data Loading ─────────────────────────────────────────────────────────────

async function loadDashboard() {
  loading.value = true
  error.value   = ''
  try {
    const [dashRes, kpiRes] = await Promise.all([
      api.get('/finance/dashboard/global', { params: { months: 12 } }),
      api.get('/finance/dashboard/kpi'),
    ])
    dashboard.value = normalizeDashboard(dashRes.data.data)
    kpi.value       = normalizeKpi(kpiRes.data.data)
  } catch (err) {
    error.value = err.response?.data?.message ?? 'Gagal memuat dashboard'
  } finally {
    loading.value = false
  }
}

async function loadKinerja() {
  loadingKinerja.value = true
  try {
    const { data } = await api.get('/finance/kinerja-ar')
    arPerformance.value = (data.data?.rows ?? []).map(r => ({
      karyawan_id:    r.karyawan_id,
      nama_karyawan:  r.nama_karyawan,
      jumlah_klien:   r.jumlah_klien,
      total_tagihan:  Number(r.total_tagihan ?? 0),
      total_terkumpul: Number(r.total_terkumpul ?? 0),
      collection_rate: Number(r.collection_rate ?? 0),
    }))
  } catch {
    // non-critical
  } finally {
    loadingKinerja.value = false
  }
}

async function loadTopClients() {
  loadingTopClients.value = true
  try {
    const { data } = await api.get('/finance/dashboard/top-clients')
    topClients.value = data.data ?? []
  } catch {
    // non-critical
  } finally {
    loadingTopClients.value = false
  }
}

async function loadPendingApprovals() {
  try {
    const { data } = await api.get('/finance/opening-balance', {
      params: { approval_status: 'PENDING', per_page: 1 },
    })
    pendingApprovals.value = data.meta?.total ?? data.data?.total ?? 0
  } catch {
    // non-critical
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
  loadKinerja()
  loadTopClients()
  loadPendingApprovals()
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
