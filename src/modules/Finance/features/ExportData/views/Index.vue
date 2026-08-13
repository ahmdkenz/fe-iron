<template>
  <div class="export-data-page">
    <PageHeroHeader
      tone="sky"
      icon="ri-download-2-line"
      title="Export Data"
      subtitle="Pilih laporan dan export ke file Excel"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Export Data', disabled: true },
      ]"
      :stats="headerStats"
    />

    <VRow>
      <VCol
        cols="12"
        lg="8"
      >
        <div class="d-flex flex-column flex-sm-row justify-sm-space-between align-start align-sm-center gap-3 mb-4">
          <div>
            <div class="text-h6 font-weight-bold">
              Pilih Laporan
            </div>
            <div class="text-caption text-medium-emphasis">
              Centang satu atau lebih laporan yang akan di-export
            </div>
          </div>
          <VBtn
            variant="tonal"
            size="small"
            color="primary"
            class="w-100 w-sm-auto"
            @click="toggleSelectAll"
          >
            {{ allSelected ? 'Batal Semua' : 'Pilih Semua' }}
          </VBtn>
        </div>

        <VCard
          v-for="grp in groupedReports"
          :key="grp.key"
          class="mb-4 group-card"
        >
          <VCardText>
            <div class="d-flex align-center gap-2 mb-4">
              <VIcon
                :icon="grp.icon"
                :color="grp.color"
                size="20"
              />
              <span class="font-weight-bold text-body-1">{{ grp.label }}</span>
              <VChip
                size="x-small"
                :color="grp.selectedCount > 0 ? 'primary' : undefined"
                :variant="grp.selectedCount > 0 ? 'flat' : 'tonal'"
              >
                {{ grp.selectedCount }}/{{ grp.reports.length }}
              </VChip>
            </div>

            <div class="report-grid">
              <div
                v-for="rpt in grp.reports"
                :key="rpt.key"
                class="report-tile"
                :class="{ 'report-tile--selected': isSelected(rpt.key) }"
                :style="accentStyle(rpt.color)"
                role="checkbox"
                :aria-checked="isSelected(rpt.key)"
                :aria-label="`${rpt.label} — ${rpt.description}`"
                tabindex="0"
                @click="toggleReport(rpt.key)"
                @keydown.enter.prevent="toggleReport(rpt.key)"
                @keydown.space.prevent="toggleReport(rpt.key)"
              >
                <span
                  class="check-circle"
                  aria-hidden="true"
                >
                  <VIcon
                    icon="ri-check-line"
                    size="14"
                  />
                </span>
                <VAvatar
                  :color="rpt.color"
                  variant="tonal"
                  size="42"
                >
                  <VIcon
                    :icon="rpt.icon"
                    size="22"
                  />
                </VAvatar>
                <div class="min-width-0">
                  <div class="font-weight-semibold text-body-1">
                    {{ rpt.label }}
                  </div>
                  <div class="text-caption text-medium-emphasis mt-1">
                    {{ rpt.description }}
                  </div>
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        lg="4"
      >
        <div class="export-sidebar">
          <VCard
            v-if="selectedKeys.length > 0"
            class="mb-4"
          >
            <VCardTitle class="px-5 pt-5 pb-0 text-subtitle-2 text-uppercase text-medium-emphasis font-weight-bold">
              Filter Export
            </VCardTitle>
            <VCardText class="pa-5 d-flex flex-column gap-4">
              <VBtnToggle
                v-if="showSegmentFilter"
                v-model="filters.segment"
                color="primary"
                variant="outlined"
                mandatory
                divided
                density="compact"
                class="w-100"
              >
                <VBtn
                  value="ALL"
                  size="small"
                  class="flex-grow-1"
                >
                  Semua
                </VBtn>
                <VBtn
                  value="B2C"
                  size="small"
                  class="flex-grow-1"
                >
                  B2C
                </VBtn>
                <VBtn
                  value="B2B"
                  size="small"
                  class="flex-grow-1"
                >
                  B2B
                </VBtn>
              </VBtnToggle>

              <div
                v-if="showPeriodFilter"
                class="d-flex gap-3"
              >
                <VTextField
                  v-model="filters.tanggal_dari"
                  label="Dari Tanggal"
                  type="date"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
                <VTextField
                  v-model="filters.tanggal_sampai"
                  label="Sampai Tanggal"
                  type="date"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </div>

              <VAutocomplete
                v-if="showClientFilter"
                v-model="filters.klien_ar_id"
                label="Klien"
                placeholder="Semua Klien"
                variant="outlined"
                clearable
                hide-details
                density="compact"
                prepend-inner-icon="ri-search-line"
                :items="klienList"
                item-title="display_label"
                item-value="id"
                :loading="klienLoading"
                @focus="ensureKlienLoaded"
              />

              <VSelect
                v-if="showPaymentMethodFilter"
                v-model="filters.metode_pembayaran"
                label="Metode"
                placeholder="Semua Metode"
                clearable
                hide-details
                density="compact"
                variant="outlined"
                :items="metodeOptions"
                item-title="label"
                item-value="value"
              />

              <VDivider v-if="showSpecialFilters" />

              <div
                v-if="showSpecialFilters"
                class="d-flex flex-column gap-4"
              >
                <div
                  v-if="isSelected('aging_report')"
                  class="special-filter-box"
                >
                  <div class="d-flex align-center gap-2 mb-3">
                    <VIcon
                      icon="ri-bar-chart-grouped-line"
                      size="16"
                      color="primary"
                    />
                    <span class="text-subtitle-2 font-weight-semibold">Aging Report</span>
                  </div>
                  <VTextField
                    v-model="agingFilter.as_of_date"
                    label="Per Tanggal"
                    type="date"
                    density="compact"
                    variant="outlined"
                    hide-details
                  />
                </div>

                <div
                  v-if="isSelected('rekap_klien')"
                  class="special-filter-box"
                >
                  <div class="d-flex align-center gap-2 mb-3">
                    <VIcon
                      icon="ri-pie-chart-2-line"
                      size="16"
                      color="secondary"
                    />
                    <span class="text-subtitle-2 font-weight-semibold">Rekap Klien</span>
                  </div>
                  <div class="d-flex gap-3">
                    <VSelect
                      v-model="rekapKlienFilter.periode_bulan"
                      placeholder="Semua Bulan"
                      clearable
                      hide-details
                      density="compact"
                      variant="outlined"
                      :items="bulanOptions"
                      item-title="label"
                      item-value="value"
                    />
                    <VTextField
                      v-model="rekapKlienFilter.periode_tahun"
                      placeholder="Tahun"
                      hide-details
                      density="compact"
                      variant="outlined"
                      type="number"
                      style="max-width: 110px"
                    />
                  </div>
                </div>

                <div
                  v-if="isSelected('jurnal_pic')"
                  class="special-filter-box"
                >
                  <div class="d-flex align-center gap-2 mb-3">
                    <VIcon
                      icon="ri-file-list-3-line"
                      size="16"
                      color="warning"
                    />
                    <span class="text-subtitle-2 font-weight-semibold">Jurnal PIC</span>
                  </div>
                  <div class="d-flex flex-column gap-3">
                    <VTextField
                      v-model="jurnalPicFilter.no_referensi"
                      label="No Referensi"
                      density="compact"
                      variant="outlined"
                      hide-details
                      clearable
                    />
                    <VAutocomplete
                      v-model="jurnalPicFilter.karyawan_id"
                      label="PIC"
                      placeholder="Semua PIC"
                      clearable
                      density="compact"
                      variant="outlined"
                      hide-details
                      :items="karyawanOptions"
                      item-title="nama_karyawan"
                      item-value="id"
                      :loading="karyawanLoading"
                      @focus="ensureKaryawanLoaded"
                    />
                    <VSelect
                      v-model="jurnalPicFilter.status_rekonsiliasi"
                      label="Status Rekon"
                      placeholder="Semua Status"
                      clearable
                      density="compact"
                      variant="outlined"
                      hide-details
                      :items="rekonStatusOptions"
                      item-title="label"
                      item-value="value"
                    />
                  </div>
                </div>

                <div
                  v-if="isSelected('pendapatan_di_muka')"
                  class="special-filter-box"
                >
                  <div class="d-flex align-center gap-2 mb-3">
                    <VIcon
                      icon="ri-time-line"
                      size="16"
                      color="deep-purple"
                    />
                    <span class="text-subtitle-2 font-weight-semibold">Pendapatan di Muka</span>
                  </div>
                  <VSelect
                    v-model="pdmFilter.status"
                    label="Status"
                    placeholder="Semua Status"
                    clearable
                    density="compact"
                    variant="outlined"
                    hide-details
                    :items="pdmStatusOptions"
                    item-title="label"
                    item-value="value"
                  />
                </div>

                <div
                  v-if="isSelected('rekening_koran')"
                  class="special-filter-box"
                >
                  <div class="d-flex align-center gap-2 mb-3">
                    <VIcon
                      icon="ri-book-open-line"
                      size="16"
                      color="info"
                    />
                    <span class="text-subtitle-2 font-weight-semibold">Rekening Koran</span>
                  </div>
                  <div class="d-flex flex-column gap-3">
                    <VAutocomplete
                      v-model="rekeningKoranFilter.pic_ar_id"
                      label="PIC AR"
                      placeholder="Semua PIC AR"
                      clearable
                      density="compact"
                      variant="outlined"
                      hide-details
                      :items="picArList"
                      item-title="name"
                      item-value="id"
                      :loading="picArLoading"
                      @focus="ensurePicArLoaded"
                    />
                    <VSelect
                      v-model="rekeningKoranFilter.bank_type"
                      label="Bank"
                      placeholder="Semua Bank"
                      clearable
                      density="compact"
                      variant="outlined"
                      hide-details
                      :items="bankTypeOptions"
                    />
                    <VSelect
                      v-model="rekeningKoranFilter.dk"
                      label="D/K"
                      placeholder="Semua"
                      clearable
                      density="compact"
                      variant="outlined"
                      hide-details
                      :items="dkOptions"
                      item-title="label"
                      item-value="value"
                    />
                    <VSelect
                      v-model="rekeningKoranFilter.status_posting_1"
                      label="Status Posting 1"
                      placeholder="Semua"
                      clearable
                      density="compact"
                      variant="outlined"
                      hide-details
                      :items="statusPosting1Options"
                    />
                    <VSelect
                      v-model="rekeningKoranFilter.status_posting_2"
                      label="Status Posting 2"
                      placeholder="Semua"
                      clearable
                      density="compact"
                      variant="outlined"
                      hide-details
                      :items="statusPosting2Options"
                    />
                  </div>
                </div>
              </div>
            </VCardText>
          </VCard>

          <VCard class="action-card">
            <VCardText class="d-flex flex-column gap-3">
              <div class="d-flex align-center gap-2 min-width-0">
                <VChip
                  v-if="selectedKeys.length > 0"
                  size="small"
                  color="primary"
                >
                  {{ selectedKeys.length }}
                </VChip>
                <span class="text-body-2 text-medium-emphasis">
                  <template v-if="exporting">
                    Menyiapkan {{ selectedKeys.length }} sheet di server...
                  </template>
                  <template v-else>
                    {{ selectedKeys.length > 0 ? selectedDefs.map(r => r.label).join(', ') : 'Pilih minimal satu laporan' }}
                  </template>
                </span>
              </div>
              <VBtn
                block
                size="large"
                class="export-action-btn"
                color="primary"
                :loading="exporting"
                :disabled="selectedKeys.length === 0"
                prepend-icon="ri-download-2-line"
                @click="doExport"
              >
                Export
              </VBtn>
            </VCardText>
          </VCard>
        </div>
      </VCol>
    </VRow>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useCrud } from '@/composables/useCrud'
