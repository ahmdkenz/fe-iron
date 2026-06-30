<template>
  <div>
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between pa-4 flex-wrap ga-2">
        <span class="text-h6">Import Master Data</span>
        <VBtn
          color="primary"
          prepend-icon="ri-upload-2-line"
          @click="openImport"
        >
          Import File
        </VBtn>
      </VCardTitle>
      <VDivider />

      <VCardText>
        <VAlert
          type="info"
          variant="tonal"
          class="mb-4"
        >
          <div class="mb-2 font-weight-medium">
            Tentang halaman ini:
          </div>
          <ul class="ps-4">
            <li>Upload <strong>1 file Excel</strong> dengan 2 sheet: <strong>MASTER DATA</strong> (Investor + Resto + Client AR) dan <strong>MASTER BARANG</strong> (Produk/Barang).</li>
            <li>Sheet <strong>MASTER DATA</strong>: 1 baris = 1 outlet (investor, resto, dan client AR sekaligus).</li>
            <li>Sheet <strong>MASTER BARANG</strong>: 1 baris = 1 produk/barang.</li>
            <li>Download template Excel terlebih dahulu untuk mendapatkan format yang benar.</li>
            <li>Import diproses di latar belakang — Anda bisa memantau progres secara real-time.</li>
          </ul>
        </VAlert>

        <VRow class="mt-2">
          <VCol
            v-for="card in summaryCards"
            :key="card.label"
            cols="12"
            sm="6"
            md="3"
          >
            <VCard
              variant="tonal"
              :color="card.color"
            >
              <VCardText class="d-flex align-center ga-3 pa-4">
                <VIcon
                  :icon="card.icon"
                  size="32"
                />
                <div>
                  <div class="text-caption text-medium-emphasis">
                    {{ card.label }}
                  </div>
                  <div class="text-h6">
                    {{ card.hint }}
                  </div>
                </div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- ── Import Dialog ─────────────────────────────────────────── -->
    <VDialog
      v-model="showImport"
      max-width="620"
      persistent
    >
      <VCard>
        <VCardTitle class="d-flex align-center justify-space-between pa-4">
          <span>Import Master Data</span>
          <div class="d-flex ga-1">
            <VBtn
              v-if="importing"
              icon
              size="small"
              variant="text"
              title="Minimize ke latar belakang"
              @click="minimizeImport"
            >
              <VIcon icon="ri-subtract-line" />
            </VBtn>
            <VBtn
              icon
              size="small"
              variant="text"
              @click="closeImport"
            >
              <VIcon icon="ri-close-line" />
            </VBtn>
          </div>
        </VCardTitle>
        <VDivider />

        <VCardText class="pt-4">
          <VAlert
            type="info"
            variant="tonal"
            class="mb-4"
          >
            <ul class="ps-4">
              <li>File harus berformat <strong>.xlsx</strong> dengan 2 sheet: <strong>MASTER DATA</strong> dan <strong>MASTER BARANG</strong>.</li>
              <li>Sheet <strong>MASTER DATA</strong>: 1 baris = Investor + Resto + Client AR.</li>
              <li>Kolom <strong>tipe_klien</strong> (PT/RESTO) wajib untuk membuat Client AR.</li>
              <li>Kolom <strong>pic_ar</strong> wajib jika tipe_klien diisi.</li>
              <li>Sheet <strong>MASTER BARANG</strong>: kode_barang wajib untuk produk baru.</li>
            </ul>
          </VAlert>

          <VBtn
            variant="outlined"
            color="primary"
            prepend-icon="ri-file-excel-line"
            class="mb-4"
            :loading="downloadingTemplate"
            @click="downloadTemplate"
          >
            Download Template Excel
          </VBtn>

          <VFileInput
            v-model="importFile"
            label="Pilih File (.xlsx)"
            accept=".xlsx,.xls"
            prepend-icon="ri-file-upload-line"
            variant="outlined"
            density="compact"
            :clearable="true"
            hide-details="auto"
            :disabled="importing"
            @update:model-value="importResult = null"
          />

          <!-- Progress saat import berjalan -->
          <div
            v-if="importing && importProgress"
            class="mt-5"
          >
            <!-- Sheet MASTER DATA progress -->
            <div
              v-if="importProgress.master_total > 0 || importProgress.status === 'processing'"
              class="mb-4"
            >
              <div class="text-subtitle-2 mb-2 d-flex align-center ga-1">
                <VIcon
                  icon="ri-store-2-line"
                  size="16"
                />
                Sheet MASTER DATA
                <span class="text-caption text-medium-emphasis ms-auto">
                  {{ importProgress.master_processed }} / {{ importProgress.master_total }} baris
                </span>
              </div>
              <VProgressLinear
                :model-value="importProgress.master_total > 0 ? (importProgress.master_processed / importProgress.master_total) * 100 : 0"
                :indeterminate="importProgress.status === 'queued' || importProgress.status === 'processing' && importProgress.master_total === 0"
                color="primary"
                height="6"
                rounded
                class="mb-2"
              />
              <div class="d-flex flex-wrap ga-3 text-caption">
                <span>
                  <VIcon
                    icon="ri-money-dollar-circle-line"
                    size="14"
                    color="primary"
                  />
                  Investor: <strong>+{{ importProgress.investor_inserted }}</strong>
                  ~{{ importProgress.investor_updated }}
                  <span
                    v-if="importProgress.investor_failed > 0"
                    class="text-error"
                  >✗{{ importProgress.investor_failed }}</span>
                </span>
                <span>
                  <VIcon
                    icon="ri-store-2-line"
                    size="14"
                    color="success"
                  />
                  Resto: <strong>+{{ importProgress.resto_inserted }}</strong>
                  ~{{ importProgress.resto_updated }}
                  <span
                    v-if="importProgress.resto_failed > 0"
                    class="text-error"
                  >✗{{ importProgress.resto_failed }}</span>
                </span>
                <span>
                  <VIcon
                    icon="ri-building-4-line"
                    size="14"
                    color="warning"
                  />
                  Client: <strong>+{{ importProgress.klien_inserted }}</strong>
                  ~{{ importProgress.klien_updated }}
                  <span
                    v-if="importProgress.klien_failed > 0"
                    class="text-error"
                  >✗{{ importProgress.klien_failed }}</span>
                </span>
              </div>
            </div>

            <!-- Sheet MASTER BARANG progress -->
            <div v-if="importProgress.barang_total > 0 || (importProgress.master_processed >= importProgress.master_total && importProgress.master_total > 0)">
              <div class="text-subtitle-2 mb-2 d-flex align-center ga-1">
                <VIcon
                  icon="ri-box-3-line"
                  size="16"
                />
                Sheet MASTER BARANG
                <span class="text-caption text-medium-emphasis ms-auto">
                  {{ importProgress.barang_processed }} / {{ importProgress.barang_total }} baris
                </span>
              </div>
              <VProgressLinear
                :model-value="importProgress.barang_total > 0 ? (importProgress.barang_processed / importProgress.barang_total) * 100 : 0"
                :indeterminate="importProgress.status === 'processing' && importProgress.barang_total === 0"
                color="success"
                height="6"
                rounded
                class="mb-2"
              />
              <div class="text-caption">
                <VIcon
                  icon="ri-box-3-line"
                  size="14"
                  color="success"
                />
                Barang: <strong>+{{ importProgress.barang_inserted }}</strong>
                ~{{ importProgress.barang_updated }}
                <span
                  v-if="importProgress.barang_failed > 0"
                  class="text-error"
                >✗{{ importProgress.barang_failed }}</span>
              </div>
            </div>
          </div>

          <!-- Hasil setelah selesai -->
          <div
            v-if="importResult"
            class="mt-4"
          >
            <VAlert
              :type="importResult.status === 'completed' ? 'success' : 'error'"
              variant="tonal"
              class="mb-3"
            >
              {{ importResult.message }}
            </VAlert>

            <!-- Ringkasan per entitas -->
            <VRow
              v-if="importResult.status === 'completed'"
              dense
              class="mb-3"
            >
              <VCol
                v-for="stat in resultStats"
                :key="stat.label"
                cols="6"
                sm="3"
              >
                <div class="text-caption text-medium-emphasis">
                  {{ stat.label }}
                </div>
                <div class="text-body-2">
                  <span class="text-success">+{{ stat.inserted }}</span>
                  &nbsp;
                  <span class="text-warning">~{{ stat.updated }}</span>
                  &nbsp;
                  <span
                    v-if="stat.failed > 0"
                    class="text-error"
                  >✗{{ stat.failed }}</span>
                </div>
              </VCol>
            </VRow>

            <!-- Error table -->
            <div v-if="importResult.errors && importResult.errors.length > 0">
              <div class="text-subtitle-2 mb-2 text-error">
                {{ importResult.errors.length }} baris gagal:
              </div>
              <VTable
                density="compact"
                fixed-header
                height="200"
              >
                <thead>
                  <tr>
                    <th>Sheet</th>
                    <th>Baris</th>
                    <th>Pesan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(err, i) in importResult.errors"
                    :key="i"
                  >
                    <td>{{ err.sheet || '-' }}</td>
                    <td>{{ err.row }}</td>
                    <td>{{ err.message }}</td>
                  </tr>
                </tbody>
              </VTable>
            </div>
          </div>
        </VCardText>

        <VDivider />
        <VCardActions class="pa-4 justify-end ga-2">
          <VBtn
            variant="outlined"
            :disabled="importing"
            @click="closeImport"
          >
            Tutup
          </VBtn>
          <VBtn
            color="primary"
            :loading="importing"
            :disabled="!importFile || importing"
            @click="doImport"
          >
            Import
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- ── Floating widget saat minimize ────────────────────────── -->
    <Teleport to="body">
      <VCard
        v-if="isImportMinimized"
        class="position-fixed"
        style="bottom: 24px; right: 24px; z-index: 9999; min-width: 300px;"
        elevation="8"
        rounded="lg"
      >
        <VCardText class="pa-3 d-flex align-center justify-space-between ga-2">
          <div class="d-flex align-center ga-2">
            <VProgressCircular
              :model-value="overallProgress"
              :indeterminate="overallProgress === 0 && importProgress?.status !== 'completed'"
              size="28"
              width="3"
              color="primary"
            />
            <div>
              <div class="text-caption font-weight-medium">
                Import Master Data
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ importProgress?.status === 'queued' ? 'Menunggu antrian…' : 'Memproses…' }}
              </div>
            </div>
          </div>
          <VBtn
            icon
            size="x-small"
            variant="text"
            title="Buka kembali"
            @click="maximizeImport"
          >
            <VIcon icon="ri-arrow-up-line" />
          </VBtn>
        </VCardText>
      </VCard>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import api from '@/utils/axios'

