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

    <!-- Pilih Laporan -->
    <VCard class="mb-4">
      <VCardText>
        <div class="d-flex justify-space-between align-center mb-4">
          <div>
            <div class="text-h6 font-weight-bold">Pilih Laporan yang Ingin Di-Export</div>
            <div class="text-caption text-medium-emphasis">Centang satu atau lebih laporan, lalu klik Export Excel</div>
          </div>
          <VBtn variant="tonal" size="small" color="primary" @click="toggleSelectAll">
            {{ allSelected ? 'Batal Semua' : 'Pilih Semua' }}
          </VBtn>
        </div>

        <VRow>
          <VCol v-for="rpt in reportDefs" :key="rpt.key" cols="12" sm="6" md="4">
            <VCard
              :variant="isSelected(rpt.key) ? 'tonal' : 'outlined'"
              :color="isSelected(rpt.key) ? rpt.color : undefined"
              class="cursor-pointer h-100 transition-all"
              style="border-width: 2px;"
              @click="toggleReport(rpt.key)"
            >
              <VCardText class="d-flex align-center gap-3 pa-4">
                <VCheckbox
                  :model-value="isSelected(rpt.key)"
                  hide-details
                  density="compact"
                  :color="rpt.color"
                  @click.stop
                  @update:model-value="toggleReport(rpt.key)"
                />
                <VAvatar :color="rpt.color" variant="tonal" size="42">
                  <VIcon :icon="rpt.icon" size="22" />
                </VAvatar>
                <div>
                  <div class="font-weight-semibold text-body-1">{{ rpt.label }}</div>
                  <div class="text-caption text-medium-emphasis mt-1">{{ rpt.description }}</div>
                </div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Filter -->
    <VCard v-if="selectedKeys.length > 0" class="mb-4">
      <VCardText>
        <div class="text-h6 font-weight-bold mb-1">Pengaturan Filter</div>
        <div class="text-caption text-medium-emphasis mb-4">Sesuaikan rentang tanggal dan filter khusus per laporan</div>

        <!-- Global date range -->
        <VCard variant="tonal" color="primary" class="mb-3" rounded="lg">
          <VCardText class="pa-3">
            <div class="d-flex align-center gap-2 mb-1">
              <VIcon icon="ri-calendar-line" size="16" color="primary" />
              <span class="text-subtitle-2 font-weight-semibold">Periode Utama</span>
            </div>
            <div class="text-caption text-medium-emphasis mb-3">
              Berlaku untuk: Mutasi Piutang, Rekap Pembayaran, Kinerja AR, Riwayat Pembayaran
            </div>
            <div class="d-flex flex-wrap gap-3">
              <VTextField
                v-model="filters.dari"
                label="Dari Tanggal"
                type="date"
                density="compact"
                hide-details
                style="max-width: 190px"
              />
              <VTextField
                v-model="filters.sampai"
                label="Sampai Tanggal"
                type="date"
                density="compact"
                hide-details
                style="max-width: 190px"
              />
            </div>
          </VCardText>
        </VCard>

        <!-- Aging specific -->
        <VCard v-if="isSelected('aging_report')" variant="outlined" class="mb-3" rounded="lg">
          <VCardText class="pa-3">
            <div class="d-flex align-center gap-2 mb-3">
              <VIcon icon="ri-bar-chart-grouped-line" size="16" color="primary" />
              <span class="text-subtitle-2 font-weight-semibold">Aging Report — Per Tanggal</span>
            </div>
            <VTextField
              v-model="agingFilter.as_of_date"
              label="Per Tanggal"
              type="date"
              density="compact"
              hide-details
              style="max-width: 190px"
            />
            <div class="text-caption text-medium-emphasis mt-2">
              Kosongkan untuk menggunakan "Sampai Tanggal" di atas
            </div>
          </VCardText>
        </VCard>

        <!-- Rekap Per Klien specific -->
        <VCard v-if="isSelected('rekap_klien')" variant="outlined" class="mb-3" rounded="lg">
          <VCardText class="pa-3">
            <div class="d-flex align-center gap-2 mb-3">
              <VIcon icon="ri-pie-chart-2-line" size="16" color="secondary" />
              <span class="text-subtitle-2 font-weight-semibold">Rekap Per Klien — Periode Bulan/Tahun</span>
            </div>
            <div class="d-flex flex-wrap gap-3">
              <VSelect
                v-model="rekapKlienFilter.bulan"
                placeholder="Semua Bulan"
                clearable
                hide-details
                density="compact"
                style="max-width: 170px"
                :items="bulanOptions"
                item-title="label"
                item-value="value"
              />
              <VTextField
                v-model="rekapKlienFilter.tahun"
                placeholder="Tahun"
                hide-details
                density="compact"
                style="max-width: 110px"
                type="number"
              />
            </div>
          </VCardText>
        </VCard>

        <!-- Jatuh Tempo specific -->
        <VCard v-if="isSelected('jatuh_tempo')" variant="outlined" class="mb-3" rounded="lg">
          <VCardText class="pa-3">
            <div class="d-flex align-center gap-2 mb-3">
              <VIcon icon="ri-time-line" size="16" color="deep-orange" />
              <span class="text-subtitle-2 font-weight-semibold">Tagihan Jatuh Tempo — Tipe Filter</span>
            </div>
            <div class="d-flex flex-wrap gap-3 align-center">
              <VSelect
                v-model="jatuhTempoFilter.filter_type"
                label="Tipe Filter"
                density="compact"
                hide-details
                style="max-width: 200px"
                :items="[
                  { label: 'Akan Jatuh Tempo', value: 'upcoming' },
                  { label: 'Sudah Lewat',       value: 'overdue'  },
                  { label: 'Semua',             value: 'all'      },
                ]"
                item-title="label"
                item-value="value"
              />
              <VSelect
                v-if="jatuhTempoFilter.filter_type === 'upcoming'"
                v-model="jatuhTempoFilter.days"
                label="Dalam"
                density="compact"
                hide-details
                style="max-width: 140px"
                :items="[
                  { label: '7 Hari',  value: 7  },
                  { label: '14 Hari', value: 14 },
                  { label: '30 Hari', value: 30 },
                  { label: '60 Hari', value: 60 },
                  { label: '90 Hari', value: 90 },
                ]"
                item-title="label"
                item-value="value"
              />
            </div>
          </VCardText>
        </VCard>
      </VCardText>
    </VCard>

    <!-- Action -->
    <VCard>
      <VCardText class="d-flex flex-wrap justify-space-between align-center gap-3">
        <div>
          <div v-if="selectedKeys.length > 0" class="text-subtitle-1 font-weight-medium">
            {{ selectedKeys.length }} laporan dipilih
          </div>
          <div v-else class="text-subtitle-1 text-medium-emphasis">Belum ada laporan dipilih</div>
          <div class="text-caption text-medium-emphasis mt-1">
            <template v-if="selectedKeys.length > 0">
              {{ selectedKeys.map(k => reportDefs.find(r => r.key === k)?.label).join(' · ') }}
            </template>
            <template v-else>Silakan pilih minimal satu laporan di atas</template>
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
          Export Excel
        </VBtn>
      </VCardText>
    </VCard>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import api from '@/utils/axios'

