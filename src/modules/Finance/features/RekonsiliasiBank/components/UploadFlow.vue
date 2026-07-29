<template>
  <div>
    <VBtn
      v-if="!xs"
      color="primary"
      prepend-icon="ri-upload-cloud-2-line"
      @click="dialog = true"
    >
      Upload Mutasi Bank
    </VBtn>
    <VBtn
      v-else
      icon
      color="primary"
      size="small"
      aria-label="Upload Mutasi Bank"
      @click="dialog = true"
    >
      <VIcon icon="ri-upload-cloud-2-line" />
      <VTooltip
        activator="parent"
        location="bottom"
      >
        Upload Mutasi Bank
      </VTooltip>
    </VBtn>

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
      :fullscreen="xs"
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
            <div class="import-stepper">
              <template
                v-for="(step, i) in PHASE_STEPS"
                :key="step.key"
              >
                <div
                  class="import-step"
                  :class="`import-step--${stepState(i)}`"
                >
                  <VIcon
                    v-if="stepState(i) === 'done'"
                    icon="ri-check-line"
                    size="16"
                  />
                  <VIcon
                    v-else
                    :icon="step.icon"
                    size="16"
                  />
                </div>
                <div
                  v-if="i < PHASE_STEPS.length - 1"
                  class="import-connector"
                  :class="{ 'import-connector--filled': stepState(i) === 'done' }"
                />
              </template>
            </div>

            <Transition
              name="import-fade"
              mode="out-in"
            >
              <div
                :key="batchStatus?.phase"
                class="text-center mt-5"
              >
                <div class="text-body-2 font-weight-medium">
                  {{ phaseLabel(batchStatus?.phase) }}
                </div>
                <div
                  v-if="batchStatus?.total_rows"
                  class="text-caption text-medium-emphasis mt-1"
                >
                  {{ batchStatus.processed_rows }} / {{ batchStatus.total_rows }} baris diproses
                </div>
              </div>
            </Transition>

            <VProgressLinear
              :model-value="progressPercent"
              :indeterminate="progressPercent === null"
              color="primary"
              height="6"
              rounded
              class="mt-4"
            />
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
      :fullscreen="xs"
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
            @click="cancelOverlap"
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
  </div>
</template>

<script setup>
import { computed, markRaw, onBeforeUnmount, reactive, ref } from 'vue'
import { useDisplay } from 'vuetify'
import api from '@/utils/axios'
import writeXlsxFile from 'write-excel-file/browser'

const emit = defineEmits(['imported'])

const { xs } = useDisplay()

const dialog      = ref(false)
const uploading   = ref(false)
const uploadError = ref('')
const isDragging  = ref(false)
const fileInput   = ref(null)

const form = reactive({ file: null })

// ── Progress import async (upload -> queue -> polling) ──────────────────
const progressDialog = ref(false)
const batchId         = ref(null)
const batchStatus     = ref(null)
let pollTimer = null

const overlapDialog = ref(false)
const confirming    = ref(false)

const PHASE_STEPS = [
  { key: 'queued',           icon: 'ri-time-line',            label: 'Menunggu diproses...' },
  { key: 'parsing',          icon: 'ri-file-search-line',     label: 'Membaca file rekening koran...' },
  { key: 'validating',       icon: 'ri-shield-check-line',    label: 'Memvalidasi data transaksi...' },
  { key: 'checking_overlap', icon: 'ri-git-compare-line',     label: 'Memeriksa duplikasi periode...' },
  { key: 'saving',           icon: 'ri-save-3-line',          label: 'Menyimpan data transaksi...' },
  { key: 'auto_matching',    icon: 'ri-link-m',               label: 'Mencocokkan otomatis dengan pembayaran...' },
  { key: 'completed',        icon: 'ri-checkbox-circle-line', label: 'Selesai' },
]

function phaseIndex(phase) {
  const i = PHASE_STEPS.findIndex(s => s.key === phase)

  return i === -1 ? 0 : i
}

function stepState(i) {
  const current = phaseIndex(batchStatus.value?.phase)
  if (i < current) return 'done'
  if (i === current) return 'active'

  return 'pending'
}

function phaseLabel(phase) {
  if (phase === 'needs_confirmation') return 'Menunggu konfirmasi...'
  if (phase === 'failed') return 'Gagal'

  return PHASE_STEPS.find(s => s.key === phase)?.label ?? 'Memproses...'
}

const progressPercent = computed(() => {
  const status = batchStatus.value
  if (!status) return null
  if (status.phase === 'parsing' && status.total_rows) {
    return Math.min(100, Math.round((status.processed_rows / status.total_rows) * 100))
  }
  const idx = phaseIndex(status.phase)

  return Math.round((idx / (PHASE_STEPS.length - 1)) * 100)
})

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
  emit('imported', data.bank_statement_id ?? null)
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

