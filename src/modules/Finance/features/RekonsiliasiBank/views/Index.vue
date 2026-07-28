<template>
  <div>
    <PageHeader
      title="Rekonsiliasi Bank"
      subtitle="Upload rekening koran bank dan cocokkan dengan data pembayaran"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Rekonsiliasi Bank', disabled: true },
      ]"
    />

    <!-- Tombol Upload — disembunyikan untuk role AR/AP murni (khusus ADMIN/MANAGER/SUPERVISOR) -->
    <VCard
      v-if="!authStore.isArOnly && !authStore.isApOnly"
      class="mb-4"
    >
      <VCardText class="d-flex align-center gap-3">
        <VBtn
          color="primary"
          prepend-icon="ri-upload-cloud-2-line"
          @click="dialog = true"
        >
          Upload Rekening Koran Bank
        </VBtn>
        <span class="text-caption text-medium-emphasis">
          Dukung format: .xlsx atau .xls
        </span>
      </VCardText>
    </VCard>

    <!-- Tabel History Upload -->
    <VCard>
      <BaseTable
        :headers="headers"
        :items="items"
        :total="total"
        :loading="loading"
        pagination-mode="load-more"
        :has-more="hasMore"
        :loading-more="loadingMore"
        :loaded-count="items.length"
        item-value="id"
        @load-more="loadMore"
      >
        <template #item.no="{ index }">
          {{ index + 1 }}
        </template>
        <template #item.periode="{ item }">
          {{ item.periode_awal }} — {{ item.periode_akhir }}
        </template>
        <template #item.total_kredit="{ item }">
          {{ formatCurrency(item.total_kredit) }}
        </template>
        <template #item.status="{ item }">
          <div class="d-flex gap-1 flex-wrap">
            <VChip
              color="success"
              size="x-small"
              variant="tonal"
            >
              {{ item.jumlah_matched }} MATCHED
            </VChip>
            <VChip
              color="error"
              size="x-small"
              variant="tonal"
            >
              {{ item.jumlah_unmatched }} UNMATCHED
            </VChip>
            <VChip
              color="grey"
              size="x-small"
              variant="tonal"
            >
              {{ item.total_transaksi - item.jumlah_matched - item.jumlah_unmatched }} lainnya
            </VChip>
          </div>
        </template>
        <template #item.aksi="{ item }">
          <div class="d-flex gap-2">
            <VBtn
              size="x-small"
              variant="tonal"
              :color="selectedId === item.id ? 'secondary' : 'primary'"
              :icon="selectedId === item.id ? 'ri-eye-off-line' : 'ri-eye-line'"
              @click="selectReport(item)"
            />
            <VBtn
              v-if="!authStore.isArOnly && !authStore.isApOnly"
              size="x-small"
              variant="tonal"
              color="error"
              icon="ri-delete-bin-line"
              @click="confirmDelete(item)"
            />
          </div>
        </template>
      </BaseTable>
    </VCard>

    <!-- Detail Rekening Koran (inline) -->
    <div
      v-if="selectedId"
      class="mt-4"
    >
      <RekonsiliasiBankDetail
        :key="selectedId"
        :report-id="selectedId"
        @close="selectedId = null"
      />
    </div>

    <!-- Dialog Upload -->
    <VDialog
      v-model="dialog"
      max-width="480"
      persistent
    >
      <VCard>
        <VCardTitle class="d-flex align-center justify-space-between pa-4">
          <span>Upload Rekening Koran Bank</span>
          <VBtn
            icon="ri-close-line"
            variant="text"
            size="small"
            @click="closeDialog"
          />
        </VCardTitle>
        <VDivider />
        <VCardText class="pt-4 d-flex flex-column gap-4">
          <!-- Download Template -->
          <div class="d-flex align-center gap-2">
            <VIcon
              icon="ri-information-line"
              size="16"
              class="text-info"
            />
            <span class="text-caption text-medium-emphasis">
              Belum punya file format yang sesuai?
            </span>
            <VBtn
              variant="text"
              color="info"
              size="x-small"
              density="compact"
              prepend-icon="ri-download-line"
              @click="doDownloadTemplate"
            >
              Download Template
            </VBtn>
          </div>

          <!-- Dropzone -->
          <div
            class="dropzone"
            :class="{ 'dropzone--active': isDragging }"
            @dragover.prevent="isDragging = true"
            @dragleave="isDragging = false"
            @drop.prevent="onDrop"
            @click="$refs.fileInput.click()"
          >
            <VIcon
              icon="ri-file-upload-line"
              size="40"
              class="mb-2 text-primary"
            />
            <div
              v-if="form.file"
              class="text-body-2 font-weight-medium text-primary"
            >
              {{ form.file.name }}
            </div>
            <div
              v-else
              class="text-body-2 text-medium-emphasis text-center"
            >
              <div>Klik atau drag & drop file di sini</div>
              <div class="text-caption mt-1">
                .xlsx atau .xls
              </div>
            </div>
            <input
              ref="fileInput"
              type="file"
              accept=".xlsx,.xls"
              style="display:none"
              @change="onFileChange"
            >
          </div>

          <VAlert
            v-if="uploadError"
            type="error"
            density="compact"
            variant="tonal"
          >
            {{ uploadError }}
          </VAlert>
        </VCardText>
        <VCardActions class="pa-4 pt-0 justify-end gap-2">
          <AppActionButton
            action="batalkan"
            @click="closeDialog"
          />
          <AppActionButton
            action="custom"
            :loading="uploading"
            :disabled="!form.file"
            @click="doUpload"
          >
            Upload & Proses
          </AppActionButton>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Dialog Progress Import (async, persistent — polling status batch) -->
    <VDialog
      v-model="progressDialog"
      max-width="480"
      persistent
    >
      <VCard>
        <VCardTitle class="pa-4">
          Import Rekening Koran Bank
        </VCardTitle>
        <VDivider />
        <VCardText class="pt-4">
          <template v-if="batchStatus?.status === 'failed'">
            <VAlert
              type="error"
              density="compact"
              variant="tonal"
            >
              {{ batchStatus.message || 'Import gagal.' }}
            </VAlert>
            <div
              v-if="batchStatus.errors?.length"
              class="mt-3"
            >
              <div class="text-caption text-medium-emphasis mb-1">
                Baris bermasalah ({{ batchStatus.error_rows }} total{{ batchStatus.errors.length < batchStatus.error_rows ? `, ditampilkan ${batchStatus.errors.length}` : '' }}):
              </div>
              <div style="max-height: 240px; overflow-y: auto;">
                <VTable density="compact">
                  <thead>
                    <tr>
                      <th>Baris</th>
                      <th>Pesan</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(e, i) in batchStatus.errors"
                      :key="i"
                    >
                      <td>{{ e.row }}</td>
                      <td>{{ e.message }}</td>
                    </tr>
                  </tbody>
                </VTable>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="d-flex align-center gap-3">
              <VProgressCircular
                indeterminate
                color="primary"
                size="24"
              />
              <span>{{ phaseLabel(batchStatus?.phase) }}</span>
            </div>
            <div
              v-if="batchStatus?.total_rows"
              class="text-caption text-medium-emphasis mt-2"
            >
              {{ batchStatus.processed_rows }} / {{ batchStatus.total_rows }} baris diproses
            </div>
          </template>
        </VCardText>
        <VCardActions class="justify-end pa-4 gap-2">
          <AppActionButton
            v-if="batchStatus?.status === 'failed'"
            action="custom"
            @click="closeProgressDialog"
          >
            Tutup
          </AppActionButton>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Dialog Konfirmasi Periode Bertumpang Tindih -->
    <VDialog
      v-model="overlapDialog"
      max-width="560"
      persistent
    >
      <VCard>
        <VCardTitle class="pa-4 text-warning">
          Periode Bertumpang Tindih
        </VCardTitle>
        <VDivider />
        <VCardText class="pt-4">
          <p>
            File ini bertumpang tindih dengan {{ batchStatus?.overlaps?.length ?? 0 }} data yang sudah diupload:
          </p>
          <div style="max-height: 240px; overflow-y: auto;">
            <VTable
              density="compact"
              class="mt-2"
            >
              <thead>
                <tr>
                  <th>Periode</th>
                  <th>Total Transaksi</th>
                  <th>Matched</th>
                  <th>Unmatched</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="o in batchStatus?.overlaps"
                  :key="o.id"
                >
                  <td>{{ o.periode_awal }} — {{ o.periode_akhir }}</td>
                  <td>{{ o.total_transaksi }}</td>
                  <td>{{ o.jumlah_matched }}</td>
                  <td>{{ o.jumlah_unmatched }}</td>
                </tr>
              </tbody>
            </VTable>
          </div>
          <VAlert
            type="warning"
            density="compact"
            variant="tonal"
            class="mt-3"
          >
            Jika dilanjutkan, semua data periode yang tumpang tindih (termasuk hasil matching manual) akan dihapus permanen dan digantikan file baru.
          </VAlert>
        </VCardText>
        <VCardActions class="justify-end pa-4 gap-2">
          <AppActionButton
            action="batalkan"
            @click="overlapDialog = false"
          />
          <AppActionButton
            action="custom"
            color="warning"
            :loading="confirming"
            @click="confirmReplace"
          >
            Ganti dengan File Baru
          </AppActionButton>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Dialog Konfirmasi Hapus -->
    <VDialog
      v-model="deleteDialog"
      max-width="380"
    >
      <VCard>
        <VCardTitle class="pa-4">
          Hapus Data Upload?
        </VCardTitle>
        <VCardText>
          Semua data transaksi dari file <strong>{{ deleteTarget?.nama_file }}</strong> akan dihapus permanen.
        </VCardText>
        <VCardActions class="justify-end pa-4 gap-2">
          <AppActionButton
            action="batalkan"
            @click="deleteDialog = false"
          />
          <AppActionButton
            action="hapus"
            :loading="deleting"
            @click="doDelete"
          />
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup>
import { markRaw, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useLoadMore } from '@/composables/useLoadMore.js'
import { useFormatter } from '@/composables/useFormatter'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/utils/axios'
import writeXlsxFile from 'write-excel-file/browser'
import RekonsiliasiBankDetail from './Detail.vue'

