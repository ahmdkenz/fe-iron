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
                    :class="{
                      'report-tile--selected': isSelected(rpt.key),
                      'report-tile--disabled': rpt.disabled,
                    }"
                    @click="toggleReport(rpt.key)"
                  >
                    <VCheckbox
                      :model-value="isSelected(rpt.key)"
                      hide-details
                      density="compact"
                      :color="rpt.color"
                      :disabled="rpt.disabled"
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
                      <VChip
                        v-if="rpt.disabled"
                        size="x-small"
                        color="warning"
                        variant="tonal"
                        class="mt-2"
                      >
                        Belum tersedia
                      </VChip>
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
              item-title="nama_klien"
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
            {{ selectedKeys.length > 0 ? selectedDefs.map(r => r.label).join(', ') : 'Pilih minimal satu laporan' }}
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

const { showSuccess, showError } = useSweetAlert()
const { items: klienList, loading: klienLoading, fetchAll: fetchKlien } = useCrud('/finance/klien-ar')
const { items: karyawanList, loading: karyawanLoading, fetchAll: fetchKaryawan } = useCrud('/master/karyawan')
const { ensureLoaded: ensureKlienLoaded } = useLazyFetchAll(fetchKlien)
const { ensureLoaded: ensureKaryawanLoaded } = useLazyFetchAll(fetchKaryawan)

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

const GROUPS = [
  { key: 'piutang', label: 'Piutang & Aging', icon: 'ri-file-list-3-line', color: 'primary' },
  { key: 'pembayaran', label: 'Pembayaran', icon: 'ri-money-cny-circle-line', color: 'success' },
  { key: 'kinerja', label: 'Kinerja & Aktivitas PIC', icon: 'ri-user-star-line', color: 'deep-purple' },
]