import { useLazyFetchAll } from '@/composables/useLazyFetchAll'
import { useSweetAlert } from '@/composables/useSweetAlert'
import api from '@/utils/axios'
import { readBlobError } from '@/utils/readBlobError'

const { showSuccess, showError } = useSweetAlert()
const { items: klienList, loading: klienLoading, fetchAll: fetchKlien } = useCrud('/finance/klien-ar')
const { items: karyawanList, loading: karyawanLoading, fetchAll: fetchKaryawan } = useCrud('/master/karyawan')
const { ensureLoaded: ensureKlienLoaded } = useLazyFetchAll(fetchKlien)
const { ensureLoaded: ensureKaryawanLoaded } = useLazyFetchAll(fetchKaryawan)

const picArList = ref([])
const picArLoading = ref(false)

async function fetchPicAr() {
  picArLoading.value = true
  try {
    const { data } = await api.get('/finance/rekening-koran/pic-ar-list')

    picArList.value = data.data ?? []
  } catch {
    // List kosong — user masih bisa export tanpa filter PIC AR
  } finally {
    picArLoading.value = false
  }
}

const { ensureLoaded: ensurePicArLoaded } = useLazyFetchAll(fetchPicAr)

const exporting = ref(false)
const selectedKeys = ref([])

const now = new Date()
const firstDay = toDateInput(new Date(now.getFullYear(), now.getMonth(), 1))
const lastDay = toDateInput(new Date(now.getFullYear(), now.getMonth() + 1, 0))
const todayStr = toDateInput(now)

