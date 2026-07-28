<template>
  <div>
    <PageHeader
      title="Export Data"
      subtitle="Pilih laporan dan export ke file Excel"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Export Data', disabled: true },
      ]"
    />

    <VCard class="mb-4">
      <VCardText>
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

        <VExpansionPanels
          v-model="openGroups"
          multiple
          variant="accordion"
        >
          <VExpansionPanel
            v-for="grp in groupedReports"
            :key="grp.key"
            :value="grp.key"
          >
            <VExpansionPanelTitle>
              <div class="d-flex align-center gap-2">
                <VIcon
                  :icon="grp.icon"
                  :color="grp.color"
                  size="20"
                />
                <span class="font-weight-medium">{{ grp.label }}</span>
                <VChip
                  size="x-small"
                  :color="grp.selectedCount > 0 ? 'primary' : undefined"
                  :variant="grp.selectedCount > 0 ? 'flat' : 'tonal'"
                >
                  {{ grp.selectedCount }}/{{ grp.reports.length }}
                </VChip>
              </div>
            </VExpansionPanelTitle>
            <VExpansionPanelText>
              <VRow>
                <VCol
                  v-for="rpt in grp.reports"
                  :key="rpt.key"
                  cols="12"
                  sm="6"
                >
                  <div
                    class="report-tile"
                    :class="{ 'report-tile--selected': isSelected(rpt.key) }"
                    @click="toggleReport(rpt.key)"
                  >
                    <VCheckbox
                      :model-value="isSelected(rpt.key)"
                      hide-details
                      density="compact"
                      :color="rpt.color"
                      @click.stop
                      @update:model-value="toggleReport(rpt.key)"
                    />
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
                </VCol>
              </VRow>
            </VExpansionPanelText>
          </VExpansionPanel>
        </VExpansionPanels>
      </VCardText>
    </VCard>

    <VCard
      v-if="selectedKeys.length > 0"
      class="mb-4"
    >
      <VCardTitle class="px-5 pt-5 pb-0 text-subtitle-2 text-uppercase text-medium-emphasis font-weight-bold">
        Filter Export
      </VCardTitle>
      <VCardText class="pa-5">
        <VRow dense>
          <VCol
            v-if="showSegmentFilter"
            cols="12"
            sm="auto"
          >
            <VBtnToggle
              v-model="filters.segment"
              color="primary"
              variant="outlined"
              mandatory
              divided
              density="compact"
            >
              <VBtn
                value="ALL"
                size="small"
                style="min-width: 80px"
              >
                Semua
              </VBtn>
              <VBtn
                value="B2C"
                size="small"
                style="min-width: 70px"
              >
                B2C
              </VBtn>
              <VBtn
                value="B2B"
                size="small"
                style="min-width: 70px"
              >
                B2B
              </VBtn>
            </VBtnToggle>
          </VCol>

          <VCol
            v-if="showPeriodFilter"
            cols="6"
            sm="auto"
          >
            <VTextField
              v-model="filters.tanggal_dari"
              label="Dari Tanggal"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
              style="min-width: 150px"
            />
          </VCol>

          <VCol
            v-if="showPeriodFilter"
            cols="6"
            sm="auto"
          >
            <VTextField
              v-model="filters.tanggal_sampai"
              label="Sampai Tanggal"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
              style="min-width: 150px"
            />
          </VCol>

          <VCol
            v-if="showClientFilter"
            cols="12"
            sm
          >
            <VAutocomplete
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
          </VCol>

          <VCol
            v-if="showPaymentMethodFilter"
            cols="12"
            sm="auto"
          >
            <VSelect
              v-model="filters.metode_pembayaran"
              label="Metode"
              placeholder="Semua Metode"
              clearable
              hide-details
              density="compact"
              variant="outlined"
              style="min-width: 170px"
              :items="metodeOptions"
              item-title="label"
              item-value="value"
            />
          </VCol>
        </VRow>

        <VDivider
          v-if="showSpecialFilters"
          class="my-4"
        />

        <VRow
          v-if="showSpecialFilters"
          dense
        >
          <VCol
            v-if="isSelected('aging_report')"
            cols="12"
            md="4"
          >
            <div class="filter-group">
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
          </VCol>

          <VCol
            v-if="isSelected('rekap_klien')"
            cols="12"
            md="4"
          >
            <div class="filter-group">
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
          </VCol>

          <VCol
            v-if="isSelected('jurnal_pic')"
            cols="12"
            md="4"
          >
            <div class="filter-group">
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
          </VCol>

          <VCol
            v-if="isSelected('pendapatan_di_muka')"
            cols="12"
            md="4"
          >
            <div class="filter-group">
              <div class="d-flex align-center gap-2 mb-3">
                <VIcon
                  icon="ri-time-line"
                  size="16"
                  color="deep-purple"
                />
                <span class="text-subtitle-2 font-weight-semibold">Pendapatan di Muka</span>
              </div>
              <div class="d-flex flex-column gap-3">
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
            </div>
          </VCol>

          <VCol
            v-if="isSelected('rekening_koran')"
            cols="12"
            md="8"
          >
            <div class="filter-group">
              <div class="d-flex align-center gap-2 mb-3">
                <VIcon
                  icon="ri-book-open-line"
                  size="16"
                  color="info"
                />
                <span class="text-subtitle-2 font-weight-semibold">Rekening Koran</span>
              </div>
              <VRow dense>
                <VCol
                  cols="12"
                  sm="6"
                >
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
                </VCol>
                <VCol
                  cols="12"
                  sm="6"
                >
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
                </VCol>
                <VCol
                  cols="12"
                  sm="4"
                >
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
                </VCol>
                <VCol
                  cols="12"
                  sm="4"
                >
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
                </VCol>
                <VCol
                  cols="12"
                  sm="4"
                >
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
                </VCol>
              </VRow>
            </div>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <VCard class="export-footer">
      <VCardText class="d-flex align-center justify-space-between gap-3 py-3">
        <div class="d-flex align-center gap-2 min-width-0">
          <VChip
            v-if="selectedKeys.length > 0"
            size="small"
            color="primary"
          >
            {{ selectedKeys.length }}
          </VChip>
          <span class="text-body-2 text-medium-emphasis text-truncate">
            <template v-if="exporting">
              Menyiapkan {{ selectedKeys.length }} sheet di server...
            </template>
            <template v-else>
              {{ selectedKeys.length > 0 ? selectedDefs.map(r => r.label).join(', ') : 'Pilih minimal satu laporan' }}
            </template>
          </span>
        </div>
        <VBtn
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

const openGroups = ref(['piutang'])

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
.report-tile {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 112px;
  padding: 16px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
}

.report-tile:hover {
  border-color: rgba(var(--v-theme-primary), 0.55);
}

.report-tile--selected {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.06);
  box-shadow: inset 0 0 0 1px rgba(var(--v-theme-primary), 0.25);
}

.filter-group {
  min-height: 100%;
  padding: 14px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.015);
}

.export-footer {
  position: sticky;
  bottom: 0;
  z-index: 5;
  box-shadow: 0 -2px 8px rgba(var(--v-theme-on-surface), 0.08);
}

@media (max-width: 599.98px) {
  .report-tile {
    min-height: auto;
    padding: 12px;
  }
}
</style>