const exporting = ref(false)
const selectedKeys = ref([])

const now      = new Date()
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
const todayStr = now.toISOString().slice(0, 10)

const filters         = reactive({ dari: firstDay, sampai: lastDay })
const agingFilter     = reactive({ as_of_date: '' })
const jatuhTempoFilter = reactive({ filter_type: 'all', days: 30 })
const rekapKlienFilter = reactive({ bulan: null, tahun: now.getFullYear() })

const reportDefs = [
  { key: 'aging_report',      label: 'Aging Report',         icon: 'ri-bar-chart-grouped-line', description: 'Laporan umur piutang belum terbayar',    color: 'primary'   },
  { key: 'rekap_klien',       label: 'Rekap Per Klien',      icon: 'ri-pie-chart-2-line',        description: 'Ringkasan outstanding piutang per klien', color: 'secondary' },
  { key: 'riwayat_pembayaran',label: 'Riwayat Pembayaran',   icon: 'ri-money-cny-circle-line',   description: 'Daftar semua pembayaran AR',              color: 'success'   },
  { key: 'mutasi_piutang',    label: 'Mutasi Piutang',       icon: 'ri-exchange-funds-line',     description: 'Pergerakan piutang per klien',           color: 'info'      },
  // NEXT UPDATE: Jatuh Tempo disembunyikan sementara (kolom tanggal_jatuh_tempo dihapus dari DB)
  // { key: 'jatuh_tempo',       label: 'Tagihan Jatuh Tempo',  icon: 'ri-time-line',               description: 'Invoice yang akan/sudah jatuh tempo',    color: 'deep-orange' },
  { key: 'rekap_pembayaran',  label: 'Rekap Pembayaran',     icon: 'ri-bank-card-line',          description: 'Ringkasan pembayaran per metode & tanggal',color: 'error'    },
  { key: 'kinerja_ar',        label: 'Kinerja AR',           icon: 'ri-user-star-line',          description: 'Performa penagihan per AR Officer',      color: 'deep-purple' },
]

