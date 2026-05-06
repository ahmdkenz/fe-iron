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
        <div class="mb-4 pa-3 rounded" style="background: rgba(var(--v-theme-primary), 0.06); border: 1px solid rgba(var(--v-theme-primary), 0.15)">
          <div class="text-subtitle-2 font-weight-semibold mb-2">
            <VIcon icon="ri-calendar-line" size="16" class="me-1" />
            Periode Utama
            <span class="text-caption text-medium-emphasis ms-1">(berlaku untuk Mutasi, Rekap Pembayaran, Kinerja AR, Riwayat Pembayaran)</span>
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
        </div>

        <!-- Aging specific -->
        <div v-if="isSelected('aging_report')" class="mb-3 pa-3 rounded" style="background: rgba(var(--v-theme-surface-variant), 0.5); border: 1px solid rgba(var(--v-border-color), 0.3)">
          <div class="text-subtitle-2 font-weight-semibold mb-2">
            <VAvatar color="primary" variant="tonal" size="20" class="me-1">
              <VIcon icon="ri-bar-chart-grouped-line" size="12" />
            </VAvatar>
            Aging Report — Per Tanggal
          </div>
          <VTextField
            v-model="agingFilter.as_of_date"
            label="Per Tanggal"
            type="date"
            density="compact"
            hide-details
            style="max-width: 190px"
          />
          <div class="text-caption text-medium-emphasis mt-1">Kosongkan untuk menggunakan "Sampai Tanggal" di atas</div>
        </div>

        <!-- Rekap Per Klien specific -->
        <div v-if="isSelected('rekap_klien')" class="mb-3 pa-3 rounded" style="background: rgba(var(--v-theme-surface-variant), 0.5); border: 1px solid rgba(var(--v-border-color), 0.3)">
          <div class="text-subtitle-2 font-weight-semibold mb-2">
            <VAvatar color="secondary" variant="tonal" size="20" class="me-1">
              <VIcon icon="ri-pie-chart-2-line" size="12" />
            </VAvatar>
            Rekap Per Klien — Periode Bulan/Tahun
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
        </div>

        <!-- Jatuh Tempo specific -->
        <div v-if="isSelected('jatuh_tempo')" class="mb-3 pa-3 rounded" style="background: rgba(var(--v-theme-surface-variant), 0.5); border: 1px solid rgba(var(--v-border-color), 0.3)">
          <div class="text-subtitle-2 font-weight-semibold mb-2">
            <VAvatar color="warning" variant="tonal" size="20" class="me-1">
              <VIcon icon="ri-time-line" size="12" />
            </VAvatar>
            Tagihan Jatuh Tempo — Tipe Filter
          </div>
          <div class="d-flex flex-wrap gap-3 align-center">
            <VBtnToggle
              v-model="jatuhTempoFilter.filter_type"
              density="compact"
              variant="outlined"
              mandatory
              color="warning"
            >
              <VBtn value="upcoming">Akan JT</VBtn>
              <VBtn value="overdue">Sudah Lewat</VBtn>
              <VBtn value="all">Semua</VBtn>
            </VBtnToggle>
            <VSelect
              v-if="jatuhTempoFilter.filter_type === 'upcoming'"
              v-model="jatuhTempoFilter.days"
              label="Dalam"
              density="compact"
              hide-details
              style="max-width: 130px"
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
        </div>
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
          color="success"
          size="large"
          :loading="exporting"
          :disabled="selectedKeys.length === 0"
          prepend-icon="ri-file-excel-2-line"
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
  { key: 'jatuh_tempo',       label: 'Tagihan Jatuh Tempo',  icon: 'ri-time-line',               description: 'Invoice yang akan/sudah jatuh tempo',    color: 'warning'   },
  { key: 'rekap_pembayaran',  label: 'Rekap Pembayaran',     icon: 'ri-bank-card-line',          description: 'Ringkasan pembayaran per metode & tanggal',color: 'error'    },
  { key: 'kinerja_ar',        label: 'Kinerja AR',           icon: 'ri-user-star-line',          description: 'Performa penagihan per AR Officer',      color: 'purple'    },
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
    title: 'AGING REPORT (LAPORAN UMUR PIUTANG)',
    meta:  `Per Tanggal: ${fmtDate(agingFilter.as_of_date || filters.sampai)}  |  Total Klien: ${rows.length}`,
    headers: ['No', 'Kode Klien', 'Nama Klien', 'Perusahaan', 'Belum Jatuh Tempo', '1–30 Hari', '31–60 Hari', '61–90 Hari', '> 90 Hari', 'Total'],
    aligns:  ['c',  '',           '',            '',            'r',                  'r',          'r',           'r',           'r',         'r'],
    rows: rows.map((r, i) => [i+1, r.kode_klien??'', r.nama_klien??'', r.perusahaan??'-',
      n(r.current), n(r.hari_1_30), n(r.hari_31_60), n(r.hari_61_90), n(r.hari_91_plus), n(r.total)]),
    totalRow: ['', '', 'TOTAL', '', n(summary.current), n(summary.hari_1_30), n(summary.hari_31_60), n(summary.hari_61_90), n(summary.hari_91_plus),
      rows.reduce((s, r) => s + n(r.total), 0)],
    numericCols: [4, 5, 6, 7, 8, 9],
  }
}