const showImport          = ref(false)
const importFile          = ref(null)
const importing           = ref(false)
const importResult        = ref(null)
const importProgress      = ref(null)
const isImportMinimized   = ref(false)
const downloadingTemplate = ref(false)
let importPollTimer       = null

const summaryCards = [
  { label: 'Investor',   hint: 'Upsert by nama+cabang',  icon: 'ri-money-dollar-circle-line', color: 'primary' },
  { label: 'Resto',      hint: 'Upsert by nama_cabang',  icon: 'ri-store-2-line',             color: 'success' },
  { label: 'Client AR',  hint: 'Upsert by nama+tipe',    icon: 'ri-building-4-line',          color: 'warning' },
  { label: 'Barang',     hint: 'Upsert by nama_barang',  icon: 'ri-box-3-line',               color: 'info'    },
]

const resultStats = computed(() => {
  if (!importResult.value) return []
  const r = importResult.value
  return [
    { label: 'Investor', inserted: r.investor_inserted ?? 0, updated: r.investor_updated ?? 0, failed: r.investor_failed ?? 0 },
    { label: 'Resto',    inserted: r.resto_inserted ?? 0,    updated: r.resto_updated ?? 0,    failed: r.resto_failed ?? 0 },
    { label: 'Client',   inserted: r.klien_inserted ?? 0,    updated: r.klien_updated ?? 0,    failed: r.klien_failed ?? 0 },
    { label: 'Barang',   inserted: r.barang_inserted ?? 0,   updated: r.barang_updated ?? 0,   failed: r.barang_failed ?? 0 },
  ]
})