const filters = reactive({
  segment: 'ALL',
  tanggal_dari: firstDay,
  tanggal_sampai: lastDay,
  klien_ar_id: null,
  metode_pembayaran: null,
})

const agingFilter = reactive({ as_of_date: todayStr })
const rekapKlienFilter = reactive({ periode_bulan: null, periode_tahun: now.getFullYear() })
const jurnalPicFilter = reactive({ no_referensi: null, karyawan_id: null, status_rekonsiliasi: null })
const pdmFilter = reactive({ status: null })

const rekeningKoranFilter = reactive({
  pic_ar_id: null,
  bank_type: null,
  dk: null,
  status_posting_1: null,
  status_posting_2: null,
})

const GROUPS = [
  { key: 'piutang', label: 'Piutang & Aging', icon: 'ri-file-list-3-line', color: 'primary' },
  { key: 'pembayaran', label: 'Pembayaran', icon: 'ri-money-cny-circle-line', color: 'success' },
  { key: 'kas', label: 'Kas & Rekening', icon: 'ri-bank-line', color: 'info' },
  { key: 'kinerja', label: 'Kinerja & Aktivitas PIC', icon: 'ri-user-star-line', color: 'deep-purple' },
]

// Katalog ini harus sama persis dengan whitelist backend
// (ExportDataWorkbookService::REPORTS) dan dengan halaman Laporan.
const reportDefs = [
  {
    key: 'aging_report',
    label: 'Aging Report',
    icon: 'ri-bar-chart-grouped-line',
    description: 'Umur piutang belum terbayar',
    color: 'primary',
    group: 'piutang',
    supportsSegment: true,
    supportsClient: true,
  },
  {
    key: 'rekap_klien',
    label: 'Rekap Per Klien',
    icon: 'ri-pie-chart-2-line',
    description: 'Ringkasan outstanding per klien',
    color: 'secondary',
    group: 'piutang',
    supportsSegment: true,
    supportsClient: true,
  },
  {
    key: 'mutasi_piutang',
    label: 'Mutasi Piutang',
    icon: 'ri-exchange-funds-line',
    description: 'Pergerakan piutang per klien',
    color: 'info',
    group: 'piutang',
    supportsSegment: true,
    supportsClient: true,
    usesPeriod: true,
  },
  {
    key: 'rekening_koran',
    label: 'Rekening Koran',
    icon: 'ri-book-open-line',
    description: 'Jurnal umum transaksi bank seluruh PIC AR',
    color: 'blue-grey',
    group: 'kas',
    usesPeriod: true,
  },
  {
    key: 'pendapatan_di_muka',
    label: 'Pendapatan di Muka',
    icon: 'ri-time-line',
    description: 'Pembayaran diterima sebelum jasa diberikan',
    color: 'deep-purple',
    group: 'kas',
    supportsClient: true,
    usesPeriod: true,
  },
  {
    key: 'riwayat_pembayaran',
    label: 'Riwayat Pembayaran',
    icon: 'ri-money-cny-circle-line',
    description: 'Daftar semua pembayaran AR',
    color: 'success',
    group: 'pembayaran',
    supportsSegment: true,
    supportsClient: true,
    supportsPaymentMethod: true,
    usesPeriod: true,
  },
  {
    key: 'rekap_pembayaran',
    label: 'Rekap Pembayaran',
    icon: 'ri-bank-card-line',
    description: 'Rekap pembayaran AR per transaksi',
    color: 'error',
    group: 'pembayaran',
    supportsSegment: true,
    supportsClient: true,
    supportsPaymentMethod: true,
    usesPeriod: true,
  },
  {
    key: 'jurnal_pic',
    label: 'Jurnal Aktivitas per PIC',
    icon: 'ri-file-list-3-line',
    description: 'Pembayaran berdasarkan PIC dan referensi',
    color: 'warning',
    group: 'kinerja',
    usesPeriod: true,
    supportsClient: true,
    supportsPaymentMethod: true,
  },
  {
    key: 'kinerja_ar',
    label: 'Kinerja AR',
    icon: 'ri-user-star-line',
    description: 'Performa penagihan per PIC',
    color: 'deep-purple',
    group: 'kinerja',
    supportsSegment: true,
    usesPeriod: true,
  },
]