function buildRekapKlienSection(rows) {
  const bulanLabel = rekapKlienFilter.bulan
    ? (bulanOptions.find(b => b.value === rekapKlienFilter.bulan)?.label ?? '')
    : 'Semua Bulan'
  return {
    title: 'REKAP PIUTANG PER KLIEN',
    meta:  `Periode: ${bulanLabel} ${rekapKlienFilter.tahun ?? ''}  |  Total Klien: ${rows.length}`,
    headers: ['No', 'Kode Klien', 'Nama Klien', 'Perusahaan', 'Jml Invoice', 'Total Tagihan', 'Total Terbayar', 'Sisa Piutang'],
    aligns:  ['c',  '',           '',            '',            'c',           'r',              'r',               'r'],
    rows: rows.map((r, i) => [i+1, r.kode_klien??'', r.nama_klien??'', r.perusahaan??'-',
      r.total_invoice??0, n(r.total_tagihan), n(r.total_pembayaran), n(r.sisa_tagihan)]),
    totalRow: ['', '', 'TOTAL', '', '',
      rows.reduce((s, r) => s + n(r.total_tagihan), 0),
      rows.reduce((s, r) => s + n(r.total_pembayaran), 0),
      rows.reduce((s, r) => s + n(r.sisa_tagihan), 0)],
    numericCols: [5, 6, 7],
  }
}

function buildRiwayatPembayaranSection(rows) {
  return {
    title: 'RIWAYAT PEMBAYARAN AR',
    meta:  `Periode: ${fmtDate(filters.dari)} s/d ${fmtDate(filters.sampai)}  |  Total Transaksi: ${rows.length}`,
    headers: ['No', 'Tanggal', 'No Invoice', 'Klien', 'Perusahaan', 'Jumlah (Rp)', 'Metode', 'No Referensi', 'Dicatat Oleh'],
    aligns:  ['c',  '',        '',            '',       '',            'r',           'c',       '',              ''],
    rows: rows.map((r, i) => [i+1, fmtDate(r.tanggal_pembayaran), r.no_invoice??'', r.klien??'',
      r.perusahaan??'-', n(r.jumlah_pembayaran), r.metode_pembayaran??'', r.no_referensi??'-', r.created_by_name??'']),
    totalRow: ['', '', '', 'TOTAL', '', rows.reduce((s, r) => s + n(r.jumlah_pembayaran), 0), '', '', ''],
    numericCols: [5],
  }
}