const allSelected = computed(() => selectedKeys.value.length === reportDefs.length)

const bulanOptions = [
  { label: 'Januari', value: 1 }, { label: 'Februari', value: 2 }, { label: 'Maret', value: 3 },
  { label: 'April',   value: 4 }, { label: 'Mei',       value: 5 }, { label: 'Juni',  value: 6 },
  { label: 'Juli',    value: 7 }, { label: 'Agustus',   value: 8 }, { label: 'September', value: 9 },
  { label: 'Oktober', value: 10 },{ label: 'November',  value: 11 },{ label: 'Desember',  value: 12 },
]

function isSelected(key) { return selectedKeys.value.includes(key) }

function toggleReport(key) {
  const idx = selectedKeys.value.indexOf(key)
  if (idx === -1) selectedKeys.value.push(key)
  else selectedKeys.value.splice(idx, 1)
}

function toggleSelectAll() {
  selectedKeys.value = allSelected.value ? [] : reportDefs.map(r => r.key)
}

// ── API fetchers ───────────────────────────────────────────────────────────────

async function fetchAgingReport() {
  const { data } = await api.get('/finance/aging-report', {
    params: { as_of_date: agingFilter.as_of_date || filters.sampai },
  })
  return data.data
}

async function fetchRekapKlien() {
  const params = {}
  if (rekapKlienFilter.bulan) params.periode_bulan = rekapKlienFilter.bulan
  if (rekapKlienFilter.tahun) params.periode_tahun = rekapKlienFilter.tahun
  const { data } = await api.get('/finance/invoices/rekap-klien', { params })
  return data.data ?? []
}

async function fetchRiwayatPembayaran() {
  const { data } = await api.get('/finance/pembayaran', {
    params: { tanggal_dari: filters.dari, tanggal_sampai: filters.sampai, per_page: 9999, page: 1 },
  })
  return data.data ?? []
}

async function fetchMutasiPiutang() {
  const { data } = await api.get('/finance/mutasi-piutang', {
    params: { periode_awal: filters.dari, periode_akhir: filters.sampai },
  })
  return data.data
}

async function fetchJatuhTempo() {
  const params = { filter_type: jatuhTempoFilter.filter_type }
  if (jatuhTempoFilter.filter_type === 'upcoming') params.days = jatuhTempoFilter.days
  const { data } = await api.get('/finance/jatuh-tempo', { params })
  return data.data
}

async function fetchRekapPembayaran() {
  const { data } = await api.get('/finance/rekap-pembayaran', {
    params: { tanggal_dari: filters.dari, tanggal_sampai: filters.sampai },
  })
  return data.data
}

async function fetchKinerjaAr() {
  const { data } = await api.get('/finance/kinerja-ar', {
    params: { periode_awal: filters.dari, periode_akhir: filters.sampai },
  })
  return data.data
}

// ── Section builders ────────────────────────────────────────────────────────────

function n(v) { return (v === null || v === undefined) ? 0 : Number(v) }

function fmtDate(val) {
  if (!val) return '-'
  const d = new Date(val)
  return isNaN(d) ? val : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
}

function buildAgingSection(rd) {
  const rows    = rd.rows ?? []
  const summary = rd.summary ?? {}
  return {
    sheetName: 'Aging Report',
    title: 'AGING REPORT — Laporan Umur Piutang',
    meta:  `Per Tanggal: ${fmtDate(agingFilter.as_of_date || filters.sampai)}  ·  Total Klien: ${rows.length}`,
    headers: ['No', 'Kode Klien', 'Nama Klien', 'Belum Jatuh Tempo', '1–30 Hari', '31–60 Hari', '61–90 Hari', '> 90 Hari', 'Total'],
    aligns:  ['c',  '',           '',            'r',                  'r',          'r',           'r',           'r',         'r'],
    rows: rows.map((r, i) => [i+1, r.kode_klien??'', r.nama_klien??'',
      n(r.current), n(r.hari_1_30), n(r.hari_31_60), n(r.hari_61_90), n(r.hari_91_plus), n(r.total)]),
    totalRow: ['', '', 'TOTAL', n(summary.current), n(summary.hari_1_30), n(summary.hari_31_60), n(summary.hari_61_90), n(summary.hari_91_plus),
      rows.reduce((s, r) => s + n(r.total), 0)],
    currencyCols: [3, 4, 5, 6, 7, 8],
  }
}

