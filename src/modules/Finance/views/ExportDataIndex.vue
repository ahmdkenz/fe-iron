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
    title: 'AGING REPORT — Laporan Umur Piutang',
    meta:  `Per Tanggal: ${fmtDate(agingFilter.as_of_date || filters.sampai)}  ·  Total Klien: ${rows.length}`,
    headers: ['No', 'Kode Klien', 'Nama Klien', 'Entitas', 'Belum Jatuh Tempo', '1–30 Hari', '31–60 Hari', '61–90 Hari', '> 90 Hari', 'Total'],
    aligns:  ['c',  '',           '',            '',            'r',                  'r',          'r',           'r',           'r',         'r'],
    rows: rows.map((r, i) => [i+1, r.kode_klien??'', r.nama_klien??'', r.perusahaan??'-',
      n(r.current), n(r.hari_1_30), n(r.hari_31_60), n(r.hari_61_90), n(r.hari_91_plus), n(r.total)]),
    totalRow: ['', '', 'TOTAL', '', n(summary.current), n(summary.hari_1_30), n(summary.hari_31_60), n(summary.hari_61_90), n(summary.hari_91_plus),
      rows.reduce((s, r) => s + n(r.total), 0)],
    currencyCols: [4, 5, 6, 7, 8, 9],
  }
}

function buildRekapKlienSection(rows) {
  const bulanLabel = rekapKlienFilter.bulan
    ? (bulanOptions.find(b => b.value === rekapKlienFilter.bulan)?.label ?? '')
    : 'Semua Bulan'
  return {
    title: 'REKAP PIUTANG PER KLIEN',
    meta:  `Periode: ${bulanLabel} ${rekapKlienFilter.tahun ?? ''}  ·  Total Klien: ${rows.length}`,
    headers: ['No', 'Kode Klien', 'Nama Klien', 'Entitas', 'Jml Invoice', 'Total Tagihan', 'Total Terbayar', 'Sisa Piutang'],
    aligns:  ['c',  '',           '',            '',            'c',           'r',              'r',               'r'],
    rows: rows.map((r, i) => [i+1, r.kode_klien??'', r.nama_klien??'', r.perusahaan??'-',
      r.total_invoice??0, n(r.total_tagihan), n(r.total_pembayaran), n(r.sisa_tagihan)]),
    totalRow: ['', '', 'TOTAL', '', '',
      rows.reduce((s, r) => s + n(r.total_tagihan), 0),
      rows.reduce((s, r) => s + n(r.total_pembayaran), 0),
      rows.reduce((s, r) => s + n(r.sisa_tagihan), 0)],
    numericCols: [4],
    currencyCols: [5, 6, 7],
  }
}

function buildRiwayatPembayaranSection(rows) {
  return {
    title: 'RIWAYAT PEMBAYARAN AR',
    meta:  `Periode: ${fmtDate(filters.dari)} s/d ${fmtDate(filters.sampai)}  ·  Total Transaksi: ${rows.length}`,
    headers: ['No', 'Tanggal', 'No Invoice', 'Klien', 'Entitas', 'Jumlah (Rp)', 'Metode', 'No Referensi', 'Dicatat Oleh'],
    aligns:  ['c',  'c',       '',            '',       '',            'r',           'c',       '',              ''],
    rows: rows.map((r, i) => [i+1, fmtDate(r.tanggal_pembayaran), r.no_invoice??'', r.klien??'',
      r.perusahaan??'-', n(r.jumlah_pembayaran), r.metode_pembayaran??'', r.no_referensi??'-', r.created_by_name??'']),
    totalRow: ['', '', '', 'TOTAL', '', rows.reduce((s, r) => s + n(r.jumlah_pembayaran), 0), '', '', ''],
    currencyCols: [5],
  }
}

