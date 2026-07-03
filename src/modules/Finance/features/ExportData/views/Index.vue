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
        <div class="d-flex flex-wrap justify-space-between align-center gap-3 mb-4">
          <div>
            <div class="text-h6 font-weight-bold">Pilih Laporan</div>
            <div class="text-caption text-medium-emphasis">Centang satu atau lebih laporan yang akan di-export</div>
          </div>
          <VBtn variant="tonal" size="small" color="primary" @click="toggleSelectAll">
            {{ allSelected ? 'Batal Semua' : 'Pilih Semua' }}
          </VBtn>
        </div>

        <VRow>
          <VCol v-for="rpt in reportDefs" :key="rpt.key" cols="12" sm="6" md="4">
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
              <VAvatar :color="rpt.color" variant="tonal" size="42">
                <VIcon :icon="rpt.icon" size="22" />
              </VAvatar>
              <div class="min-width-0">
                <div class="font-weight-semibold text-body-1">{{ rpt.label }}</div>
                <div class="text-caption text-medium-emphasis mt-1">{{ rpt.description }}</div>
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
      </VCardText>
    </VCard>

    <VCard v-if="selectedKeys.length > 0" class="mb-4">
      <VCardTitle class="px-5 pt-5 pb-0 text-subtitle-2 text-uppercase text-medium-emphasis font-weight-bold">
        Filter Export
      </VCardTitle>
      <VCardText class="pa-5">
        <VRow dense>
          <VCol v-if="showSegmentFilter" cols="12" sm="auto">
            <VBtnToggle
              v-model="filters.segment"
              color="primary"
              variant="outlined"
              mandatory
              divided
              density="compact"
            >
              <VBtn value="ALL" size="small" style="min-width: 80px">Semua</VBtn>
              <VBtn value="B2C" size="small" style="min-width: 70px">B2C</VBtn>
              <VBtn value="B2B" size="small" style="min-width: 70px">B2B</VBtn>
            </VBtnToggle>
          </VCol>

          <VCol v-if="showPeriodFilter" cols="6" sm="auto">
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

          <VCol v-if="showPeriodFilter" cols="6" sm="auto">
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

          <VCol v-if="showClientFilter" cols="12" sm>
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
              @focus="ensureKlienLoaded()"
            />
          </VCol>

          <VCol v-if="showPaymentMethodFilter" cols="12" sm="auto">
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

        <VDivider v-if="showSpecialFilters" class="my-4" />

        <VRow v-if="showSpecialFilters" dense>
          <VCol v-if="isSelected('aging_report')" cols="12" md="4">
            <div class="filter-group">
              <div class="d-flex align-center gap-2 mb-3">
                <VIcon icon="ri-bar-chart-grouped-line" size="16" color="primary" />
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

          <VCol v-if="isSelected('rekap_klien')" cols="12" md="4">
            <div class="filter-group">
              <div class="d-flex align-center gap-2 mb-3">
                <VIcon icon="ri-pie-chart-2-line" size="16" color="secondary" />
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

          <VCol v-if="isSelected('jurnal_pic')" cols="12" md="4">
            <div class="filter-group">
              <div class="d-flex align-center gap-2 mb-3">
                <VIcon icon="ri-file-list-3-line" size="16" color="warning" />
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
                  @focus="ensureKaryawanLoaded()"
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

          <VCol v-if="isSelected('pendapatan_di_muka')" cols="12" md="4">
            <div class="filter-group">
              <div class="d-flex align-center gap-2 mb-3">
                <VIcon icon="ri-time-line" size="16" color="deep-purple" />
                <span class="text-subtitle-2 font-weight-semibold">Pendapatan di Muka</span>
              </div>
              <div class="d-flex flex-column gap-3">
                <VAutocomplete
                  v-model="pdmFilter.investor_id"
                  label="Investor"
                  placeholder="Semua Investor"
                  clearable
                  density="compact"
                  variant="outlined"
                  hide-details
                  :items="investorList"
                  item-title="nama_investor"
                  item-value="id"
                  :loading="investorLoading"
                  @focus="ensureInvestorLoaded()"
                />
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

    <VCard>
      <VCardText class="d-flex flex-wrap justify-space-between align-center gap-3">
        <div class="min-width-0">
          <div v-if="selectedKeys.length > 0" class="text-subtitle-1 font-weight-medium">
            {{ selectedKeys.length }} laporan dipilih
          </div>
          <div v-else class="text-subtitle-1 text-medium-emphasis">Belum ada laporan dipilih</div>
          <div class="text-caption text-medium-emphasis mt-1 selected-labels">
            <template v-if="selectedKeys.length > 0">
              {{ selectedDefs.map(r => r.label).join(' | ') }}
            </template>
            <template v-else>Silakan pilih minimal satu laporan</template>
          </div>
        </div>
        <VBtn
          color="primary"
          size="large"
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
const { items: investorList, loading: investorLoading, fetchAll: fetchInvestor } = useCrud('/master/investor')
const { ensureLoaded: ensureKlienLoaded } = useLazyFetchAll(fetchKlien)
const { ensureLoaded: ensureKaryawanLoaded } = useLazyFetchAll(fetchKaryawan)
const { ensureLoaded: ensureInvestorLoaded } = useLazyFetchAll(fetchInvestor)

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
const pdmFilter = reactive({ investor_id: null, status: null })