const overallProgress = computed(() => {
  const p = importProgress.value
  if (!p) return 0
  const total     = (p.master_total ?? 0) + (p.barang_total ?? 0)
  const processed = (p.master_processed ?? 0) + (p.barang_processed ?? 0)
  return total > 0 ? Math.round((processed / total) * 100) : 0
})

function openImport() {
  importFile.value   = null
  importResult.value = null
  importProgress.value = null
  showImport.value   = true
}

function minimizeImport() {
  showImport.value      = false
  isImportMinimized.value = true
}

function maximizeImport() {
  isImportMinimized.value = false
  showImport.value        = true
}

function closeImport() {
  clearTimeout(importPollTimer)
  showImport.value        = false
  isImportMinimized.value = false
  importing.value         = false
}

async function downloadTemplate() {
  downloadingTemplate.value = true
  try {
    const res = await api.get('/master/master-data/import-template', { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([res.data]))
    const a   = document.createElement('a')
    a.href     = url
    a.download = 'template-import-master-data.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  } finally {
    downloadingTemplate.value = false
  }
}

async function doImport() {
  if (!importFile.value) return

  importing.value      = true
  importResult.value   = null
  importProgress.value = { status: 'queued', master_total: 0, master_processed: 0, barang_total: 0, barang_processed: 0, investor_inserted: 0, investor_updated: 0, investor_failed: 0, resto_inserted: 0, resto_updated: 0, resto_failed: 0, klien_inserted: 0, klien_updated: 0, klien_failed: 0, barang_inserted: 0, barang_updated: 0, barang_failed: 0 }

  try {
    const form = new FormData()
    form.append('file', importFile.value)
    const res   = await api.post('/master/master-data/import', form)
    const batchId = res.data?.data?.batch_id
    if (batchId) pollImportStatus(batchId)
  } catch (err) {
    importing.value    = false
    importResult.value = {
      status:  'failed',
      message: err.response?.data?.message ?? 'Gagal mengunggah file.',
      errors:  [],
    }
  }
}

function pollImportStatus(batchId) {
  importPollTimer = setTimeout(async () => {
    try {
      const res  = await api.get(`/master/master-data/import/${batchId}/status`)
      const data = res.data?.data

      if (data) importProgress.value = data

      if (data?.status === 'completed' || data?.status === 'failed') {
        importing.value    = false
        importResult.value = data
        isImportMinimized.value = false
        showImport.value        = true
        return
      }

      pollImportStatus(batchId)
    } catch {
      importing.value = false
    }
  }, 1500)
}
</script>