function buildMutasiPiutangSection(rd) {
  const rows    = rd.rows ?? []
  const summary = rd.summary ?? {}
  return {
    title: 'MUTASI PIUTANG',
    meta:  `Periode: ${fmtDate(filters.dari)} s/d ${fmtDate(filters.sampai)}  ·  Total Klien: ${rows.length}`,
    headers: ['No', 'Kode Klien', 'Nama Klien', 'Entitas', 'Saldo Awal (Rp)', 'Invoice Masuk (Rp)', 'Pembayaran (Rp)', 'Saldo Akhir (Rp)'],
    aligns:  ['c',  '',           '',            '',            'r',               'r',                   'r',               'r'],
    rows: rows.map((r, i) => [i+1, r.kode_klien??'', r.nama_klien??'', r.perusahaan??'-',
      n(r.saldo_awal), n(r.invoice_masuk), n(r.pembayaran), n(r.saldo_akhir)]),
    totalRow: ['', '', 'TOTAL', '', n(summary.saldo_awal), n(summary.invoice_masuk), n(summary.pembayaran), n(summary.saldo_akhir)],
    currencyCols: [4, 5, 6, 7],
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
    headers: ['No', 'No Invoice', 'Kode Klien', 'Nama Klien', 'Entitas', 'PIC AR', 'Jatuh Tempo', 'Status Hari', 'Status', 'Sisa Tagihan (Rp)'],
    aligns:  ['c',  '',           '',            '',            '',            '',        'c',            'c',           'c',      'r'],
    rows: rows.map((r, i) => [i+1, r.no_invoice??'', r.kode_klien??'', r.nama_klien??'',
      r.perusahaan??'-', r.pic_ar??'-', fmtDate(r.tanggal_jatuh_tempo), selisihLabel(r.selisih_hari), r.status??'', n(r.sisa_tagihan)]),
    totalRow: null,
    currencyCols: [9],
  }
}

function buildRekapPembayaranSection(rd) {
  const rows    = rd.rows ?? []
  const summary = rd.summary ?? {}
  return {
    title: 'REKAP PEMBAYARAN',
    meta:  `Periode: ${fmtDate(filters.dari)} s/d ${fmtDate(filters.sampai)}  ·  Total Transaksi: ${summary.jumlah_transaksi ?? 0}`,
    headers: ['No', 'Tanggal', 'Transfer (Rp)', 'Cash (Rp)', 'Giro (Rp)', 'Total (Rp)'],
    aligns:  ['c',  'c',        'r',             'r',          'r',          'r'],
    rows: rows.map((r, i) => [i+1, fmtDate(r.tanggal), n(r.transfer), n(r.cash), n(r.giro), n(r.total)]),
    totalRow: ['', 'TOTAL', n(summary.transfer), n(summary.cash), n(summary.giro), n(summary.total)],
    currencyCols: [2, 3, 4, 5],
  }
}

function buildKinerjaArSection(rd) {
  const rows    = rd.rows ?? []
  const summary = rd.summary ?? {}
  return {
    title: 'KINERJA AR PER PIC',
    meta:  `Periode: ${fmtDate(filters.dari)} s/d ${fmtDate(filters.sampai)}  ·  Jumlah AR Officer: ${rows.length}  ·  Collection Rate: ${summary.collection_rate ?? 0}%`,
    headers: ['No', 'AR Officer', 'Entitas', 'Jml Klien', 'Jml Invoice', 'Total Tagihan (Rp)', 'Terkumpul (Rp)', 'Sisa (Rp)', 'Collection Rate'],
    aligns:  ['c',  '',           '',            'c',          'c',           'r',                  'r',               'r',          'c'],
    rows: rows.map((r, i) => [i+1, r.nama_karyawan??'', r.perusahaan??'-',
      r.jumlah_klien??0, r.jumlah_invoice??0,
      n(r.total_tagihan), n(r.total_terkumpul), n(r.total_sisa), `${r.collection_rate ?? 0}%`]),
    totalRow: ['', 'TOTAL', '', '', '',
      n(summary.total_tagihan), n(summary.total_terkumpul),
      n(summary.total_tagihan) - n(summary.total_terkumpul),
      `${summary.collection_rate ?? 0}%`],
    numericCols: [3, 4],
    currencyCols: [5, 6, 7],
  }
}

// ── HTML/XLS builder ────────────────────────────────────────────────────────────

