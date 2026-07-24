<template>
  <div>
    <PageHeader
      title="Dashboard AP"
      subtitle="Ringkasan Account Payable"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Dashboard AP', disabled: true }
      ]"
    />

    <VAlert
      v-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ error }}
    </VAlert>

    <!-- Stat Cards -->
    <VRow class="mb-4">
      <VCol
        v-for="card in statCards"
        :key="card.title"
        cols="12"
        sm="6"
        lg="4"
      >
        <VCard
          elevation="2"
          class="rounded-xl stat-card"
        >
          <VCardText class="d-flex align-center justify-space-between fill-height bg-surface gap-2">
            <div class="min-width-0">
              <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium mb-1">
                {{ card.title }}
              </div>
              <div
                class="text-h5 font-weight-bold text-truncate"
                :class="`text-${card.color}`"
              >
                {{ loading ? '...' : card.value }}
              </div>
              <div class="text-caption mt-1 text-medium-emphasis">
                {{ card.caption }}
              </div>
            </div>
            <VAvatar
              :color="card.color"
              variant="tonal"
              size="48"
              class="rounded-lg flex-shrink-0"
            >
              <VIcon
                :icon="card.icon"
                size="24"
              />
            </VAvatar>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VRow class="mb-4">
      <!-- Aging Hutang -->
      <VCol
        cols="12"
        md="4"
      >
        <VCard
          elevation="2"
          class="rounded-xl h-100"
        >
          <VCardItem>
            <VCardTitle class="d-flex align-center text-h6 font-weight-bold">
              <VIcon
                icon="ri-time-line"
                class="me-2 text-warning"
              />
              Aging Hutang
            </VCardTitle>
            <VCardSubtitle>Outstanding berdasarkan umur jatuh tempo</VCardSubtitle>
          </VCardItem>
          <VCardText>
            <div
              v-if="loading"
              class="text-center text-medium-emphasis py-8"
            >
              Memuat...
            </div>
            <template v-else>
              <div
                v-for="bucket in agingRows"
                :key="bucket.key"
                class="aging-row mb-3"
              >
                <div class="d-flex justify-space-between align-center mb-1">
                  <span class="text-body-2">{{ bucket.label }}</span>
                  <span class="text-body-2 font-weight-medium">{{ formatCurrency(bucket.value) }}</span>
                </div>
                <VProgressLinear
                  :model-value="bucket.pct"
                  :color="bucket.color"
                  height="8"
                  rounded
                  bg-color="rgba(var(--v-theme-on-surface), 0.08)"
                />
                <div class="text-caption text-medium-emphasis mt-1 text-right">
                  {{ bucket.pct }}% dari total
                </div>
              </div>
              <VDivider class="my-2" />
              <div class="d-flex justify-space-between align-center">
                <span class="text-subtitle-2 font-weight-bold">Total</span>
                <span class="text-subtitle-2 font-weight-bold">{{ formatCurrency(summary.total_outstanding) }}</span>
              </div>
            </template>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Trend Pembayaran -->
      <VCol
        cols="12"
        md="5"
      >
        <VCard
          elevation="2"
          class="rounded-xl h-100 chart-card"
        >
          <VCardItem>
            <VCardTitle class="d-flex align-center text-h6 font-weight-bold">
              <VIcon
                icon="ri-bar-chart-grouped-line"
                class="me-2 text-primary"
              />
              Trend Pembayaran
            </VCardTitle>
            <VCardSubtitle>6 bulan terakhir</VCardSubtitle>
          </VCardItem>
          <VCardText>
            <DeferredApexChart
              type="line"
              height="280"
              :options="trendChartOptions"
              :series="trendChartSeries"
            />
          </VCardText>
        </VCard>
      </VCol>

      <!-- Status Pembayaran Donut -->
      <VCol
        cols="12"
        md="3"
      >
        <VCard
          elevation="2"
          class="rounded-xl h-100 chart-card"
        >
          <VCardItem>
            <VCardTitle class="text-h6 font-weight-bold">
              Status Pembayaran
            </VCardTitle>
            <VCardSubtitle>Tagihan disetujui</VCardSubtitle>
          </VCardItem>
          <VCardText class="d-flex align-center justify-center pt-2">
            <DeferredApexChart
              v-if="statusHasData"
              type="donut"
              width="100%"
              height="240"
              :delay="200"
              :options="statusChartOptions"
              :series="statusChartSeries"
            />
            <div
              v-else
              class="text-center text-medium-emphasis py-16"
            >
              Belum ada data.
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VRow class="mb-4">
      <!-- Top 5 Vendor -->
      <VCol
        cols="12"
        md="6"
      >
        <VCard
          elevation="2"
          class="rounded-xl h-100"
        >
          <VCardItem>
            <VCardTitle class="d-flex align-center text-h6 font-weight-bold">
              <VIcon
                icon="ri-store-2-line"
                class="me-2 text-info"
              />
              Top 5 Vendor by Outstanding
            </VCardTitle>
          </VCardItem>
          <VCardText class="px-0">
            <VTable density="compact">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Vendor</th>
                  <th class="text-right">
                    Outstanding
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!summary.top_vendors?.length">
                  <td
                    colspan="3"
                    class="text-center text-medium-emphasis py-6"
                  >
                    Tidak ada data.
                  </td>
                </tr>
                <tr
                  v-for="(v, idx) in summary.top_vendors"
                  :key="v.vendor_ap_id"
                >
                  <td>{{ idx + 1 }}</td>
                  <td
                    class="text-truncate"
                    style="max-width: 160px"
                  >
                    {{ v.nama_vendor }}
                  </td>
                  <td class="text-right">
                    <div>{{ formatCurrency(v.total_outstanding) }}</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ v.percentage }}%
                    </div>
                  </td>
                </tr>
              </tbody>
            </VTable>
          </VCardText>
          <VCardActions class="px-4">
            <VBtn
              variant="text"
              size="small"
              color="primary"
              :to="{ name: 'ap-vendor-index' }"
            >
              Lihat semua vendor
            </VBtn>
          </VCardActions>
        </VCard>
      </VCol>

      <!-- Jatuh Tempo Terdekat -->
      <VCol
        cols="12"
        md="6"
      >
        <VCard
          elevation="2"
          class="rounded-xl h-100"
        >
          <VCardItem>
            <VCardTitle class="d-flex align-center text-h6 font-weight-bold">
              <VIcon
                icon="ri-alarm-warning-line"
                class="me-2 text-error"
              />
              Tagihan Jatuh Tempo Terdekat
            </VCardTitle>
          </VCardItem>
          <VCardText class="px-0">
            <VTable density="compact">
              <thead>
                <tr>
                  <th>Tagihan</th>
                  <th>Jatuh Tempo</th>
                  <th class="text-right">
                    Sisa
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!summary.due_soon?.length">
                  <td
                    colspan="3"
                    class="text-center text-medium-emphasis py-6"
                  >
                    Tidak ada tagihan jatuh tempo.
                  </td>
                </tr>
                <tr
                  v-for="t in summary.due_soon"
                  :key="t.id"
                >
                  <td>
                    <RouterLink
                      :to="{ name: 'ap-tagihan-show', params: { id: t.id } }"
                      class="text-primary font-weight-medium"
                    >
                      {{ t.no_tagihan }}
                    </RouterLink>
                    <div
                      class="text-caption text-medium-emphasis text-truncate"
                      style="max-width: 140px"
                    >
                      {{ t.nama_vendor }}
                    </div>
                  </td>
                  <td>
                    <VChip
                      :color="dueChipColor(t.hari_lagi)"
                      size="x-small"
                      variant="tonal"
                      label
                    >
                      {{ dueChipLabel(t.hari_lagi) }}
                    </VChip>
                  </td>
                  <td class="text-right">
                    {{ formatCurrency(t.sisa_tagihan) }}
                  </td>
                </tr>
              </tbody>
            </VTable>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Quick Actions -->
    <VCard
      elevation="2"
      class="rounded-xl"
    >
      <VCardText>
        <div class="text-subtitle-2 font-weight-bold text-medium-emphasis mb-3">
          Quick Actions
        </div>
        <VRow>
          <VCol
            v-for="action in quickActions.filter(a => !a.roles || authStore.hasAnyRole(a.roles))"
            :key="action.title"
            cols="6"
            sm="3"
          >
            <VBtn
              block
              variant="tonal"
              :color="action.color"
              class="quick-action-btn"
              :to="action.to"
            >
              <div class="d-flex flex-column align-center py-2">
                <VIcon
                  :icon="action.icon"
                  size="22"
                  class="mb-1"
                />
                <span class="text-caption font-weight-medium">{{ action.title }}</span>
              </div>
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useTheme } from 'vuetify'
import { useAuthStore } from '@/stores/auth.store'
import { useFormatter } from '@/composables/useFormatter'
import DeferredApexChart from '@/components/shared/DeferredApexChart.vue'
import api from '@/utils/axios'