function buildRekapKlienSection(rows) {
  const bulanLabel = rekapKlienFilter.bulan
    ? (bulanOptions.find(b => b.value === rekapKlienFilter.bulan)?.label ?? '')
    : 'Semua Bulan'
  return {
    sheetName: 'Rekap Per Klien',
    title: 'REKAP PIUTANG PER KLIEN',
    meta:  `Periode: ${bulanLabel} ${rekapKlienFilter.tahun ?? ''}  ·  Total Klien: ${rows.length}`,
    headers: ['No', 'Kode Klien', 'Nama Klien', 'Jml Invoice', 'Total Tagihan', 'Total Terbayar', 'Sisa Piutang', 'Draft', 'Terkirim', 'Sebagian', 'Lunas'],
    aligns:  ['c',  '',           '',            'c',           'r',              'r',               'r',            'c',     'c',         'c',         'c'],
    rows: rows.map((r, i) => [i+1, r.kode_klien??'', r.nama_klien??'',
      r.total_invoice??0, n(r.total_tagihan), n(r.total_pembayaran), n(r.sisa_tagihan),
      r.draft??0, r.terkirim??0, r.sebagian??0, r.lunas??0]),
    totalRow: ['', '', 'TOTAL', '',
      rows.reduce((s, r) => s + n(r.total_tagihan), 0),
      rows.reduce((s, r) => s + n(r.total_pembayaran), 0),
      rows.reduce((s, r) => s + n(r.sisa_tagihan), 0),
      '', '', '', ''],
    numericCols: [3, 7, 8, 9, 10],
    currencyCols: [4, 5, 6],
  }
}

function buildRiwayatPembayaranSection(rows) {
  return {
    sheetName: 'Riwayat Pembayaran',
    title: 'RIWAYAT PEMBAYARAN AR',
    meta:  `Periode: ${fmtDate(filters.dari)} s/d ${fmtDate(filters.sampai)}  ·  Total Transaksi: ${rows.length}`,
    headers: ['No', 'Tanggal', 'No Invoice', 'Klien', 'Jumlah (Rp)', 'Metode', 'No Referensi', 'Dicatat Oleh'],
    aligns:  ['c',  'c',       '',            '',       'r',           'c',       '',              ''],
    rows: rows.map((r, i) => [i+1, fmtDate(r.tanggal_pembayaran), r.no_invoice??'', r.klien??'',
      n(r.jumlah_pembayaran), r.metode_pembayaran??'', r.no_referensi??'-', r.created_by_name??'']),
    totalRow: ['', '', '', 'TOTAL', rows.reduce((s, r) => s + n(r.jumlah_pembayaran), 0), '', '', ''],
    currencyCols: [4],
  }
}

function buildMutasiPiutangSection(rd) {
  const rows    = rd.rows ?? []
  const summary = rd.summary ?? {}
  return {
    sheetName: 'Mutasi Piutang',
    title: 'MUTASI PIUTANG',
    meta:  `Periode: ${fmtDate(filters.dari)} s/d ${fmtDate(filters.sampai)}  ·  Total Klien: ${rows.length}`,
    headers: ['No', 'Kode Klien', 'Nama Klien', 'Saldo Awal (Rp)', 'Invoice Masuk (Rp)', 'Pembayaran (Rp)', 'Saldo Akhir (Rp)'],
    aligns:  ['c',  '',           '',            'r',               'r',                   'r',               'r'],
    rows: rows.map((r, i) => [i+1, r.kode_klien??'', r.nama_klien??'',
      n(r.saldo_awal), n(r.invoice_masuk), n(r.pembayaran), n(r.saldo_akhir)]),
    totalRow: ['', '', 'TOTAL', n(summary.saldo_awal), n(summary.invoice_masuk), n(summary.pembayaran), n(summary.saldo_akhir)],
    currencyCols: [3, 4, 5, 6],
  }
}