function buildMutasiPiutangSection(rd) {
  const rows    = rd.rows ?? []
  const summary = rd.summary ?? {}
  return {
    title: 'MUTASI PIUTANG',
    meta:  `Periode: ${fmtDate(filters.dari)} s/d ${fmtDate(filters.sampai)}  |  Total Klien: ${rows.length}`,
    headers: ['No', 'Kode Klien', 'Nama Klien', 'Perusahaan', 'Saldo Awal (Rp)', 'Invoice Masuk (Rp)', 'Pembayaran (Rp)', 'Saldo Akhir (Rp)'],
    aligns:  ['c',  '',           '',            '',            'r',               'r',                   'r',               'r'],
    rows: rows.map((r, i) => [i+1, r.kode_klien??'', r.nama_klien??'', r.perusahaan??'-',
      n(r.saldo_awal), n(r.invoice_masuk), n(r.pembayaran), n(r.saldo_akhir)]),
    totalRow: ['', '', 'TOTAL', '', n(summary.saldo_awal), n(summary.invoice_masuk), n(summary.pembayaran), n(summary.saldo_akhir)],
    numericCols: [4, 5, 6, 7],
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
    meta:  `Filter: ${ftLabel[jatuhTempoFilter.filter_type]}  |  Total Invoice: ${rows.length}  |  Total Sisa: Rp ${n(summary.total_sisa).toLocaleString('id-ID')}`,
    headers: ['No', 'No Invoice', 'Kode Klien', 'Nama Klien', 'Perusahaan', 'PIC AR', 'Jatuh Tempo', 'Status Hari', 'Status', 'Sisa Tagihan (Rp)'],
    aligns:  ['c',  '',           '',            '',            '',            '',        'c',            'c',           'c',      'r'],
    rows: rows.map((r, i) => [i+1, r.no_invoice??'', r.kode_klien??'', r.nama_klien??'',
      r.perusahaan??'-', r.pic_ar??'-', fmtDate(r.tanggal_jatuh_tempo), selisihLabel(r.selisih_hari), r.status??'', n(r.sisa_tagihan)]),
    totalRow: null,
    numericCols: [9],
  }
}

function buildRekapPembayaranSection(rd) {
  const rows    = rd.rows ?? []
  const summary = rd.summary ?? {}
  return {
    title: 'REKAP PEMBAYARAN',
    meta:  `Periode: ${fmtDate(filters.dari)} s/d ${fmtDate(filters.sampai)}  |  Total Transaksi: ${summary.jumlah_transaksi ?? 0}`,
    headers: ['No', 'Tanggal', 'Transfer (Rp)', 'Cash (Rp)', 'Giro (Rp)', 'Total (Rp)'],
    aligns:  ['c',  '',         'r',             'r',          'r',          'r'],
    rows: rows.map((r, i) => [i+1, fmtDate(r.tanggal), n(r.transfer), n(r.cash), n(r.giro), n(r.total)]),
    totalRow: ['', 'TOTAL', n(summary.transfer), n(summary.cash), n(summary.giro), n(summary.total)],
    numericCols: [2, 3, 4, 5],
  }
}

function buildKinerjaArSection(rd) {
  const rows    = rd.rows ?? []
  const summary = rd.summary ?? {}
  return {
    title: 'KINERJA AR PER PIC',
    meta:  `Periode: ${fmtDate(filters.dari)} s/d ${fmtDate(filters.sampai)}  |  Jumlah AR Officer: ${rows.length}  |  Collection Rate: ${summary.collection_rate ?? 0}%`,
    headers: ['No', 'AR Officer', 'Perusahaan', 'Jml Klien', 'Jml Invoice', 'Total Tagihan (Rp)', 'Terkumpul (Rp)', 'Sisa (Rp)', 'Collection Rate'],
    aligns:  ['c',  '',           '',            'c',          'c',           'r',                  'r',               'r',          'c'],
    rows: rows.map((r, i) => [i+1, r.nama_karyawan??'', r.perusahaan??'-',
      r.jumlah_klien??0, r.jumlah_invoice??0,
      n(r.total_tagihan), n(r.total_terkumpul), n(r.total_sisa), `${r.collection_rate ?? 0}%`]),
    totalRow: ['', 'TOTAL', '', '', '',
      n(summary.total_tagihan), n(summary.total_terkumpul),
      n(summary.total_tagihan) - n(summary.total_terkumpul),
      `${summary.collection_rate ?? 0}%`],
    numericCols: [5, 6, 7],
  }
}