const authStore = useAuthStore()

const { formatCurrency } = useFormatter()

const {
  items, loading, loadingMore, hasMore, total,
  reset, loadMore, abort,
} = useLoadMore('/finance/rekonsiliasi-bank', { perPage: 15 })

const dialog      = ref(false)
const uploading   = ref(false)
const uploadError = ref('')
const isDragging  = ref(false)
const fileInput   = ref(null)

const form = reactive({ file: null })

const selectedId     = ref(null)

const deleteDialog   = ref(false)
const deleteTarget   = ref(null)
const deleting       = ref(false)

// ── Progress import async (upload -> queue -> polling) ──────────────────
const progressDialog = ref(false)
const batchId         = ref(null)
const batchStatus     = ref(null)
let pollTimer = null

const overlapDialog = ref(false)
const confirming    = ref(false)

const PHASE_LABELS = {
  queued:             'Menunggu diproses...',
  parsing:            'Membaca file rekening koran...',
  validating:         'Memvalidasi data transaksi...',
  checking_overlap:   'Memeriksa duplikasi periode...',
  saving:             'Menyimpan data transaksi...',
  auto_matching:      'Mencocokkan otomatis dengan pembayaran...',
  completed:          'Selesai',
  failed:             'Gagal',
  needs_confirmation: 'Menunggu konfirmasi',
}