const selectedDefs = computed(() => reportDefs.filter(report => selectedKeys.value.includes(report.key)))
const allSelected = computed(() => selectedKeys.value.length === reportDefs.length)

const groupedReports = computed(() => GROUPS.map(grp => {
  const reports = reportDefs.filter(report => report.group === grp.key)

  return {
    ...grp,
    reports,
    selectedCount: reports.filter(report => selectedKeys.value.includes(report.key)).length,
  }
}))

const headerStats = computed(() => [
  {
    key: 'total',
    icon: 'ri-file-list-3-line',
    label: 'Laporan Tersedia',
    value: reportDefs.length,
  },
  {
    key: 'kategori',
    icon: 'ri-folder-2-line',
    label: 'Kategori',
    value: GROUPS.length,
  },
  {
    key: 'dipilih',
    icon: 'ri-checkbox-circle-line',
    label: 'Dipilih',
    value: selectedKeys.value.length,
    color: 'primary',
  },
])

const showSegmentFilter = computed(() => selectedDefs.value.some(report => report.supportsSegment))
const showClientFilter = computed(() => selectedDefs.value.some(report => report.supportsClient))
const showPaymentMethodFilter = computed(() => selectedDefs.value.some(report => report.supportsPaymentMethod))
const showPeriodFilter = computed(() => selectedDefs.value.some(report => report.usesPeriod))