// Tanpa panggilan ini, file upload + staging rows batch yang menunggu
// konfirmasi overlap akan menggantung permanen di server (job hanya
// membersihkannya untuk status completed/failed, bukan needs_confirmation).
function cancelOverlap() {
  const id = batchId.value
  overlapDialog.value = false
  batchId.value = null
  if (id) {
    api.post(`/finance/rekonsiliasi-bank/imports/${id}/cancel`).catch(() => {})
  }
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
      [c('TEMPLATE REKENING KORAN — Sistem IRON', {
        span: 6, fontWeight: 'bold', fontSize: 14, height: 32,
        color: '#FFFFFF', backgroundColor: '#1F3864', align: 'left',
      })],
      [c('Isi data mulai baris ke-4  ·  Format Tanggal: DDMMYYYY  ·  Angka tanpa titik, koma, atau simbol Rp', {
        span: 6, fontStyle: 'italic', fontSize: 9, height: 16,
        color: '#DDEEFF', backgroundColor: '#2E75B6', align: 'left',
      })],
      [
        c('Tanggal',      { fontWeight: 'bold', color: '#FFFFFF', backgroundColor: '#2F5496', align: 'center', height: 22, ...bd }),
        c('Keterangan',   { fontWeight: 'bold', color: '#FFFFFF', backgroundColor: '#2F5496', align: 'left',   height: 22, ...bd }),
        c('No Referensi', { fontWeight: 'bold', color: '#FFFFFF', backgroundColor: '#2F5496', align: 'left',   height: 22, ...bd }),
        c('Debit',        { fontWeight: 'bold', color: '#FFFFFF', backgroundColor: '#2F5496', align: 'right',  height: 22, ...bd }),
        c('Kredit',       { fontWeight: 'bold', color: '#FFFFFF', backgroundColor: '#2F5496', align: 'right',  height: 22, ...bd }),
        c('Saldo',        { fontWeight: 'bold', color: '#FFFFFF', backgroundColor: '#2F5496', align: 'right',  height: 22, ...bd }),
      ],
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
      [row('PETUNJUK PENGISIAN REKENING KORAN', {
        span: 4, fontWeight: 'bold', fontSize: 14, height: 32,
        color: '#FFFFFF', backgroundColor: '#1F3864',
      })],
      [row('Template Rekening Koran — Sistem IRON', {
        span: 4, fontStyle: 'italic', fontSize: 9, height: 16,
        color: '#DDEEFF', backgroundColor: '#2E75B6',
      })],
      [row('', { span: 4, height: 8, backgroundColor: '#EBF3FB' })],
      [row('PENJELASAN KOLOM', {
        span: 4, fontWeight: 'bold', fontSize: 11, height: 22,
        color: '#FFFFFF', backgroundColor: '#2F5496',
      })],
      [
        row('Kolom',        { fontWeight: 'bold', color: '#FFFFFF', backgroundColor: '#4472C4', ...pb }),
        row('Format',       { fontWeight: 'bold', color: '#FFFFFF', backgroundColor: '#4472C4', ...pb }),
        row('Keterangan',   { fontWeight: 'bold', color: '#FFFFFF', backgroundColor: '#4472C4', ...pb }),
        row('Contoh Nilai', { fontWeight: 'bold', color: '#FFFFFF', backgroundColor: '#4472C4', ...pb }),
      ],
      ...kolomData.map((cols, i) => cols.map(v =>
        row(v, { backgroundColor: i % 2 === 0 ? '#DEEAF1' : '#FFFFFF', color: '#212121', ...pb }),
      )),
      [row('', { span: 4, height: 10 })],
      [row('ATURAN PENTING', {
        span: 4, fontWeight: 'bold', fontSize: 11, height: 22,
        color: '#FFFFFF', backgroundColor: '#2F5496',
      })],
      ...aturanData.map(([no, teks], i) => [
        row(no,   { fontWeight: 'bold', color: '#1F3864', backgroundColor: i % 2 === 0 ? '#DEEAF1' : '#FFFFFF', ...pb }),
        row(teks, { span: 3,            color: '#212121', backgroundColor: i % 2 === 0 ? '#DEEAF1' : '#FFFFFF', ...pb }),
      ]),
    ],
  }

  await writeXlsxFile([templateSheet, petunjukSheet]).toFile('template-rekening-koran.xlsx')
}

onBeforeUnmount(() => {
  clearTimeout(pollTimer)
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

.import-stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 0;
}
.import-step {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.4);
  transition: background-color 0.35s ease, color 0.35s ease, transform 0.35s ease;
}
.import-step--done {
  background: rgb(var(--v-theme-success));
  color: rgb(var(--v-theme-on-success));
}
.import-step--active {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  transform: scale(1.2);
  animation: import-pulse 1.6s ease-out infinite;
}
.import-connector {
  flex: 1 1 auto;
  min-width: 8px;
  height: 3px;
  margin: 0 2px;
  border-radius: 2px;
  background: rgba(var(--v-theme-on-surface), 0.08);
  transition: background-color 0.5s ease;
}
.import-connector--filled {
  background: rgb(var(--v-theme-success));
}

@keyframes import-pulse {
  0% { box-shadow: 0 0 0 0 rgba(var(--v-theme-primary), 0.45); }
  70% { box-shadow: 0 0 0 9px rgba(var(--v-theme-primary), 0); }
  100% { box-shadow: 0 0 0 0 rgba(var(--v-theme-primary), 0); }
}

.import-fade-enter-active,
.import-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.import-fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.import-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
