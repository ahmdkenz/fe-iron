<template>
  <div>
    <PageHeader
      title="Dashboard Manager"
      subtitle="Monitoring operasional keuangan dan kinerja tim AR"
    >
      <VChip color="info" variant="tonal" label>Manager</VChip>
    </PageHeader>

    <VAlert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</VAlert>

    <!-- Summary Cards -->
    <VRow class="mb-4">
      <VCol v-for="card in summaryCards" :key="card.title" cols="12" sm="6" lg="4">
        <VCard elevation="2" class="rounded-xl stat-card">
          <VCardText class="d-flex align-center justify-space-between fill-height bg-surface gap-2">
            <div class="min-width-0">
              <div class="text-subtitle-2 text-medium-emphasis text-uppercase font-weight-medium mb-1">
                {{ card.title }}
              </div>
              <div class="font-weight-bold text-truncate" :class="[valueTextClass, card.textClass]">
                {{ card.value }}
              </div>
              <div class="text-caption mt-1 text-medium-emphasis">{{ card.caption }}</div>
            </div>
            <VAvatar :color="card.color" variant="tonal" :size="avatarSize" class="rounded-lg flex-shrink-0">
              <VIcon :icon="card.icon" :size="avatarIconSize" />
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
      <!-- Revenue Trend -->
      <VCol cols="12" md="8">
        <VCard elevation="2" class="rounded-xl h-100 chart-card">
          <VCardItem class="pb-0">
            <VCardTitle class="d-flex align-center text-h6 font-weight-bold">
              <VIcon icon="ri-bar-chart-grouped-line" class="me-2 text-primary" />
              Tren Invoicing & Pembayaran AR
            </VCardTitle>
            <VCardSubtitle>{{ trendPeriodLabel }}</VCardSubtitle>
          </VCardItem>
          <div class="d-flex flex-wrap gap-1 px-4 pb-2">
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
          <VCardText class="pt-2">
            <DeferredApexChart type="area" height="240" :options="revenueChartOptions" :series="revenueChartSeries" />
          </VCardText>
        </VCard>
      </VCol>

      <!-- Invoice Status Donut -->
      <VCol cols="12" md="4">
        <VCard elevation="2" class="rounded-xl h-100 chart-card">
          <VCardItem class="pb-0">
            <VCardTitle class="text-h6 font-weight-bold">Status Invoice</VCardTitle>
            <VCardSubtitle>Proporsi tagihan aktif</VCardSubtitle>
          </VCardItem>
          <VCardText class="d-flex align-center justify-center pt-4 pt-sm-8">
            <DeferredApexChart
              v-if="statusChartHasData"
              type="donut" width="100%" height="220" :delay="300"
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
        <VCard elevation="2" class="rounded-xl chart-card">
          <VCardItem class="pb-0">
            <VCardTitle class="d-flex align-center text-h6 font-weight-bold">
              <VIcon icon="ri-time-line" class="me-2 text-warning" />
              Aging Piutang
            </VCardTitle>
            <VCardSubtitle>Distribusi outstanding berdasarkan umur tagihan</VCardSubtitle>
          </VCardItem>
          <VCardText class="pt-4">
            <DeferredApexChart type="bar" height="170" :delay="300" :options="agingChartOptions" :series="agingChartSeries" />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- AR Team Performance -->
    <VRow class="mt-0">
      <VCol cols="12">
        <VCard elevation="2" class="rounded-xl">
          <VCardItem>
            <VCardTitle class="d-flex align-center text-h6 font-weight-bold">
              <VIcon icon="ri-team-line" class="me-2 text-info" />
              Kinerja Tim AR
            </VCardTitle>
            <VCardSubtitle>Ringkasan kinerja per PIC AR bulan berjalan</VCardSubtitle>
          </VCardItem>
          <VCardText class="px-0">
            <div class="d-none d-sm-block">
              <VTable class="text-no-wrap">
                <thead>
                  <tr>
                    <th class="text-uppercase font-weight-bold text-caption">Nama AR</th>
                    <th class="text-uppercase font-weight-bold text-caption">Perusahaan</th>
                    <th class="text-uppercase font-weight-bold text-caption text-right">Klien</th>
                    <th class="text-uppercase font-weight-bold text-caption text-right">Invoice</th>
                    <th class="text-uppercase font-weight-bold text-caption text-right">Total Tagihan</th>
                    <th class="text-uppercase font-weight-bold text-caption text-right">Sisa Piutang</th>
                    <th class="text-uppercase font-weight-bold text-caption text-center">Collection Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loadingKinerja">
                    <td colspan="7" class="text-center py-8 text-medium-emphasis">Memuat data...</td>
                  </tr>
                  <tr v-else-if="arPerformance.length === 0">
                    <td colspan="7" class="text-center py-8 text-medium-emphasis">Tidak ada data kinerja AR bulan ini.</td>
                  </tr>
                  <tr v-for="ar in arPerformance" v-else :key="ar.karyawan_id" class="table-row-hover">
                    <td class="font-weight-medium">{{ ar.nama_karyawan }}</td>
                    <td class="text-caption text-medium-emphasis">{{ ar.perusahaan ?? '—' }}</td>
                    <td class="text-right">{{ ar.jumlah_klien }}</td>
                    <td class="text-right">{{ ar.jumlah_invoice }}</td>
                    <td class="text-right">{{ formatCurrency(ar.total_tagihan) }}</td>
                    <td class="text-right font-weight-medium" :class="ar.total_sisa > 0 ? 'text-error' : 'text-success'">
                      {{ formatCurrency(ar.total_sisa) }}
                    </td>
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
            </div>

            <div class="d-sm-none px-4">
              <div v-if="loadingKinerja" class="text-center py-8 text-medium-emphasis">Memuat data...</div>
              <div v-else-if="arPerformance.length === 0" class="text-center py-8 text-medium-emphasis">Tidak ada data kinerja AR bulan ini.</div>
              <div
                v-for="ar in arPerformance"
                v-else
                :key="ar.karyawan_id"
                class="mobile-list-row d-flex justify-space-between align-center gap-2"
              >
                <div class="min-width-0">
                  <div class="text-caption font-weight-medium text-truncate">{{ ar.nama_karyawan }}</div>
                  <div class="text-caption text-medium-emphasis text-truncate">{{ ar.perusahaan ?? '—' }} · {{ ar.jumlah_klien }} klien / {{ ar.jumlah_invoice }} invoice</div>
                </div>
                <div class="text-end flex-shrink-0">
                  <div class="text-caption font-weight-medium" :class="ar.total_sisa > 0 ? 'text-error' : 'text-success'">
                    {{ formatCurrency(ar.total_sisa) }}
                  </div>
                  <VChip
                    :color="ar.collection_rate >= 90 ? 'success' : ar.collection_rate >= 70 ? 'warning' : 'error'"
                    size="x-small" variant="tonal" label class="mt-1"
                  >
                    {{ ar.collection_rate }}%
                  </VChip>
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VRow class="mt-0">
      <!-- Recent Invoices -->
      <VCol cols="12" md="7">
        <VCard elevation="2" class="rounded-xl">
          <VCardItem>
            <VCardTitle class="d-flex align-center text-h6 font-weight-bold">
              <VIcon icon="ri-history-line" class="me-2 text-primary" />
              10 Invoice Terbaru
            </VCardTitle>
          </VCardItem>
          <VCardText class="px-0">
            <div class="d-none d-sm-block">
              <VTable class="text-no-wrap">
                <thead>
                  <tr>
                    <th class="text-uppercase font-weight-bold text-caption">No. Invoice</th>
                    <th class="text-uppercase font-weight-bold text-caption">Klien</th>
                    <th class="text-uppercase font-weight-bold text-caption">Tanggal</th>
                    <th class="text-uppercase font-weight-bold text-caption text-right">Tagihan</th>
                    <th class="text-uppercase font-weight-bold text-caption text-right">Sisa</th>
                    <th class="text-uppercase font-weight-bold text-caption text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loading">
                    <td colspan="6" class="text-center py-8 text-medium-emphasis">Memuat data...</td>
                  </tr>
                  <tr v-else-if="recentInvoices.length === 0">
                    <td colspan="6" class="text-center py-8 text-medium-emphasis">Belum ada data invoice.</td>
                  </tr>
                  <tr v-for="inv in recentInvoices" v-else :key="inv.id" class="table-row-hover">
                    <td class="font-weight-medium text-primary">{{ inv.noInvoice }}</td>
                    <td>{{ inv.klien }}</td>
                    <td class="text-body-2">{{ inv.tanggalInvoice }}</td>
                    <td class="text-right">{{ formatCurrency(inv.totalTagihan) }}</td>
                    <td class="text-right font-weight-medium" :class="inv.sisaTagihan > 0 ? 'text-error' : 'text-success'">
                      {{ formatCurrency(inv.sisaTagihan) }}
                    </td>
                    <td class="text-center">
                      <InvoiceStatusBadge :status="inv.status" />
                    </td>
                  </tr>
                </tbody>
              </VTable>
            </div>

            <div class="d-sm-none px-4">
              <div v-if="loading" class="text-center py-8 text-medium-emphasis">Memuat data...</div>
              <div v-else-if="recentInvoices.length === 0" class="text-center py-8 text-medium-emphasis">Belum ada data invoice.</div>
              <div
                v-for="inv in recentInvoices"
                v-else
                :key="inv.id"
                class="mobile-list-row"
              >
                <div class="text-caption font-weight-medium text-primary mobile-list-row__no">{{ inv.noInvoice }}</div>
                <div class="d-flex justify-space-between align-center gap-2 mt-1">
                  <div class="min-width-0">
                    <div class="text-caption text-medium-emphasis text-truncate">{{ inv.klien }}</div>
                    <div class="mobile-list-row__date text-medium-emphasis">{{ inv.tanggalInvoice }}</div>
                  </div>
                  <div class="text-end flex-shrink-0 mobile-badge">
                    <div class="text-caption font-weight-medium" :class="inv.sisaTagihan > 0 ? 'text-error' : 'text-success'">
                      {{ formatCurrency(inv.sisaTagihan) }}
                    </div>
                    <InvoiceStatusBadge :status="inv.status" class="mt-1" />
                  </div>
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Recent Payments -->
      <VCol cols="12" md="5">
        <VCard elevation="2" class="rounded-xl">
          <VCardItem>
            <VCardTitle class="d-flex align-center text-h6 font-weight-bold">
              <VIcon icon="ri-money-cny-circle-line" class="me-2 text-success" />
              5 Pembayaran Terbaru
            </VCardTitle>
          </VCardItem>
          <VCardText class="px-0">
            <div class="d-none d-sm-block">
              <VTable class="text-no-wrap">
                <thead>
                  <tr>
                    <th class="text-uppercase font-weight-bold text-caption">Invoice / Klien</th>
                    <th class="text-uppercase font-weight-bold text-caption">Tgl Bayar</th>
                    <th class="text-uppercase font-weight-bold text-caption text-right">Jumlah</th>
                    <th class="text-uppercase font-weight-bold text-caption text-center">Rekon</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loadingPayments">
                    <td colspan="4" class="text-center py-8 text-medium-emphasis">Memuat data...</td>
                  </tr>
                  <tr v-else-if="recentPayments.length === 0">
                    <td colspan="4" class="text-center py-8 text-medium-emphasis">Belum ada pembayaran.</td>
                  </tr>
                  <tr v-for="pay in recentPayments" v-else :key="pay.id" class="table-row-hover">
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
                        v-if="pay.status_rekonsiliasi"
                        :color="rekonColorMap[pay.status_rekonsiliasi] ?? 'default'"
                        size="x-small" variant="tonal" label
                      >
                        {{ pay.status_rekonsiliasi }}
                      </VChip>
                      <VChip v-else size="x-small" variant="tonal" color="warning" label>Belum</VChip>
                    </td>
                  </tr>
                </tbody>
              </VTable>
            </div>

            <div class="d-sm-none px-4">
              <div v-if="loadingPayments" class="text-center py-8 text-medium-emphasis">Memuat data...</div>
              <div v-else-if="recentPayments.length === 0" class="text-center py-8 text-medium-emphasis">Belum ada pembayaran.</div>
              <div
                v-for="pay in recentPayments"
                v-else
                :key="pay.id"
                class="mobile-list-row"
              >
                <div class="text-caption font-weight-medium mobile-list-row__no">{{ pay.no_invoice ?? '—' }}</div>
                <div class="d-flex justify-space-between align-center gap-2 mt-1">
                  <div class="min-width-0">
                    <div class="text-caption text-medium-emphasis text-truncate">{{ pay.klien ?? '' }}</div>
                    <div class="mobile-list-row__date text-medium-emphasis">{{ formatDate(pay.tanggal_pembayaran) }}</div>
                  </div>
                  <div class="text-end flex-shrink-0">
                    <div class="text-caption font-weight-medium text-success">{{ formatCurrency(pay.jumlah_pembayaran) }}</div>
                    <VChip
                      v-if="pay.status_rekonsiliasi"
                      :color="rekonColorMap[pay.status_rekonsiliasi] ?? 'default'"
                      size="x-small" variant="tonal" label class="mt-1"
                    >
                      {{ pay.status_rekonsiliasi }}
                    </VChip>
                    <VChip v-else size="x-small" variant="tonal" color="warning" label class="mt-1">Belum</VChip>
                  </div>
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, shallowRef } from 'vue'
import { useDisplay, useTheme } from 'vuetify'
import DeferredApexChart from '@/components/shared/DeferredApexChart.vue'
import PageHeader from '@/components/shared/PageHeader.vue'
import InvoiceStatusBadge from '@/modules/Finance/shared/components/InvoiceStatusBadge.vue'
import { useFormatter } from '@/composables/useFormatter'
import api from '@/utils/axios'