const showSpecialFilters = computed(() =>
  isSelected('aging_report')
  || isSelected('rekap_klien')
  || isSelected('jurnal_pic')
  || isSelected('pendapatan_di_muka')
  || isSelected('rekening_koran'),
)

const karyawanOptions = computed(() =>
  karyawanList.value.filter(item => !item.deleted_at),
)

const bulanOptions = [
  { label: 'Januari', value: 1 },
  { label: 'Februari', value: 2 },
  { label: 'Maret', value: 3 },
  { label: 'April', value: 4 },
  { label: 'Mei', value: 5 },
  { label: 'Juni', value: 6 },
  { label: 'Juli', value: 7 },
  { label: 'Agustus', value: 8 },
  { label: 'September', value: 9 },
  { label: 'Oktober', value: 10 },
  { label: 'November', value: 11 },
  { label: 'Desember', value: 12 },
]

const metodeOptions = [
  { label: 'Transfer', value: 'TRANSFER' },
  { label: 'Cash', value: 'CASH' },
  { label: 'Giro', value: 'GIRO' },
]

const rekonStatusOptions = [
  { label: 'Matched', value: 'MATCHED' },
  { label: 'Possible', value: 'POSSIBLE' },
  { label: 'Unmatched', value: 'UNMATCHED' },
  { label: 'Diabaikan', value: 'DIABAIKAN' },
]

const pdmStatusOptions = [
  { label: 'Aktif', value: 'AKTIF' },
  { label: 'Dibatalkan', value: 'DIBATALKAN' },
  { label: 'Terpakai', value: 'TERPAKAI' },
]

const bankTypeOptions = ['BCA', 'MANDIRI', 'CIMB', 'BSI']

const dkOptions = [
  { label: 'Kredit', value: 'K' },
  { label: 'Debit', value: 'D' },
]

const statusPosting1Options = ['MATCHED', 'UNMATCHED', 'DIABAIKAN']
const statusPosting2Options = ['POSTED', 'PENDING']

function isSelected(key) {
  return selectedKeys.value.includes(key)
}

function toggleReport(key) {
  const idx = selectedKeys.value.indexOf(key)
  if (idx === -1) selectedKeys.value.push(key)
  else selectedKeys.value.splice(idx, 1)
}

function toggleSelectAll() {
  selectedKeys.value = allSelected.value ? [] : reportDefs.map(report => report.key)
}

function accentStyle(color) {
  return { '--card-accent': `var(--v-theme-${color})` }
}