function phaseLabel(phase) {
  return PHASE_LABELS[phase] ?? 'Memproses...'
}

const headers = [
  { title: 'No',           key: 'no',          sortable: false, width: '50px' },
  { title: 'Tanggal Upload', key: 'created_at', sortable: false },
  { title: 'Nama File',    key: 'nama_file',   sortable: false },
  { title: 'Periode',      key: 'periode',     sortable: false },
  { title: 'Total Kredit', key: 'total_kredit', sortable: false, align: 'end' },
  { title: 'Status Cocok', key: 'status',      sortable: false },
  { title: 'Aksi',         key: 'aksi',        sortable: false, width: '90px' },
]

function selectReport(item) {
  selectedId.value = selectedId.value === item.id ? null : item.id
}

function onFileChange(e) {
  form.file = markRaw(e.target.files[0] ?? null)
}

function onDrop(e) {
  isDragging.value = false
  form.file = markRaw(e.dataTransfer.files[0] ?? null)
}

function closeDialog() {
  dialog.value      = false
  form.file         = null
  uploadError.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

async function doUpload() {
  uploadError.value = ''
  uploading.value   = true
  try {
    const fd = new FormData()

    fd.append('file', form.file)
    const res = await api.post('/finance/rekonsiliasi-bank/upload', fd)
    batchId.value = res.data?.data?.batch_id ?? null
    closeDialog()

    if (batchId.value) {
      openProgressDialog()
      poll()
    }
  } catch (err) {
    uploadError.value = err?.response?.data?.message ?? 'Upload gagal. Pastikan format file sesuai.'
  } finally {
    uploading.value = false
  }
}

function openProgressDialog() {
  batchStatus.value  = { status: 'queued', phase: 'queued' }
  progressDialog.value = true
}

function poll() {
  clearTimeout(pollTimer)
  pollTimer = setTimeout(async () => {
    try {
      const res  = await api.get(`/finance/rekonsiliasi-bank/imports/${batchId.value}/status`)
      const data = res.data?.data

      if (data) batchStatus.value = data

      if (data?.status === 'completed') {
        onImportCompleted(data)
        return
      }
      if (data?.status === 'needs_confirmation') {
        onImportNeedsConfirmation()
        return
      }
      if (data?.status === 'failed') {
        return // dialog progress tetap terbuka menampilkan message + errors
      }

      poll()
    } catch {
      batchStatus.value = { status: 'failed', phase: 'failed', message: 'Gagal memuat status import.' }
    }
  }, 2500)
}

function onImportCompleted(data) {
  progressDialog.value = false
  batchId.value = null
  reset()
  if (data.bank_statement_id) selectedId.value = data.bank_statement_id
}

function onImportNeedsConfirmation() {
  progressDialog.value = false
  overlapDialog.value  = true
}

async function confirmReplace() {
  confirming.value = true
  try {
    await api.post(`/finance/rekonsiliasi-bank/imports/${batchId.value}/confirm-replace`)
    overlapDialog.value = false
    openProgressDialog()
    poll()
  } catch (err) {
    overlapDialog.value = false
    batchStatus.value = {
      status: 'failed', phase: 'failed',
      message: err?.response?.data?.message ?? 'Gagal melanjutkan import.',
    }
    progressDialog.value = true
  } finally {
    confirming.value = false
  }
}

function closeProgressDialog() {
  progressDialog.value = false
  batchId.value = null
}

async function doDownloadTemplate() {
  const c = (value, opts = {}) => ({ value, fontFamily: 'Calibri', fontSize: 10, alignVertical: 'middle', ...opts })
  const bd = { borderStyle: 'thin', borderColor: '#B8CCE4' }

  // ── Sheet 1: Template ─────────────────────────────────────────────────
  const templateSheet = {
    sheet: 'Template',
    columns: [
      { width: 14 },
      { width: 42 },
      { width: 22 },
      { width: 16 },
      { width: 16 },
      { width: 16 },
    ],
    data: [
      // Baris 1 — Judul (navy gelap, teks putih)
      [c('TEMPLATE REKENING KORAN — Sistem IRON', {
        span: 6, fontWeight: 'bold', fontSize: 14, height: 32,
        color: '#FFFFFF', backgroundColor: '#1F3864', align: 'left',
      })],

      // Baris 2 — Sub-info (biru medium, teks putih)
      [c('Isi data mulai baris ke-4  ·  Format Tanggal: DDMMYYYY  ·  Angka tanpa titik, koma, atau simbol Rp', {
        span: 6, fontStyle: 'italic', fontSize: 9, height: 16,
        color: '#DDEEFF', backgroundColor: '#2E75B6', align: 'left',
      })],

      // Baris 3 — Header kolom (biru medium-gelap, teks putih)
      [
        c('Tanggal',      { fontWeight: 'bold', color: '#FFFFFF', backgroundColor: '#2F5496', align: 'center', height: 22, ...bd }),
        c('Keterangan',   { fontWeight: 'bold', color: '#FFFFFF', backgroundColor: '#2F5496', align: 'left',   height: 22, ...bd }),
        c('No Referensi', { fontWeight: 'bold', color: '#FFFFFF', backgroundColor: '#2F5496', align: 'left',   height: 22, ...bd }),
        c('Debit',        { fontWeight: 'bold', color: '#FFFFFF', backgroundColor: '#2F5496', align: 'right',  height: 22, ...bd }),
        c('Kredit',       { fontWeight: 'bold', color: '#FFFFFF', backgroundColor: '#2F5496', align: 'right',  height: 22, ...bd }),
        c('Saldo',        { fontWeight: 'bold', color: '#FFFFFF', backgroundColor: '#2F5496', align: 'right',  height: 22, ...bd }),
      ],

      // Baris 4 — Contoh data (biru sangat muda, teks abu gelap)
      [
        c('01012025',                            { backgroundColor: '#DEEAF1', align: 'center', color: '#404040', fontStyle: 'italic', height: 18, ...bd }),
        c('Contoh: Transfer Pembayaran Invoice', { backgroundColor: '#DEEAF1', align: 'left',   color: '#404040', fontStyle: 'italic', height: 18, ...bd }),
        c('TRF202501010001',                     { backgroundColor: '#DEEAF1', align: 'left',   color: '#404040', fontStyle: 'italic', height: 18, ...bd }),
        c(null,                                  { backgroundColor: '#DEEAF1', align: 'right',  color: '#404040', fontStyle: 'italic', height: 18, ...bd }),
        c('5000000',                             { backgroundColor: '#DEEAF1', align: 'right',  color: '#404040', fontStyle: 'italic', height: 18, ...bd }),
        c('25000000',                            { backgroundColor: '#DEEAF1', align: 'right',  color: '#404040', fontStyle: 'italic', height: 18, ...bd }),
      ],
    ],
  }

  // ── Sheet 2: Petunjuk ──────────────────────────────────────────────────
  const pb  = { borderStyle: 'thin', borderColor: '#B8CCE4' }
  const row = (value, opts = {}) => c(value, { align: 'left', height: 18, ...opts })

  const kolomData = [
    ['Tanggal',      'DDMMYYYY (teks)',  'Tanggal transaksi — tulis 8 digit sebagai teks',                '01012025'],
    ['Keterangan',   'Teks bebas',      'Deskripsi transaksi sesuai rekening koran',                     'TRANSFER MASUK - INV-2025-001'],
    ['No Referensi', 'Teks (opsional)', 'No. referensi bank — dipakai sistem untuk auto-matching',       'TRF202501010001'],
    ['Debit',        'Angka bulat',     'Uang keluar (tanpa titik/koma). Biarkan kosong jika tidak ada', '1500000'],
    ['Kredit',       'Angka bulat',     'Uang masuk (tanpa titik/koma). Biarkan kosong jika tidak ada', '5000000'],
    ['Saldo',        'Angka bulat',     'Saldo rekening setelah transaksi (tanpa titik/koma)',            '25000000'],
  ]

  const aturanData = [
    ['1.', 'Jangan hapus atau mengubah baris 1 (judul), baris 2 (info), dan baris 3 (header kolom).'],
    ['2.', 'Isi data transaksi mulai dari BARIS KE-4.'],
    ['3.', 'Format tanggal wajib DDMMYYYY — contoh: 01012025 untuk tanggal 1 Januari 2025.'],
    ['4.', 'Angka (Debit, Kredit, Saldo) diisi bilangan bulat TANPA titik ribuan, koma, atau simbol Rp.'],
    ['5.', 'Tiap baris hanya boleh memiliki salah satu: Debit ATAU Kredit yang terisi (tidak keduanya).'],
    ['6.', 'Kolom No Referensi opsional, namun jika diisi akan digunakan untuk pencocokan otomatis.'],
    ['7.', 'Simpan file dalam format .xlsx atau .xls sebelum diupload ke sistem.'],
  ]

  const petunjukSheet = {
    sheet: 'Petunjuk',
    columns: [{ width: 18 }, { width: 18 }, { width: 52 }, { width: 22 }],
    data: [
      // Judul (navy gelap, teks putih)
      [row('PETUNJUK PENGISIAN REKENING KORAN', {
        span: 4, fontWeight: 'bold', fontSize: 14, height: 32,
        color: '#FFFFFF', backgroundColor: '#1F3864',
      })],

      // Sub-judul (biru medium, italic putih)
      [row('Template Rekening Koran — Sistem IRON', {
        span: 4, fontStyle: 'italic', fontSize: 9, height: 16,
        color: '#DDEEFF', backgroundColor: '#2E75B6',
      })],

      // Spasi
      [row('', { span: 4, height: 8, backgroundColor: '#EBF3FB' })],

      // Section: Penjelasan Kolom (biru medium-gelap, teks putih)
      [row('PENJELASAN KOLOM', {
        span: 4, fontWeight: 'bold', fontSize: 11, height: 22,
        color: '#FFFFFF', backgroundColor: '#2F5496',
      })],

      // Header tabel (biru agak terang, teks putih)
      [
        row('Kolom',        { fontWeight: 'bold', color: '#FFFFFF', backgroundColor: '#4472C4', ...pb }),
        row('Format',       { fontWeight: 'bold', color: '#FFFFFF', backgroundColor: '#4472C4', ...pb }),
        row('Keterangan',   { fontWeight: 'bold', color: '#FFFFFF', backgroundColor: '#4472C4', ...pb }),
        row('Contoh Nilai', { fontWeight: 'bold', color: '#FFFFFF', backgroundColor: '#4472C4', ...pb }),
      ],

      // Baris kolom — zebra biru sangat muda & putih
      ...kolomData.map((cols, i) => cols.map(v =>
        row(v, { backgroundColor: i % 2 === 0 ? '#DEEAF1' : '#FFFFFF', color: '#212121', ...pb }),
      )),

      // Spasi
      [row('', { span: 4, height: 10 })],

      // Section: Aturan Penting (biru medium-gelap, teks putih)
      [row('ATURAN PENTING', {
        span: 4, fontWeight: 'bold', fontSize: 11, height: 22,
        color: '#FFFFFF', backgroundColor: '#2F5496',
      })],

      // Baris aturan — zebra biru sangat muda & putih
      ...aturanData.map(([no, teks], i) => [
        row(no,   { fontWeight: 'bold', color: '#1F3864', backgroundColor: i % 2 === 0 ? '#DEEAF1' : '#FFFFFF', ...pb }),
        row(teks, { span: 3,            color: '#212121', backgroundColor: i % 2 === 0 ? '#DEEAF1' : '#FFFFFF', ...pb }),
      ]),
    ],
  }

  await writeXlsxFile([templateSheet, petunjukSheet]).toFile('template-rekening-koran.xlsx')
}

function confirmDelete(item) {
  deleteTarget.value = item
  deleteDialog.value = true
}

async function doDelete() {
  deleting.value = true
  try {
    await api.delete(`/finance/rekonsiliasi-bank/${deleteTarget.value.id}`)
    if (selectedId.value === deleteTarget.value.id) selectedId.value = null
    deleteDialog.value = false
    reset()
  } finally {
    deleting.value = false
  }
}

onMounted(reset)
onBeforeUnmount(() => {
  clearTimeout(pollTimer)
  abort()
})
</script>

<style scoped>
.dropzone {
  border: 2px dashed rgba(var(--v-theme-primary), 0.4);
  border-radius: 8px;
  padding: 28px 16px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: border-color 0.2s, background 0.2s;
}
.dropzone:hover,
.dropzone--active {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.05);
}
</style>