const theme = useTheme()
const display = useDisplay()
const { formatCurrency, formatDate } = useFormatter()

const isMobile = computed(() => display.xs.value)
const avatarSize = computed(() => isMobile.value ? 40 : 54)
const avatarIconSize = computed(() => isMobile.value ? 20 : 30)
const valueTextClass = computed(() => isMobile.value ? 'text-h6' : 'text-h4')

const compactFormatter = new Intl.NumberFormat('id-ID', {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 1,
})

const rekonColorMap = { MATCHED: 'success', POSSIBLE: 'warning', UNMATCHED: 'error', DIABAIKAN: 'secondary' }

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

const loading         = ref(false)
const loadingKinerja  = ref(false)
const loadingPayments = ref(false)
const trendLoading    = ref(false)
const trendPeriod     = ref('6M')
const trendData       = ref({ labels: [], invoiceTotals: [], paymentTotals: [] })
const error           = ref('')

const trendPeriodLabel = computed(() => trendPeriodDescriptions[trendPeriod.value] ?? trendPeriod.value)

const dashboard    = shallowRef(createEmptyDashboard())
const kpi          = shallowRef(createEmptyKpi())
const arPerformance = ref([])
const recentPayments = ref([])

// ─── Summary Cards ────────────────────────────────────────────────────────────