const reportDefs = [
  {
    key: 'aging_report',
    label: 'Aging Report',
    icon: 'ri-bar-chart-grouped-line',
    description: 'Umur piutang belum terbayar',
    color: 'primary',
    endpoint: '/finance/aging-report/export-excel',
    supportsSegment: true,
    supportsClient: true,
    usesAsOfDate: true,
  },
  {
    key: 'jurnal_pic',
    label: 'Jurnal Aktivitas per PIC',
    icon: 'ri-file-list-3-line',
    description: 'Pembayaran berdasarkan PIC dan referensi',
    color: 'warning',
    endpoint: '/finance/jurnal-pic/export-excel',
    usesPeriod: true,
    supportsClient: true,
    supportsPaymentMethod: true,
  },
  {
    key: 'rekap_klien',
    label: 'Rekap Per Klien',
    icon: 'ri-pie-chart-2-line',
    description: 'Ringkasan outstanding per klien',
    color: 'secondary',
    frontendWorkbook: true,
    supportsSegment: true,
    usesMonthYear: true,
  },
  {
    key: 'riwayat_pembayaran',
    label: 'Riwayat Pembayaran',
    icon: 'ri-money-cny-circle-line',
    description: 'Daftar semua pembayaran AR',
    color: 'success',
    frontendWorkbook: true,
    supportsSegment: true,
    supportsClient: true,
    supportsPaymentMethod: true,
    usesPeriod: true,
  },
  {
    key: 'mutasi_piutang',
    label: 'Mutasi Piutang',
    icon: 'ri-exchange-funds-line',
    description: 'Pergerakan piutang per klien',
    color: 'info',
    endpoint: '/finance/mutasi-piutang/export-excel',
    supportsSegment: true,
    supportsClient: true,
    usesPeriod: true,
  },
  {
    key: 'rekap_pembayaran',
    label: 'Rekap Pembayaran',
    icon: 'ri-bank-card-line',
    description: 'Rekap pembayaran AR per transaksi',
    color: 'error',
    endpoint: '/finance/rekap-pembayaran/export-excel',
    supportsSegment: true,
    supportsClient: true,
    supportsPaymentMethod: true,
    usesPeriod: true,
  },
  {
    key: 'kinerja_ar',
    label: 'Kinerja AR',
    icon: 'ri-user-star-line',
    description: 'Performa penagihan per PIC',
    color: 'deep-purple',
    endpoint: '/finance/kinerja-ar/export-excel',
    supportsSegment: true,
    usesPeriod: true,
  },
  {
    key: 'pendapatan_di_muka',
    label: 'Pendapatan di Muka',
    icon: 'ri-time-line',
    description: 'Pembayaran diterima sebelum jasa diberikan',
    color: 'deep-purple',
    endpoint: '/finance/pendapatan-di-muka/export-excel',
    usesPeriod: true,
  },
  {
    key: 'rekening_koran',
    label: 'Rekening Koran',
    icon: 'ri-book-open-line',
    description: 'Menunggu endpoint export resmi',
    color: 'blue-grey',
    disabled: true,
  },
]