const openGroups = ref(['piutang'])

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
    usesAsOfDate: true,
  },
  {
    key: 'rekap_klien',
    label: 'Rekap Per Klien',
    icon: 'ri-pie-chart-2-line',
    description: 'Ringkasan outstanding per klien',
    color: 'secondary',
    group: 'piutang',
    supportsSegment: true,
    usesMonthYear: true,
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
    description: 'Menunggu endpoint export resmi',
    color: 'blue-grey',
    group: 'piutang',
    disabled: true,
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
    key: 'pendapatan_di_muka',
    label: 'Pendapatan di Muka',
    icon: 'ri-time-line',
    description: 'Pembayaran diterima sebelum jasa diberikan',
    color: 'deep-purple',
    group: 'pembayaran',
    supportsClient: true,
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

const selectableDefs = computed(() => reportDefs.filter(report => !report.disabled))
const selectedDefs = computed(() => reportDefs.filter(report => selectedKeys.value.includes(report.key)))
const allSelected = computed(() => selectedKeys.value.length === selectableDefs.value.length)

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
  || isSelected('pendapatan_di_muka'),
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

function isSelected(key) {
  return selectedKeys.value.includes(key)
}

function toggleReport(key) {
  const report = reportDefs.find(item => item.key === key)
  if (!report || report.disabled) return

  const idx = selectedKeys.value.indexOf(key)
  if (idx === -1) selectedKeys.value.push(key)
  else selectedKeys.value.splice(idx, 1)
}

function toggleSelectAll() {
  selectedKeys.value = allSelected.value ? [] : selectableDefs.value.map(report => report.key)
}

function toDateInput(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

function addParam(params, key, value) {
  if (value !== null && value !== undefined && value !== '') params[key] = value
}

function addSegment(params) {
  if (filters.segment !== 'ALL') params.segment = filters.segment
}

function buildParams(reportKey) {
  const params = {}

  if (['riwayat_pembayaran', 'rekap_pembayaran', 'pendapatan_di_muka', 'jurnal_pic'].includes(reportKey)) {
    addParam(params, 'tanggal_dari', filters.tanggal_dari)
    addParam(params, 'tanggal_sampai', filters.tanggal_sampai)
  }

  if (['mutasi_piutang', 'kinerja_ar'].includes(reportKey)) {
    addParam(params, 'periode_awal', filters.tanggal_dari)
    addParam(params, 'periode_akhir', filters.tanggal_sampai)
  }

  if (['aging_report', 'rekap_klien', 'riwayat_pembayaran', 'mutasi_piutang', 'rekap_pembayaran', 'kinerja_ar'].includes(reportKey)) {
    addSegment(params)
  }

  if (['aging_report', 'riwayat_pembayaran', 'mutasi_piutang', 'rekap_pembayaran', 'jurnal_pic', 'pendapatan_di_muka'].includes(reportKey)) {
    addParam(params, 'klien_ar_id', filters.klien_ar_id)
  }

  if (['riwayat_pembayaran', 'rekap_pembayaran', 'jurnal_pic'].includes(reportKey)) {
    addParam(params, 'metode_pembayaran', filters.metode_pembayaran)
  }

  if (reportKey === 'aging_report') {
    addParam(params, 'as_of_date', agingFilter.as_of_date)
  }

  if (reportKey === 'rekap_klien') {
    addParam(params, 'periode_bulan', rekapKlienFilter.periode_bulan)
    addParam(params, 'periode_tahun', rekapKlienFilter.periode_tahun)
  }

  if (reportKey === 'riwayat_pembayaran') {
    params.per_page = 9999
    params.page = 1
  }

  if (reportKey === 'jurnal_pic') {
    addParam(params, 'no_referensi', jurnalPicFilter.no_referensi)
    addParam(params, 'karyawan_id', jurnalPicFilter.karyawan_id)
    addParam(params, 'status_rekonsiliasi', jurnalPicFilter.status_rekonsiliasi)
  }

  if (reportKey === 'pendapatan_di_muka') {
    addParam(params, 'status', pdmFilter.status)
  }

  return params
}

async function doExport() {
  if (!selectedKeys.value.length) return

  exporting.value = true
  try {
    const builders = selectedDefs.value.map(report => SHEET_BUILDERS[report.key]).filter(Boolean)
    const sheets = await Promise.all(builders.map(build => build()))

    if (!sheets.length) return

    const { default: writeXlsxFile } = await import('write-excel-file/browser')

    await writeXlsxFile(sheets).toFile(`export-data-ar-${todayStr}.xlsx`)

    showSuccess({
      title: 'Export Berhasil',
      text: `1 file Excel berhasil dibuat (${sheets.length} sheet: ${selectedDefs.value.map(r => r.label).join(', ')}).`,
      timerProgressBar: true,
      timer: 3000,
      showConfirmButton: false,
    })
  } catch (err) {
    console.error('Export gagal:', err)
    showError({
      title: 'Export Gagal',
      text: err?.response?.data?.message || err?.message || 'Terjadi kesalahan saat mengambil data',
      confirmButtonColor: '#283593',
    })
  } finally {
    exporting.value = false
  }
}

async function fetchRekapKlien() {
  const { data } = await api.get('/finance/invoices/rekap-klien', {
    params: buildParams('rekap_klien'),
  })

  return data.data ?? []
}

async function fetchRiwayatPembayaran() {
  const { data } = await api.get('/finance/pembayaran', {
    params: buildParams('riwayat_pembayaran'),
  })

  return data.data ?? []
}

function n(value) {
  return value === null || value === undefined ? 0 : Number(value)
}

function fmtDate(value) {
  if (!value) return '-'
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number)
    
    return new Date(year, month - 1, day).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const date = new Date(value)
  
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
}

function buildRekapKlienSection(rows) {
  const bulanLabel = rekapKlienFilter.periode_bulan
    ? (bulanOptions.find(month => month.value === rekapKlienFilter.periode_bulan)?.label ?? '')
    : 'Semua Bulan'

  return {
    sheetName: 'Rekap Per Klien',
    title: 'REKAP PIUTANG PER KLIEN',
    meta: `Periode: ${bulanLabel} ${rekapKlienFilter.periode_tahun ?? ''} | Segment: ${filters.segment} | Total Klien: ${rows.length}`,
    headers: ['No', 'Kode Klien', 'Nama Klien', 'PIC AR', 'Entitas', 'Jml Invoice', 'Total Tagihan', 'Total Terbayar', 'Sisa Piutang', 'Overdue', 'Collection Rate', 'Draft', 'Terkirim', 'Sebagian', 'Lunas'],
    aligns: ['c', '', '', '', '', 'c', 'r', 'r', 'r', 'r', 'c', 'c', 'c', 'c', 'c'],
    rows: rows.map((row, index) => [
      index + 1,
      row.kode_klien ?? '',
      row.nama_klien ?? '',
      row.pic_ar ?? '',
      row.perusahaan ?? '',
      row.total_invoice ?? 0,
      n(row.total_tagihan),
      n(row.total_pembayaran),
      n(row.sisa_tagihan),
      n(row.overdue_amount),
      `${row.collection_rate ?? 0}%`,
      row.draft ?? 0,
      row.terkirim ?? 0,
      row.sebagian ?? 0,
      row.lunas ?? 0,
    ]),
    totalRow: [
      '',
      '',
      'TOTAL',
      '',
      '',
      '',
      rows.reduce((sum, row) => sum + n(row.total_tagihan), 0),
      rows.reduce((sum, row) => sum + n(row.total_pembayaran), 0),
      rows.reduce((sum, row) => sum + n(row.sisa_tagihan), 0),
      rows.reduce((sum, row) => sum + n(row.overdue_amount), 0),
      '',
      '',
      '',
      '',
      '',
    ],
    numericCols: [5, 11, 12, 13, 14],
    currencyCols: [6, 7, 8, 9],
  }
}

function buildRiwayatPembayaranSection(rows) {
  return {
    sheetName: 'Riwayat Pembayaran',
    title: 'RIWAYAT PEMBAYARAN AR',
    meta: `Periode: ${fmtDate(filters.tanggal_dari)} s/d ${fmtDate(filters.tanggal_sampai)} | Segment: ${filters.segment} | Total Transaksi: ${rows.length}`,
    headers: ['No', 'Tanggal', 'No Invoice', 'Klien', 'Jumlah (Rp)', 'Metode', 'Status Rekon', 'No Referensi', 'Jenis', 'Dicatat Oleh'],
    aligns: ['c', 'c', '', '', 'r', 'c', 'c', '', 'c', ''],
    rows: rows.map((row, index) => [
      index + 1,
      fmtDate(row.tanggal_pembayaran),
      row.no_invoice ?? '',
      row.klien ?? '',
      n(row.jumlah_pembayaran),
      row.metode_pembayaran ?? '',
      row.status_rekonsiliasi ?? 'MANUAL',
      row.no_referensi ?? '-',
      row.jenis ?? 'REG',
      row.created_by_name ?? '',
    ]),
    totalRow: ['', '', '', 'TOTAL', rows.reduce((sum, row) => sum + n(row.jumlah_pembayaran), 0), '', '', '', '', ''],
    currencyCols: [4],
  }
}

const AGING_BUCKET_LABELS = {
  current: 'Belum Jatuh Tempo',
  hari_1_30: '1–30 Hari',
  hari_31_60: '31–60 Hari',
  hari_61_90: '61–90 Hari',
  hari_91_plus: '>90 Hari',
}

function bucketLabel(key) {
  return AGING_BUCKET_LABELS[key] ?? key ?? '-'
}

function flattenDetails(rows) {
  return (rows ?? []).flatMap(row =>
    (row.details ?? []).map(detail => ({ ...detail, nama_klien: row.nama_klien, kode_klien: row.kode_klien })),
  )
}

async function fetchJurnalPicAll() {
  const rows = []
  let page = 1
  let lastPage = 1

  do {
    const { data } = await api.get('/finance/jurnal-pic', {
      params: { ...buildParams('jurnal_pic'), per_page: 100, page },
    })

    rows.push(...(data.data ?? []))
    lastPage = data.meta?.last_page ?? 1
    page += 1
  } while (page <= lastPage)

  return rows
}

function buildJurnalPicSection(rows) {
  return {
    sheetName: 'Jurnal PIC',
    title: 'JURNAL AKTIVITAS PER PIC AR',
    meta: `Periode: ${fmtDate(filters.tanggal_dari)} s/d ${fmtDate(filters.tanggal_sampai)} | Total Transaksi: ${rows.length}`,
    headers: ['No', 'No Referensi', 'PIC', 'No Invoice', 'Klien', 'Tgl Bayar', 'Jumlah Bayar', 'Sisa Piutang', 'Status Invoice', 'Metode', 'Status Rekon'],
    aligns: ['c', '', '', '', '', 'c', 'r', 'r', 'c', 'c', 'c'],
    rows: rows.map((row, index) => [
      index + 1,
      row.no_referensi ?? '-',
      row.pic_nama ?? '-',
      row.no_invoice ?? '-',
      row.klien ?? '-',
      fmtDate(row.tanggal_pembayaran),
      n(row.jumlah_pembayaran),
      n(row.sisa_piutang),
      row.invoice_status ?? '-',
      row.metode_pembayaran ?? '-',
      row.status_rekonsiliasi ?? 'MANUAL',
    ]),
    totalRow: ['', '', '', '', 'TOTAL', '', rows.reduce((sum, row) => sum + n(row.jumlah_pembayaran), 0), '', '', '', ''],
    currencyCols: [6, 7],
  }
}

async function fetchRekapPembayaran() {
  const { data } = await api.get('/finance/rekap-pembayaran', { params: buildParams('rekap_pembayaran') })
  
  return data.data ?? { rows: [] }
}

function buildRekapPembayaranSection(report) {
  const rows = report.rows ?? []

  return {
    sheetName: 'Rekap Pembayaran',
    title: 'REKAP PEMBAYARAN AR',
    meta: `Periode: ${fmtDate(report.tanggal_dari)} s/d ${fmtDate(report.tanggal_sampai)} | Total Transaksi: ${rows.length}`,
    headers: ['No', 'Tanggal', 'Klien', 'Invoice', 'No Referensi', 'Metode', 'Nominal', 'PIC AR', 'Rekon'],
    aligns: ['c', 'c', '', '', '', 'c', 'r', '', 'c'],
    rows: rows.map((row, index) => [
      index + 1,
      fmtDate(row.tanggal),
      row.client ?? '-',
      row.invoice ?? '-',
      row.ref_payment ?? '-',
      row.metode ?? '-',
      n(row.nominal),
      row.pic_ar ?? '-',
      row.is_rekon ? 'Ya' : 'Tidak',
    ]),
    totalRow: ['', '', '', '', '', 'TOTAL', rows.reduce((sum, row) => sum + n(row.nominal), 0), '', ''],
    currencyCols: [6],
  }
}

async function fetchKinerjaAr() {
  const { data } = await api.get('/finance/kinerja-ar', { params: buildParams('kinerja_ar') })
  
  return data.data ?? { rows: [] }
}

function buildKinerjaArSection(report) {
  const rows = report.rows ?? []

  return {
    sheetName: 'Kinerja AR',
    title: 'KINERJA AR PER PIC',
    meta: `Periode: ${fmtDate(report.periode_awal)} s/d ${fmtDate(report.periode_akhir)} | Jumlah AR Officer: ${rows.length}`,
    headers: ['No', 'AR Officer', 'Entitas', 'Jml Klien', 'Jml Invoice', 'Total Tagihan', 'Total Terkumpul', 'Sisa', 'Collection Rate'],
    aligns: ['c', '', '', 'c', 'c', 'r', 'r', 'r', 'c'],
    rows: rows.map((row, index) => [
      index + 1,
      row.nama_karyawan ?? '-',
      row.perusahaan ?? '-',
      row.jumlah_klien ?? 0,
      row.jumlah_invoice ?? 0,
      n(row.total_tagihan),
      n(row.total_terkumpul),
      n(row.total_sisa),
      `${row.collection_rate ?? 0}%`,
    ]),
    totalRow: [
      '',
      '',
      'TOTAL',
      '',
      '',
      rows.reduce((sum, row) => sum + n(row.total_tagihan), 0),
      rows.reduce((sum, row) => sum + n(row.total_terkumpul), 0),
      rows.reduce((sum, row) => sum + n(row.total_sisa), 0),
      '',
    ],
    numericCols: [3, 4],
    currencyCols: [5, 6, 7],
  }
}

async function fetchPendapatanDiMuka() {
  const { data } = await api.get('/finance/pendapatan-di-muka', { params: buildParams('pendapatan_di_muka') })
  
  return { rows: data.data ?? [], summary: data.summary ?? {} }
}

function buildPendapatanDiMukaSection({ rows, summary }) {
  return {
    sheetName: 'Pendapatan di Muka',
    title: 'PENDAPATAN DITERIMA DI MUKA',
    meta: `Jumlah Record: ${summary.jumlah_record ?? rows.length}`,
    headers: ['No', 'Tanggal Pencatatan', 'Klien', 'Investor', 'No Ref Sumber', 'Jumlah PDM', 'Sisa PDM', 'Status', 'Keterangan', 'Dicatat Oleh'],
    aligns: ['c', 'c', '', '', '', 'r', 'r', 'c', '', ''],
    rows: rows.map((row, index) => [
      index + 1,
      fmtDate(row.tanggal_pencatatan),
      row.klien ?? '-',
      row.investor ?? '-',
      row.no_referensi_sumber ?? '-',
      n(row.jumlah),
      n(row.sisa_pdm),
      row.status ?? '-',
      row.keterangan ?? '-',
      row.created_by ?? '-',
    ]),
    totalRow: [
      '',
      '',
      '',
      '',
      'TOTAL',
      rows.reduce((sum, row) => sum + n(row.jumlah), 0),
      rows.reduce((sum, row) => sum + n(row.sisa_pdm), 0),
      '',
      '',
      '',
    ],
    currencyCols: [5, 6],
  }
}

async function fetchAgingReport() {
  const { data } = await api.get('/finance/aging-report', { params: buildParams('aging_report') })
  
  return data.data ?? { rows: [] }
}

function buildAgingSummarySection(report) {
  const rows = report.rows ?? []

  return {
    sheetName: 'Aging Report',
    title: 'AGING REPORT - RINGKASAN PER KLIEN',
    meta: `Per Tanggal: ${fmtDate(report.as_of_date)} | Total Klien: ${rows.length}`,
    headers: ['No', 'Kode Klien', 'Nama Klien', 'PIC AR', 'Current', '1-30 Hari', '31-60 Hari', '61-90 Hari', '>90 Hari', 'Total'],
    aligns: ['c', '', '', '', 'r', 'r', 'r', 'r', 'r', 'r'],
    rows: rows.map((row, index) => [
      index + 1,
      row.kode_klien ?? '-',
      row.nama_klien ?? '-',
      row.pic_ar ?? '-',
      n(row.current),
      n(row.hari_1_30),
      n(row.hari_31_60),
      n(row.hari_61_90),
      n(row.hari_91_plus),
      n(row.total),
    ]),
    totalRow: [
      '',
      '',
      'TOTAL',
      '',
      rows.reduce((sum, row) => sum + n(row.current), 0),
      rows.reduce((sum, row) => sum + n(row.hari_1_30), 0),
      rows.reduce((sum, row) => sum + n(row.hari_31_60), 0),
      rows.reduce((sum, row) => sum + n(row.hari_61_90), 0),
      rows.reduce((sum, row) => sum + n(row.hari_91_plus), 0),
      rows.reduce((sum, row) => sum + n(row.total), 0),
    ],
    currencyCols: [4, 5, 6, 7, 8, 9],
  }
}

function buildAgingDetailSection(detailRows, report) {
  return {
    sheetName: 'Aging Report',
    title: 'AGING REPORT - DETAIL INVOICE',
    meta: `Per Tanggal: ${fmtDate(report.as_of_date)} | Total Invoice: ${detailRows.length}`,
    headers: ['No', 'Klien', 'No Invoice', 'Tgl Invoice', 'Jatuh Tempo', 'Umur (hr)', 'Terlambat (hr)', 'Bucket', 'Total Tagihan', 'Total Bayar', 'Sisa Tagihan', 'Status', 'PIC AR', 'Entitas'],
    aligns: ['c', '', '', 'c', 'c', 'r', 'r', 'c', 'r', 'r', 'r', 'c', '', ''],
    rows: detailRows.map((row, index) => [
      index + 1,
      row.nama_klien ?? '-',
      row.no_invoice ?? '-',
      fmtDate(row.tanggal_invoice),
      fmtDate(row.tanggal_jatuh_tempo),
      row.umur_invoice ?? 0,
      row.hari_terlambat ?? 0,
      bucketLabel(row.bucket),
      n(row.total_tagihan),
      n(row.total_pembayaran),
      n(row.sisa_tagihan),
      row.status ?? '-',
      row.pic_ar ?? '-',
      row.perusahaan ?? '-',
    ]),
    totalRow: [
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      'TOTAL',
      detailRows.reduce((sum, row) => sum + n(row.total_tagihan), 0),
      detailRows.reduce((sum, row) => sum + n(row.total_pembayaran), 0),
      detailRows.reduce((sum, row) => sum + n(row.sisa_tagihan), 0),
      '',
      '',
      '',
    ],
    numericCols: [5, 6],
    currencyCols: [8, 9, 10],
  }
}

async function fetchMutasiPiutang() {
  const { data } = await api.get('/finance/mutasi-piutang', { params: buildParams('mutasi_piutang') })
  
  return data.data ?? { rows: [] }
}

function buildMutasiSummarySection(report) {
  const rows = report.rows ?? []

  return {
    sheetName: 'Mutasi Piutang',
    title: 'MUTASI PIUTANG - RINGKASAN PER KLIEN',
    meta: `Periode: ${fmtDate(report.periode_awal)} s/d ${fmtDate(report.periode_akhir)} | Total Klien: ${rows.length}`,
    headers: ['No', 'Kode Klien', 'Nama Klien', 'Entitas', 'Saldo Awal', 'Invoice Masuk', 'Pembayaran', 'Saldo Akhir'],
    aligns: ['c', '', '', '', 'r', 'r', 'r', 'r'],
    rows: rows.map((row, index) => [
      index + 1,
      row.kode_klien ?? '-',
      row.nama_klien ?? '-',
      row.perusahaan ?? '-',
      n(row.saldo_awal),
      n(row.invoice_masuk),
      n(row.pembayaran),
      n(row.saldo_akhir),
    ]),
    totalRow: [
      '',
      '',
      '',
      'TOTAL',
      rows.reduce((sum, row) => sum + n(row.saldo_awal), 0),
      rows.reduce((sum, row) => sum + n(row.invoice_masuk), 0),
      rows.reduce((sum, row) => sum + n(row.pembayaran), 0),
      rows.reduce((sum, row) => sum + n(row.saldo_akhir), 0),
    ],
    currencyCols: [4, 5, 6, 7],
  }
}

function buildMutasiDetailSection(detailRows, report) {
  return {
    sheetName: 'Mutasi Piutang',
    title: 'MUTASI PIUTANG - DETAIL MUTASI',
    meta: `Periode: ${fmtDate(report.periode_awal)} s/d ${fmtDate(report.periode_akhir)} | Total Baris Mutasi: ${detailRows.length}`,
    headers: ['No', 'Kode Klien', 'Nama Klien', 'Tanggal', 'Tipe', 'Dokumen', 'Invoice', 'Debit', 'Kredit', 'Saldo', 'Keterangan'],
    aligns: ['c', '', '', 'c', 'c', '', '', 'r', 'r', 'r', ''],
    rows: detailRows.map((row, index) => [
      index + 1,
      row.kode_klien ?? '-',
      row.nama_klien ?? '-',
      fmtDate(row.tanggal),
      row.label ?? row.tipe ?? '-',
      row.no_dokumen ?? '-',
      row.no_invoice ?? '-',
      n(row.debit),
      n(row.kredit),
      n(row.saldo),
      row.keterangan ?? '-',
    ]),
    totalRow: [
      '',
      '',
      '',
      '',
      '',
      '',
      'TOTAL',
      detailRows.reduce((sum, row) => sum + n(row.debit), 0),
      detailRows.reduce((sum, row) => sum + n(row.kredit), 0),
      '',
      '',
    ],
    currencyCols: [7, 8, 9],
  }
}

function sectionToSheetData(section) {
  const exportDate = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const currencyCols = section.currencyCols ?? []
  const numericCols = (section.numericCols ?? []).filter(index => !currencyCols.includes(index))
  const columnCount = section.headers.length
  const aligns = section.aligns ?? []

  const getAlign = index => {
    if (currencyCols.includes(index) || aligns[index] === 'r') return 'right'
    if (aligns[index] === 'c') return 'center'
    
    return 'left'
  }

  const titleRow = [
    {
      value: section.title,
      span: columnCount,
      fontWeight: 'bold',
      color: '#FFFFFF',
      backgroundColor: '#0D47A1',
      fontSize: 14,
      fontFamily: 'Calibri',
      align: 'left',
      alignVertical: 'middle',
      height: 32,
    },
    ...Array.from({ length: columnCount - 1 }, () => null),
  ]

  const metaRow = [
    {
      value: `${section.meta} | Diekspor: ${exportDate} | Project Iron`,
      span: columnCount,
      fontStyle: 'italic',
      color: '#90CAF9',
      backgroundColor: '#1565C0',
      fontSize: 9,
      fontFamily: 'Calibri',
      align: 'left',
      alignVertical: 'middle',
      height: 16,
    },
    ...Array.from({ length: columnCount - 1 }, () => null),
  ]

  const headerRow = section.headers.map((header, index) => ({
    value: header,
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: '#283593',
    fontSize: 10,
    fontFamily: 'Calibri',
    align: getAlign(index),
    alignVertical: 'middle',
    height: 22,
    borderStyle: 'thin',
    borderColor: '#3949AB',
  }))

  const dataRows = section.rows.map((row, rowIndex) => {
    const backgroundColor = rowIndex % 2 === 0 ? '#F3F4FD' : '#FFFFFF'
    const borderColor = rowIndex % 2 === 0 ? '#DCDFE6' : '#EEEEEE'

    return row.map((value, index) => {
      const isCurrency = currencyCols.includes(index)
      const isNumeric = numericCols.includes(index)

      return {
        value,
        type: (isCurrency || isNumeric) && typeof value === 'number' ? Number : undefined,
        format: (isCurrency || isNumeric) && typeof value === 'number' ? '#,##0' : undefined,
        fontWeight: isCurrency ? 'bold' : undefined,
        color: isCurrency ? '#1A237E' : '#212121',
        backgroundColor,
        fontSize: 10,
        fontFamily: 'Calibri',
        align: getAlign(index),
        alignVertical: 'middle',
        height: 16,
        borderStyle: 'thin',
        borderColor,
      }
    })
  })

  const totalRows = section.totalRow
    ? [
      section.totalRow.map((value, index) => ({
        value,
        type: currencyCols.includes(index) && typeof value === 'number' ? Number : undefined,
        format: currencyCols.includes(index) && typeof value === 'number' ? '#,##0' : undefined,
        fontWeight: 'bold',
        color: '#FFFFFF',
        backgroundColor: '#E65100',
        fontSize: 10,
        fontFamily: 'Calibri',
        align: getAlign(index),
        alignVertical: 'middle',
        height: 18,
        borderStyle: 'thin',
        borderColor: '#BF360C',
      })),
    ]
    : []

  return [titleRow, metaRow, headerRow, ...dataRows, ...totalRows]
}

function combineSideBySide(leftGrid, rightGrid, leftColCount, rightColCount, gapColCount = 1) {
  const rowCount = Math.max(leftGrid.length, rightGrid.length)
  const blankLeft = Array.from({ length: leftColCount }, () => null)
  const blankRight = Array.from({ length: rightColCount }, () => null)
  const gapCells = Array.from({ length: gapColCount }, () => null)

  return Array.from({ length: rowCount }, (_, i) => [
    ...(leftGrid[i] ?? blankLeft),
    ...gapCells,
    ...(rightGrid[i] ?? blankRight),
  ])
}

function columnsFor(section) {
  return section.headers.map((header, index) => ({
    width: (section.currencyCols ?? []).includes(index) ? 22 : Math.max((header?.length ?? 10) + 4, 14),
  }))
}

function singleSheet(sheetName, section) {
  return { sheet: sheetName, data: sectionToSheetData(section), columns: columnsFor(section) }
}

async function dualBlockSheet(sheetName, leftSection, rightSection) {
  return {
    sheet: sheetName,
    data: combineSideBySide(
      sectionToSheetData(leftSection),
      sectionToSheetData(rightSection),
      leftSection.headers.length,
      rightSection.headers.length,
    ),
    columns: [...columnsFor(leftSection), { width: 3 }, ...columnsFor(rightSection)],
  }
}

const SHEET_BUILDERS = {
  aging_report: async () => {
    const report = await fetchAgingReport()
    const detailRows = flattenDetails(report.rows)
    
    return dualBlockSheet('Aging Report', buildAgingSummarySection(report), buildAgingDetailSection(detailRows, report))
  },
  mutasi_piutang: async () => {
    const report = await fetchMutasiPiutang()
    const detailRows = flattenDetails(report.rows)
    
    return dualBlockSheet('Mutasi Piutang', buildMutasiSummarySection(report), buildMutasiDetailSection(detailRows, report))
  },
  jurnal_pic: async () => singleSheet('Jurnal PIC', buildJurnalPicSection(await fetchJurnalPicAll())),
  rekap_klien: async () => singleSheet('Rekap Per Klien', buildRekapKlienSection(await fetchRekapKlien())),
  riwayat_pembayaran: async () => singleSheet('Riwayat Pembayaran', buildRiwayatPembayaranSection(await fetchRiwayatPembayaran())),
  rekap_pembayaran: async () => singleSheet('Rekap Pembayaran', buildRekapPembayaranSection(await fetchRekapPembayaran())),
  kinerja_ar: async () => singleSheet('Kinerja AR', buildKinerjaArSection(await fetchKinerjaAr())),
  pendapatan_di_muka: async () => singleSheet('Pendapatan di Muka', buildPendapatanDiMukaSection(await fetchPendapatanDiMuka())),
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

.report-tile--disabled {
  cursor: not-allowed;
  opacity: 0.62;
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