const summaryCards = computed(() => {
  const s = dashboard.value.summary
  const k = kpi.value
  return [
    {
      title: 'Total Klien', value: loading.value ? '...' : (s.totalKlien ?? 0),
      caption: 'Klien aktif terdaftar',
      icon: 'ri-building-4-line', color: 'primary', textClass: 'text-primary',
    },
    {
      title: 'Total Invoice', value: loading.value ? '...' : (s.totalInvoice ?? 0),
      caption: 'Seluruh invoice tercatat',
      icon: 'ri-file-list-3-line', color: 'info', textClass: 'text-info',
    },
    {
      title: 'Total Tagihan', value: loading.value ? '...' : formatCurrency(s.totalTagihan ?? 0),
      caption: 'Akumulasi seluruh tagihan',
      icon: 'ri-bill-line', color: 'warning', textClass: 'text-warning',
    },
    {
      title: 'Total Pembayaran', value: loading.value ? '...' : formatCurrency(s.totalPembayaran ?? 0),
      caption: 'Akumulasi pembayaran diterima',
      icon: 'ri-money-cny-circle-line', color: 'success', textClass: 'text-success',
    },
    {
      title: 'Sisa Piutang', value: loading.value ? '...' : formatCurrency(s.totalSisa ?? 0),
      caption: 'Outstanding belum terbayar',
      icon: 'ri-error-warning-line', color: 'error', textClass: 'text-error',
    },
    {
      title: 'Invoice Overdue', value: loading.value ? '...' : (k.overdueCount ?? 0),
      caption: `${k.overduePercentage ?? 0}% dari total invoice`,
      icon: 'ri-alarm-warning-line',
      color: (k.overdueCount ?? 0) > 0 ? 'error' : 'success',
      textClass: (k.overdueCount ?? 0) > 0 ? 'text-error' : 'text-success',
    },
  ]
})