function buildJatuhTempoSection(rd) {
  const rows    = rd.rows ?? []
  const summary = rd.summary ?? {}
  const selisihLabel = (hari) => {
    if (hari === null || hari === undefined) return 'Tdk Ada JT'
    if (hari < 0) return `${Math.abs(hari)} hari lewat`
    if (hari === 0) return 'Hari ini'
    return `${hari} hari lagi`
  }
  const ftLabel = { upcoming: 'Akan Jatuh Tempo', overdue: 'Sudah Lewat', all: 'Semua' }
  return {
    title: 'TAGIHAN JATUH TEMPO',
    meta:  `Filter: ${ftLabel[jatuhTempoFilter.filter_type]}  ·  Total Invoice: ${rows.length}  ·  Total Sisa: Rp ${n(summary.total_sisa).toLocaleString('id-ID')}`,
    headers: ['No', 'No Invoice', 'Kode Klien', 'Nama Klien', 'PIC AR', 'Jatuh Tempo', 'Status Hari', 'Status', 'Sisa Tagihan (Rp)'],
    aligns:  ['c',  '',           '',            '',            '',        'c',            'c',           'c',      'r'],
    rows: rows.map((r, i) => [i+1, r.no_invoice??'', r.kode_klien??'', r.nama_klien??'',
      r.pic_ar??'-', fmtDate(r.tanggal_jatuh_tempo), selisihLabel(r.selisih_hari), r.status??'', n(r.sisa_tagihan)]),
    totalRow: null,
    currencyCols: [8],
  }
}

function buildRekapPembayaranSection(rd) {
  const rows    = rd.rows ?? []
  const summary = rd.summary ?? {}
  const fmtRp   = (v) => v ? `Rp ${n(v).toLocaleString('id-ID')}` : '-'
  return {
    sheetName: 'Rekap Pembayaran',
    title: 'REKAP PEMBAYARAN',
    meta:  `Periode: ${fmtDate(filters.dari)} s/d ${fmtDate(filters.sampai)}  ·  Total Transaksi: ${summary.jumlah_transaksi ?? 0}`,
    headers: ['No', 'Tanggal', 'Client', 'Invoice', 'Ref Payment', 'Metode', 'Nominal (Rp)', 'PIC AR', 'Rekon'],
    aligns:  ['c',  'c',       '',       '',          '',             'c',      'r',             '',       'c'],
    rows: rows.map((r, i) => [i+1, fmtDate(r.tanggal), r.client??'', r.invoice??'-', r.ref_payment??'-',
      r.metode??'', n(r.nominal), r.pic_ar??'-', r.is_rekon ? 'Ya' : '-']),
    totalRow: ['', 'TOTAL', '', '', '', '', n(summary.total),
      `T: ${fmtRp(summary.transfer)}  C: ${fmtRp(summary.cash)}  G: ${fmtRp(summary.giro)}`, ''],
    currencyCols: [6],
  }
}

function buildKinerjaArSection(rd) {
  const rows    = rd.rows ?? []
  const summary = rd.summary ?? {}
  return {
    sheetName: 'Kinerja AR',
    title: 'KINERJA AR PER PIC',
    meta:  `Periode: ${fmtDate(filters.dari)} s/d ${fmtDate(filters.sampai)}  ·  Jumlah AR Officer: ${rows.length}  ·  Collection Rate: ${summary.collection_rate ?? 0}%`,
    headers: ['No', 'AR Officer', 'Jml Klien', 'Jml Invoice', 'Total Tagihan (Rp)', 'Terkumpul (Rp)', 'Sisa (Rp)', 'Collection Rate'],
    aligns:  ['c',  '',           'c',          'c',           'r',                  'r',               'r',          'c'],
    rows: rows.map((r, i) => [i+1, r.nama_karyawan??'',
      r.jumlah_klien??0, r.jumlah_invoice??0,
      n(r.total_tagihan), n(r.total_terkumpul), n(r.total_sisa), `${r.collection_rate ?? 0}%`]),
    totalRow: ['', 'TOTAL', '', '',
      n(summary.total_tagihan), n(summary.total_terkumpul),
      n(summary.total_tagihan) - n(summary.total_terkumpul),
      `${summary.collection_rate ?? 0}%`],
    numericCols: [2, 3],
    currencyCols: [4, 5, 6],
  }
}