const theme = useTheme()
const authStore = useAuthStore()
const { formatCurrency } = useFormatter()

const loading = ref(true)
const error = ref('')

const compactFormatter = new Intl.NumberFormat('id-ID', {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 1,
})

function emptySummary() {
  return {
    total_outstanding: 0,
    total_outstanding_trend_pct: 0,
    jatuh_tempo_7_hari: 0,
    jatuh_tempo_7_hari_count: 0,
    pembayaran_bulan_ini: 0,
    pembayaran_bulan_lalu: 0,
    pembayaran_trend_pct: 0,
    overdue_buckets: { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 },
    overdue_buckets_pct: { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 },
    top_vendors: [],
    due_soon: [],
    trend: { labels: [], payment_totals: [], invoice_counts: [] },
    status_breakdown: { lunas: 0, sebagian: 0, belum_lunas: 0 },
  }
}

const summary = reactive(emptySummary())

// ─── Stat Cards ─────────────────────────────────────────────────────────────
function trendCaption(pct) {
  if (!pct) return 'vs bulan lalu'
  const arrow = pct >= 0 ? '↑' : '↓'
  
  return `vs bulan lalu ${pct >= 0 ? '+' : ''}${pct}% ${arrow}`
}

const statCards = computed(() => [
  {
    title: 'Total Hutang Outstanding',
    value: formatCurrency(summary.total_outstanding),
    caption: trendCaption(summary.total_outstanding_trend_pct),
    icon: 'ri-wallet-3-line', color: 'primary',
  },
  {
    title: 'Jatuh Tempo 7 Hari',
    value: formatCurrency(summary.jatuh_tempo_7_hari),
    caption: `${summary.jatuh_tempo_7_hari_count} tagihan`,
    icon: 'ri-timer-line', color: 'warning',
  },
  {
    title: 'Pembayaran Bulan Ini',
    value: formatCurrency(summary.pembayaran_bulan_ini),
    caption: trendCaption(summary.pembayaran_trend_pct),
    icon: 'ri-money-cny-circle-line', color: 'success',
  },
])