// ── HTML/XLS builder ────────────────────────────────────────────────────────────

function buildHtmlExcel(sections) {
  const exportDate = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

  const css = `
    body{font-family:Calibri,Arial,sans-serif;font-size:11pt;margin:24px;background:#fff}
    .doc-title{font-size:18pt;font-weight:bold;color:#0D47A1;margin-bottom:2px}
    .doc-sub{font-size:9pt;color:#666;margin-bottom:24px}
    .main-tbl{border-collapse:collapse;width:100%;margin-bottom:6px}
    .sec-title{background:#0D47A1;color:#fff;font-size:12pt;font-weight:bold;padding:10px 14px;letter-spacing:.4px}
    .sec-meta{background:#E3F2FD;color:#1565C0;font-size:9pt;padding:5px 14px;font-style:italic;border-bottom:2px solid #1976D2}
    .th{background:#1565C0;color:#fff;font-weight:bold;font-size:10pt;padding:8px 12px;border:1px solid #0D47A1;white-space:nowrap}
    .th.r{text-align:right}.th.c{text-align:center}
    .td{padding:6px 12px;border:1px solid #BBDEFB;font-size:10pt;vertical-align:middle}
    .td.r{text-align:right}.td.c{text-align:center}
    .even .td{background:#E8F4FD}.odd .td{background:#fff}
    .total-row .td{background:#0D47A1!important;color:#fff!important;font-weight:bold;border:1px solid #083b79}
    .spacer{height:28px}
  `

  const buildSection = (s) => {
    const colCount = s.headers.length
    const thRow = s.headers.map((h, i) => {
      const cls = s.aligns[i] === 'r' ? 'r' : s.aligns[i] === 'c' ? 'c' : ''
      return `<th class="th${cls ? ' '+cls : ''}">${h}</th>`
    }).join('')

    const dataRows = s.rows.map((row, ri) => {
      const cls = ri % 2 === 0 ? 'even' : 'odd'
      const cells = row.map((cell, ci) => {
        const align = s.aligns[ci] === 'r' ? ' r' : s.aligns[ci] === 'c' ? ' c' : ''
        let val = cell
        if (s.numericCols?.includes(ci) && typeof cell === 'number')
          val = cell === 0 ? '-' : cell.toLocaleString('id-ID')
        return `<td class="td${align}">${val}</td>`
      }).join('')
      return `<tr class="${cls}">${cells}</tr>`
    }).join('')

    let totalRowHtml = ''
    if (s.totalRow) {
      const cells = s.totalRow.map((cell, ci) => {
        let val = cell
        if (s.numericCols?.includes(ci) && typeof cell === 'number')
          val = cell === 0 ? '-' : cell.toLocaleString('id-ID')
        return `<td class="td">${val}</td>`
      }).join('')
      totalRowHtml = `<tr class="total-row">${cells}</tr>`
    }

    return `
      <tr><td colspan="${colCount}" class="sec-title">${s.title}</td></tr>
      <tr><td colspan="${colCount}" class="sec-meta">${s.meta}</td></tr>
      <tr>${thRow}</tr>
      ${dataRows}
      ${totalRowHtml}
      <tr><td colspan="${colCount}" class="spacer"></td></tr>
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
<div class="doc-title">LAPORAN ACCOUNT RECEIVABLE</div>
<div class="doc-sub">Diekspor pada: ${exportDate} &nbsp;|&nbsp; Sistem: Project Iron</div>
<table class="main-tbl">
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
      jatuh_tempo:        async () => buildJatuhTempoSection(await fetchJatuhTempo()),
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