// ─── KPI Cards ────────────────────────────────────────────────────────────────

const kpiCards = computed(() => {
  const k = kpi.value
  const belumRekon = rekonPendingCount.value
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
      title: 'Belum Direkonsiliasi',
      value: loadingPayments.value ? '...' : `${belumRekon} transaksi`,
      caption: belumRekon > 0 ? 'Perlu ditindaklanjuti' : 'Semua sudah diproses',
      icon: 'ri-bank-line',
      color: belumRekon > 0 ? 'warning' : 'success',
    },
  ]
})

const rekonPendingCount = ref(0)

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
    plotOptions: { pie: { donut: { size: '70%', labels: { show: true, value: { color: c['on-surface'] }, total: { show: true, showAlways: true, label: 'Total', color: c['on-surface'], formatter: w => w.globals.seriesTotals.reduce((a, b) => a + b, 0) } } } } },
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

// ─── Computed from dashboard ──────────────────────────────────────────────────

const recentInvoices = computed(() => (dashboard.value.recentInvoices ?? []))

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

async function loadKinerja() {
  loadingKinerja.value = true
  try {
    const { data } = await api.get('/finance/kinerja-ar')
    arPerformance.value = (data.data?.rows ?? []).map(r => ({
      karyawan_id:     r.karyawan_id,
      nama_karyawan:   r.nama_karyawan,
      perusahaan:      r.perusahaan,
      jumlah_klien:    r.jumlah_klien,
      jumlah_invoice:  r.jumlah_invoice,
      total_tagihan:   Number(r.total_tagihan ?? 0),
      total_terkumpul: Number(r.total_terkumpul ?? 0),
      total_sisa:      Number(r.total_sisa ?? 0),
      collection_rate: Number(r.collection_rate ?? 0),
    }))
  } catch {
    // non-critical
  } finally {
    loadingKinerja.value = false
  }
}

async function loadRecentPayments() {
  loadingPayments.value = true
  try {
    const { data } = await api.get('/finance/jurnal-pic', { params: { per_page: 5, page: 1 } })
    recentPayments.value = data.data ?? []
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
  loadKinerja()
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

.mobile-list-row {
  padding: 12px 0;
  border-bottom: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.mobile-list-row:last-child {
  border-bottom: none;
}

.chart-card {
  overflow: visible !important;
}

.mobile-list-row__date {
  font-size: 0.6875rem;
}

.mobile-list-row__no {
  overflow-wrap: anywhere;
  white-space: normal;
}

.mobile-badge :deep(.text-body-2) {
  font-size: 0.6875rem;
}

.mobile-badge :deep(.v-icon) {
  font-size: 14px !important;
  height: 14px !important;
  width: 14px !important;
}
</style>