function toDateInput(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function addFilter(payload, key, value) {
  if (value !== null && value !== undefined && value !== '') payload[key] = value
}

/**
 * Hanya kirim filter yang relevan dengan laporan terpilih — mengirim filter
 * laporan yang tidak dipilih hanya menambah risiko 422 tanpa efek apa pun.
 */
function buildFilters() {
  const payload = {}

  if (showSegmentFilter.value) addFilter(payload, 'segment', filters.segment)

  if (showPeriodFilter.value) {
    addFilter(payload, 'tanggal_dari', filters.tanggal_dari)
    addFilter(payload, 'tanggal_sampai', filters.tanggal_sampai)
  }

  if (showClientFilter.value) addFilter(payload, 'klien_ar_id', filters.klien_ar_id)
  if (showPaymentMethodFilter.value) addFilter(payload, 'metode_pembayaran', filters.metode_pembayaran)

  if (isSelected('aging_report')) addFilter(payload, 'as_of_date', agingFilter.as_of_date)

  if (isSelected('rekap_klien')) {
    addFilter(payload, 'periode_bulan', rekapKlienFilter.periode_bulan)
    addFilter(payload, 'periode_tahun', rekapKlienFilter.periode_tahun)
  }

  if (isSelected('jurnal_pic')) {
    addFilter(payload, 'no_referensi', jurnalPicFilter.no_referensi)
    addFilter(payload, 'karyawan_id', jurnalPicFilter.karyawan_id)
    addFilter(payload, 'status_rekonsiliasi', jurnalPicFilter.status_rekonsiliasi)
  }

  if (isSelected('pendapatan_di_muka')) addFilter(payload, 'status', pdmFilter.status)

  if (isSelected('rekening_koran')) {
    addFilter(payload, 'pic_ar_id', rekeningKoranFilter.pic_ar_id)
    addFilter(payload, 'bank_type', rekeningKoranFilter.bank_type)
    addFilter(payload, 'dk', rekeningKoranFilter.dk)
    addFilter(payload, 'status_posting_1', rekeningKoranFilter.status_posting_1)
    addFilter(payload, 'status_posting_2', rekeningKoranFilter.status_posting_2)
  }

  return payload
}

async function doExport() {
  if (!selectedKeys.value.length) return

  exporting.value = true
  try {
    // Workbook dibangun di backend: satu request, satu file, satu sheet per
    // laporan — tidak lagi bergantung pada paging/fetch di browser.
    const res = await api.post(
      '/finance/export-data/export-excel',
      { reports: selectedKeys.value, filters: buildFilters() },
      { responseType: 'blob', timeout: 300000 },
    )

    const blobUrl = URL.createObjectURL(new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }))

    const link = document.createElement('a')

    link.href = blobUrl
    link.download = `export-data-finance-${todayStr}.xlsx`
    link.click()
    URL.revokeObjectURL(blobUrl)

    showSuccess({
      title: 'Export Berhasil',
      text: `1 file Excel berhasil dibuat (${selectedKeys.value.length} sheet: ${selectedDefs.value.map(r => r.label).join(', ')}).`,
      timerProgressBar: true,
      timer: 3000,
      showConfirmButton: false,
    })
  } catch (err) {
    showError({
      title: 'Export Gagal',
      text: await readBlobError(err, 'Terjadi kesalahan saat mengambil data'),
      confirmButtonColor: '#283593',
    })
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.export-data-page {
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.group-card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
}

.report-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.report-tile {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 112px;
  padding: 16px;
  border: 2px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}

.report-tile:hover {
  border-color: rgba(var(--card-accent), 0.55);
  transform: translateY(-2px);
  box-shadow: 0 12px 24px -12px rgba(0, 0, 0, 0.35);
}

.report-tile:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

.report-tile--selected {
  border-color: rgb(var(--card-accent));
  background: rgba(var(--card-accent), 0.06);
}

.report-tile--selected::before {
  content: '';
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  inline-size: 4px;
  border-radius: 12px 0 0 12px;
  background: rgb(var(--card-accent));
}

.check-circle {
  position: absolute;
  inset-block-start: 10px;
  inset-inline-end: 10px;
  inline-size: 22px;
  block-size: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(var(--v-theme-on-surface), 0.15);
  background: rgb(var(--v-theme-surface));
  color: transparent;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.report-tile--selected .check-circle {
  background: rgb(var(--v-theme-primary));
  border-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}

.special-filter-box {
  padding: 14px;
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.16);
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.015);
}

.export-sidebar {
  position: sticky;
  top: 80px;
}

.action-card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.export-action-btn {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-primary-darken-1)) 100%) !important;
  color: rgb(var(--v-theme-on-primary)) !important;
}

@media (max-width: 1279.98px) {
  .export-sidebar {
    position: static;
  }
}

@media (max-width: 599.98px) {
  .report-tile {
    min-height: auto;
    padding: 12px;
  }
}
</style>