// ── HTML/XLS builder (SpreadsheetML, multi-sheet) ────────────────────

function buildHtmlExcel(sections) {
  const exportDate = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

  const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const styles = `<Styles>
  <Style ss:ID="sT"><Font ss:Bold="1" ss:Color="#FFFFFF" ss:Size="14" ss:Name="Calibri"/><Interior ss:Color="#0D47A1" ss:Pattern="Solid"/></Style>
  <Style ss:ID="sM"><Font ss:Italic="1" ss:Color="#90CAF9" ss:Size="9" ss:Name="Calibri"/><Interior ss:Color="#0D47A1" ss:Pattern="Solid"/></Style>
  <Style ss:ID="sHL"><Font ss:Bold="1" ss:Color="#FFFFFF" ss:Size="10" ss:Name="Calibri"/><Interior ss:Color="#283593" ss:Pattern="Solid"/></Style>
  <Style ss:ID="sHR"><Font ss:Bold="1" ss:Color="#FFFFFF" ss:Size="10" ss:Name="Calibri"/><Interior ss:Color="#283593" ss:Pattern="Solid"/><Alignment ss:Horizontal="Right"/></Style>
  <Style ss:ID="sHC"><Font ss:Bold="1" ss:Color="#FFFFFF" ss:Size="10" ss:Name="Calibri"/><Interior ss:Color="#283593" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style>
  <Style ss:ID="dE"><Interior ss:Color="#F3F4FD" ss:Pattern="Solid"/><Font ss:Name="Calibri" ss:Size="10"/></Style>
  <Style ss:ID="dO"><Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/><Font ss:Name="Calibri" ss:Size="10"/></Style>
  <Style ss:ID="dRE"><Interior ss:Color="#F3F4FD" ss:Pattern="Solid"/><Font ss:Name="Calibri" ss:Size="10"/><Alignment ss:Horizontal="Right"/></Style>
  <Style ss:ID="dRO"><Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/><Font ss:Name="Calibri" ss:Size="10"/><Alignment ss:Horizontal="Right"/></Style>
  <Style ss:ID="dCE"><Interior ss:Color="#F3F4FD" ss:Pattern="Solid"/><Font ss:Name="Calibri" ss:Size="10"/><Alignment ss:Horizontal="Center"/></Style>
  <Style ss:ID="dCO"><Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/><Font ss:Name="Calibri" ss:Size="10"/><Alignment ss:Horizontal="Center"/></Style>
  <Style ss:ID="dNE"><Interior ss:Color="#F3F4FD" ss:Pattern="Solid"/><Font ss:Name="Calibri" ss:Size="10"/><Alignment ss:Horizontal="Right"/><NumberFormat ss:Format="#,##0"/></Style>
  <Style ss:ID="dNO"><Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/><Font ss:Name="Calibri" ss:Size="10"/><Alignment ss:Horizontal="Right"/><NumberFormat ss:Format="#,##0"/></Style>
  <Style ss:ID="dCuE"><Interior ss:Color="#F3F4FD" ss:Pattern="Solid"/><Font ss:Color="#1A237E" ss:Bold="1" ss:Name="Calibri" ss:Size="10"/><Alignment ss:Horizontal="Right"/><NumberFormat ss:Format="#,##0"/></Style>
  <Style ss:ID="dCuO"><Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/><Font ss:Color="#1A237E" ss:Bold="1" ss:Name="Calibri" ss:Size="10"/><Alignment ss:Horizontal="Right"/><NumberFormat ss:Format="#,##0"/></Style>
  <Style ss:ID="tot"><Interior ss:Color="#E65100" ss:Pattern="Solid"/><Font ss:Bold="1" ss:Color="#FFFFFF" ss:Name="Calibri" ss:Size="10"/></Style>
  <Style ss:ID="totR"><Interior ss:Color="#E65100" ss:Pattern="Solid"/><Font ss:Bold="1" ss:Color="#FFFFFF" ss:Name="Calibri" ss:Size="10"/><Alignment ss:Horizontal="Right"/></Style>
  <Style ss:ID="totCu"><Interior ss:Color="#E65100" ss:Pattern="Solid"/><Font ss:Bold="1" ss:Color="#FFFFFF" ss:Name="Calibri" ss:Size="10"/><Alignment ss:Horizontal="Right"/><NumberFormat ss:Format="#,##0"/></Style>
</Styles>`

  function buildWs(s) {
    const cols  = s.headers.length
    const cCols = s.currencyCols ?? []
    const nCols = (s.numericCols ?? []).filter(i => !cCols.includes(i))

    const hStyle = (ci) => {
      if (cCols.includes(ci) || s.aligns[ci] === 'r') return 'sHR'
      return s.aligns[ci] === 'c' ? 'sHC' : 'sHL'
    }
    const dStyle = (ci, ri) => {
      const e = ri % 2 === 0
      if (cCols.includes(ci)) return e ? 'dCuE' : 'dCuO'
      if (nCols.includes(ci)) return e ? 'dNE' : 'dNO'
      if (s.aligns[ci] === 'r') return e ? 'dRE' : 'dRO'
      if (s.aligns[ci] === 'c') return e ? 'dCE' : 'dCO'
      return e ? 'dE' : 'dO'
    }
    const tStyle = (ci) => {
      if (cCols.includes(ci)) return 'totCu'
      return s.aligns[ci] === 'r' ? 'totR' : 'tot'
    }
    const mkCell = (val, sid, isNum = false) => {
      if (isNum && typeof val === 'number')
        return `<Cell ss:StyleID="${sid}"><Data ss:Type="Number">${val}</Data></Cell>`
      const str = val === null || val === undefined ? '' : String(val)
      return `<Cell ss:StyleID="${sid}"><Data ss:Type="String">${esc(str)}</Data></Cell>`
    }

    const hRow  = `<Row>${s.headers.map((h, i) => mkCell(h, hStyle(i))).join('')}</Row>`
    const dRows = s.rows.map((row, ri) =>
      `<Row>${row.map((v, ci) => mkCell(v, dStyle(ci, ri), cCols.includes(ci) || nCols.includes(ci))).join('')}</Row>`
    ).join('\n    ')
    const tRow  = s.totalRow
      ? `<Row>${s.totalRow.map((v, ci) => mkCell(v, tStyle(ci), cCols.includes(ci))).join('')}</Row>`
      : ''

    return `<Worksheet ss:Name="${esc(s.sheetName)}">
  <Table>
    <Row><Cell ss:StyleID="sT" ss:MergeAcross="${cols - 1}"><Data ss:Type="String">${esc(s.title)}</Data></Cell></Row>
    <Row><Cell ss:StyleID="sM" ss:MergeAcross="${cols - 1}"><Data ss:Type="String">${esc(s.meta)} · Diekspor: ${exportDate} · Project Iron</Data></Cell></Row>
    ${hRow}
    ${dRows}
    ${tRow}
  </Table>
</Worksheet>`
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
          xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
          xmlns:html="http://www.w3.org/TR/REC-html40">
  ${styles}
  ${sections.map(buildWs).join('\n  ')}
</Workbook>`
}

function downloadXls(html, filename) {
  const bom  = '﻿'
  const blob = new Blob([bom + html], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── Export handler ──────────────────────────────────────────────────────────────

async function doExport() {
  if (!selectedKeys.value.length) return
  exporting.value = true
  try {
    const fetchMap = {
      aging_report:       async () => buildAgingSection(await fetchAgingReport()),
      rekap_klien:        async () => buildRekapKlienSection(await fetchRekapKlien()),
      riwayat_pembayaran: async () => buildRiwayatPembayaranSection(await fetchRiwayatPembayaran()),
      mutasi_piutang:     async () => buildMutasiPiutangSection(await fetchMutasiPiutang()),
      // NEXT UPDATE: jatuh_tempo:  async () => buildJatuhTempoSection(await fetchJatuhTempo()),
      rekap_pembayaran:   async () => buildRekapPembayaranSection(await fetchRekapPembayaran()),
      kinerja_ar:         async () => buildKinerjaArSection(await fetchKinerjaAr()),
    }

    const sections = []
    for (const def of reportDefs) {
      if (selectedKeys.value.includes(def.key))
        sections.push(await fetchMap[def.key]())
    }

    downloadXls(buildHtmlExcel(sections), `laporan-ar-${todayStr}.xls`)
  } catch (err) {
    console.error('Export gagal:', err)
  } finally {
    exporting.value = false
  }
}
</script>