// ─── Aging ──────────────────────────────────────────────────────────────────
const agingRows = computed(() => {
  const b = summary.overdue_buckets
  const p = summary.overdue_buckets_pct
  
  return [
    { key: 'current', label: 'Belum Jatuh Tempo', value: b.current, pct: p.current, color: 'success' },
    { key: '1-30',    label: '1 - 30 Hari',        value: b['1-30'], pct: p['1-30'], color: 'info' },
    { key: '31-60',   label: '31 - 60 Hari',       value: b['31-60'], pct: p['31-60'], color: 'warning' },
    { key: '61-90',   label: '61 - 90 Hari',       value: b['61-90'], pct: p['61-90'], color: 'error' },
    { key: '90+',     label: '> 90 Hari',          value: b['90+'], pct: p['90+'], color: 'error' },
  ]
})

// ─── Trend Chart (combo bar + line) ────────────────────────────────────────
const trendChartSeries = computed(() => [
  { name: 'Pembayaran (Rp)', type: 'column', data: summary.trend.payment_totals },
  { name: 'Jumlah Tagihan',  type: 'line',   data: summary.trend.invoice_counts },
])

const trendChartOptions = computed(() => {
  const c = theme.current.value.colors
  
  return {
    chart: { type: 'line', fontFamily: 'inherit', toolbar: { show: false } },
    stroke: { width: [0, 3], curve: 'smooth' },
    colors: [c.primary, c.info],
    plotOptions: { bar: { columnWidth: '45%', borderRadius: 4 } },
    dataLabels: { enabled: false },
    xaxis: {
      categories: summary.trend.labels,
      axisBorder: { show: false },
      labels: { style: { colors: c['on-surface'], fontSize: '11px' } },
    },
    yaxis: [
      {
        title: { text: 'Pembayaran', style: { color: c['on-surface'] } },
        labels: { style: { colors: c['on-surface'] }, formatter: val => compactFormatter.format(val) },
      },
      {
        opposite: true,
        title: { text: 'Jumlah Tagihan', style: { color: c['on-surface'] } },
        labels: { style: { colors: c['on-surface'] } },
      },
    ],
    grid: { borderColor: 'rgba(var(--v-theme-on-surface), 0.08)', strokeDashArray: 4 },
    legend: { position: 'top', horizontalAlign: 'right', labels: { colors: c['on-surface'] } },
    tooltip: {
      theme: theme.global.name.value,
      y: { formatter: (value, opts) => opts.seriesIndex === 0 ? formatCurrency(value) : `${value} tagihan` },
    },
  }
})