const selectableDefs = computed(() => reportDefs.filter(report => !report.disabled))
const selectedDefs = computed(() => reportDefs.filter(report => selectedKeys.value.includes(report.key)))
const allSelected = computed(() => selectedKeys.value.length === selectableDefs.value.length)
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

  if (['aging_report', 'riwayat_pembayaran', 'mutasi_piutang', 'rekap_pembayaran', 'jurnal_pic'].includes(reportKey)) {
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
    addParam(params, 'investor_id', pdmFilter.investor_id)
    addParam(params, 'status', pdmFilter.status)
  }

  return params
}

async function doExport() {
  if (!selectedKeys.value.length) return

  exporting.value = true
  try {
    const backendDefs = selectedDefs.value.filter(report => report.endpoint)
    const workbookDefs = selectedDefs.value.filter(report => report.frontendWorkbook)
    let fileCount = 0

    for (const report of backendDefs) {
      await downloadBackendReport(report)
      fileCount += 1
    }

    if (workbookDefs.length) {
      await downloadFrontendWorkbook(workbookDefs)
      fileCount += 1
    }

    showSuccess({
      title: 'Export Berhasil',
      text: `${fileCount} file export berhasil dibuat.`,
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

async function downloadBackendReport(report) {
  const response = await api.get(report.endpoint, {
    params: buildParams(report.key),
    responseType: 'blob',
    timeout: 120000,
  })

  const fallback = `${report.key}-${buildTimestamp()}.xlsx`
  downloadBlob(response.data, pickFilename(response, fallback))
}

async function downloadFrontendWorkbook(workbookDefs) {
  const sections = []

  for (const report of workbookDefs) {
    if (report.key === 'rekap_klien')
      sections.push(buildRekapKlienSection(await fetchRekapKlien()))

    if (report.key === 'riwayat_pembayaran')
      sections.push(buildRiwayatPembayaranSection(await fetchRiwayatPembayaran()))
  }

  if (!sections.length) return

  const { default: writeXlsxFile } = await import('write-excel-file/browser')

  await writeXlsxFile(
    sections.map(section => ({
      data: sectionToSheetData(section),
      sheet: section.sheetName,
      columns: section.headers.map((header, index) => ({
        width: (section.currencyCols ?? []).includes(index) ? 22 : Math.max((header?.length ?? 10) + 4, 14),
      })),
    })),
  ).toFile(`laporan-ar-ringkasan-${todayStr}.xlsx`)
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

function downloadBlob(data, filename) {
  const url = URL.createObjectURL(new Blob([data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

function pickFilename(response, fallback) {
  const disposition = response.headers?.['content-disposition']
  if (!disposition) return fallback

  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  if (encoded) return decodeURIComponent(encoded.replace(/["]/g, ''))

  return disposition.match(/filename="?([^"]+)"?/i)?.[1] ?? fallback
}

function buildTimestamp() {
  const date = new Date()
  return (
    String(date.getDate()).padStart(2, '0')
    + String(date.getMonth() + 1).padStart(2, '0')
    + String(date.getFullYear())
    + String(date.getHours()).padStart(2, '0')
    + String(date.getMinutes()).padStart(2, '0')
    + String(date.getSeconds()).padStart(2, '0')
  )
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
        format: (isCurrency || isNumeric) ? '#,##0' : undefined,
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
          format: currencyCols.includes(index) ? '#,##0' : undefined,
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

.selected-labels {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