function buildHtmlExcel(sections) {
  const exportDate = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

  const css = `
    body { font-family: Calibri, Arial, sans-serif; font-size: 10pt; margin: 0; background: #ffffff; }
    .main-tbl { border-collapse: collapse; width: 100%; }

    /* Document header */
    .hdr-title { background: #0D47A1; color: #ffffff; font-size: 16pt; font-weight: bold;
                 padding: 16px 22px 4px; letter-spacing: 0.3px; }
    .hdr-sub   { background: #0D47A1; color: #90CAF9; font-size: 9pt;
                 padding: 2px 22px 16px; }

    /* Section header */
    .sec-title { background: #1A237E; color: #ffffff; font-size: 11pt; font-weight: bold;
                 padding: 9px 16px; border-left: 5px solid #FFC107; }
    .sec-meta  { background: #E8EAF6; color: #283593; font-size: 8.5pt;
                 padding: 4px 16px 4px 21px; font-style: italic;
                 border-left: 5px solid #FFC107; border-bottom: 2px solid #5C6BC0; }

    /* Column headers */
    .th   { background: #283593; color: #ffffff; font-weight: bold; font-size: 9.5pt;
            padding: 7px 12px; border: 1px solid #1A237E; white-space: nowrap; }
    .th.r { text-align: right; }
    .th.c { text-align: center; }

    /* Data cells */
    .td     { padding: 5px 12px; border: 1px solid #E8EAF6; font-size: 9.5pt;
              vertical-align: middle; color: #212121; }
    .td.r   { text-align: right; }
    .td.c   { text-align: center; }
    .td.cur { text-align: right; color: #1A237E; font-weight: 500; }

    /* Alternating rows */
    .row-e .td { background: #F3F4FD; }
    .row-o .td { background: #ffffff; }

    /* Total row — orange accent */
    .tot .td     { background: #E65100 !important; color: #ffffff !important;
                   font-weight: bold; border: 1px solid #BF360C !important; }
    .tot .td.cur { color: #ffffff !important; }

    /* Spacer */
    .gap td { height: 22px; }
  `

  const buildSection = (s) => {
    const colCount  = s.headers.length
    const cCols     = s.currencyCols ?? []
    const nCols     = (s.numericCols ?? []).filter(i => !cCols.includes(i))

    const thRow = s.headers.map((h, i) => {
      const align = cCols.includes(i) || s.aligns[i] === 'r' ? 'r' : s.aligns[i] === 'c' ? 'c' : ''
      return `<th class="th${align ? ' '+align : ''}">${h}</th>`
    }).join('')

    const renderCell = (cell, ci, extraClass = '') => {
      const isCur = cCols.includes(ci)
      const isNum = nCols.includes(ci)
      let val = cell ?? ''
      if (isCur && typeof cell === 'number')
        val = cell === 0 ? '–' : 'Rp ' + cell.toLocaleString('id-ID')
      else if (isNum && typeof cell === 'number')
        val = cell.toLocaleString('id-ID')
      const cls = isCur ? 'cur' : s.aligns[ci] === 'r' ? 'r' : s.aligns[ci] === 'c' ? 'c' : ''
      return `<td class="td${cls ? ' '+cls : ''}${extraClass}">${val}</td>`
    }

    const dataRows = s.rows.map((row, ri) =>
      `<tr class="${ri % 2 === 0 ? 'row-e' : 'row-o'}">${row.map((c, ci) => renderCell(c, ci)).join('')}</tr>`
    ).join('')

    const totalRowHtml = s.totalRow
      ? `<tr class="tot">${s.totalRow.map((c, ci) => renderCell(c, ci)).join('')}</tr>`
      : ''

    return `
      <tr><td colspan="${colCount}" class="sec-title">${s.title}</td></tr>
      <tr><td colspan="${colCount}" class="sec-meta">${s.meta}</td></tr>
      <tr>${thRow}</tr>
      ${dataRows}
      ${totalRowHtml}
      <tr class="gap"><td colspan="${colCount}"></td></tr>
    `
  }

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="UTF-8">
<!--[if gte mso 9]><xml>
<x:ExcelWorkbook><x:ExcelWorksheets>
<x:ExcelWorksheet><x:Name>Laporan AR</x:Name>
<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook>
</xml><![endif]-->
<style>${css}</style>
</head>
<body>
<table class="main-tbl">
  <tr><td colspan="20" class="hdr-title">LAPORAN ACCOUNT RECEIVABLE</td></tr>
  <tr><td colspan="20" class="hdr-sub">Diekspor pada: ${exportDate}&nbsp;&nbsp;&middot;&nbsp;&nbsp;Sistem: Project Iron</td></tr>
  <tr class="gap"><td colspan="20"></td></tr>
  ${sections.map(buildSection).join('')}
</table>
</body>
</html>`
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