// ─── Status Pembayaran Donut ────────────────────────────────────────────────
const statusChartSeries = computed(() => [
  summary.status_breakdown.lunas,
  summary.status_breakdown.sebagian,
  summary.status_breakdown.belum_lunas,
])

const statusHasData = computed(() => statusChartSeries.value.some(v => v > 0))

const statusChartOptions = computed(() => {
  const c = theme.current.value.colors
  
  return {
    chart: { type: 'donut', fontFamily: 'inherit' },
    labels: ['Lunas', 'Sebagian', 'Belum Lunas'],
    colors: [c.primary, c.warning, c.error],
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            value: { color: c['on-surface'], fontSize: '15px', fontWeight: 600, offsetY: 6 },
            total: {
              show: true, showAlways: true, label: 'Total', color: c['on-surface'], fontSize: '12px',
              formatter: w => `Rp ${compactFormatter.format(w.globals.seriesTotals.reduce((a, b) => a + b, 0))}`,
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: false },
    legend: { position: 'bottom', labels: { colors: c['on-surface'] } },
    tooltip: { theme: theme.global.name.value, y: { formatter: v => formatCurrency(v) } },
  }
})

// ─── Due chip helpers ───────────────────────────────────────────────────────
function dueChipColor(hariLagi) {
  if (hariLagi < 0) return 'error'
  if (hariLagi <= 3) return 'warning'
  
  return 'info'
}

function dueChipLabel(hariLagi) {
  if (hariLagi < 0) return `Telat ${Math.abs(hariLagi)} hari`
  if (hariLagi === 0) return 'Hari ini'
  
  return `${hariLagi} hari`
}

// ─── Quick Actions ──────────────────────────────────────────────────────────
const quickActions = [
  { title: 'Tambah Tagihan', icon: 'ri-file-add-line', color: 'primary', to: { name: 'ap-tagihan-create' }, roles: ['ADMIN', 'AP'] },
  { title: 'Lihat Vendor', icon: 'ri-store-2-line', color: 'info', to: { name: 'ap-vendor-index' } },
  { title: 'Riwayat Pembayaran', icon: 'ri-bank-card-line', color: 'warning', to: { name: 'ap-pembayaran-index' } },
]

// ─── Data Loading ───────────────────────────────────────────────────────────
onMounted(async () => {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/ap/dashboard/summary')

    Object.assign(summary, emptySummary(), data.data)
  } catch (err) {
    error.value = err.response?.data?.message ?? 'Gagal memuat dashboard'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.stat-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1) !important;
}

.chart-card {
  overflow: visible !important;
}

.quick-action-btn {
  height: auto !important;
  padding-block: 8px !important;
}
</style>
