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
            <li>Upload <strong>1 file Excel</strong> dengan <strong>4 sheet</strong>: <strong>MASTER DATA</strong> (Investor + Resto + Client AR), <strong>MASTER BARANG</strong> (Produk/Barang), <strong>MASTER INVOICE</strong> (Invoice B2B &amp; B2C), dan <strong>Petunjuk Pengisian</strong>.</li>
            <li>Urutan import: MASTER DATA → MASTER BARANG → MASTER INVOICE. Invoice dapat langsung menggunakan data master yang baru diimport.</li>
            <li>Sheet <strong>MASTER DATA</strong>: 1 baris = 1 outlet. Field Client AR: <strong>pic_ar</strong> (PIC AR) wajib jika <code>tipe_klien</code> diisi. Kolom <strong>nama_entitas wajib</strong> jika <code>tipe_klien = PT</code>.</li>
            <li>Sheet <strong>MASTER BARANG</strong>: <strong>kode_barang wajib</strong> untuk setiap baris (identitas unik barang, boleh nama sama untuk barang berbeda). Kolom: kode_barang, nama_barang, spesifikasi, keterangan, status.</li>
            <li>Sheet <strong>MASTER INVOICE</strong>: 1 baris = 1 item. Baris dengan <code>tipe_invoice + nama_klien + tanggal_invoice</code> sama digabung jadi 1 invoice. <code>tipe_invoice</code>: <strong>B2C</strong> atau <strong>B2B</strong>. Invoice LUNAS atau periode terkunci → dilewati otomatis.</li>
            <li>Link share PDF invoice (<strong>signed URL</strong>, berlaku 30 hari) langsung tersedia begitu invoice disimpan — <strong>tidak ada lagi proses antrian</strong>, PDF digenerate on-demand saat link dibuka.</li>
            <li>Import hanya dapat dilakukan oleh role <strong>ADMIN, MANAGER, atau SUPERVISOR</strong>.</li>
            <li>Download template Excel terlebih dahulu untuk mendapatkan format yang benar.</li>
          </ul>
        </VAlert>

        <!-- Banner riwayat import terakhir -->
        <div class="mb-4">
          <VAlert
            v-if="latestImport"
            type="success"
            variant="tonal"
            density="compact"
            :icon="false"
          >
            <div class="d-flex align-center ga-2 flex-wrap">
              <VIcon
                icon="ri-history-line"
                size="16"
                color="success"
              />
              <span class="text-body-2">
                <strong>Terakhir diimport:</strong>
                {{ formatDateTime(latestImport.imported_at) }}
                <span class="text-medium-emphasis">oleh</span>
                <strong>{{ latestImport.imported_by ?? '—' }}</strong>
              </span>
            </div>
          </VAlert>
          <VAlert
            v-else-if="!loadingLatest"
            type="warning"
            variant="tonal"
            density="compact"
            :icon="false"
          >
            <div class="d-flex align-center ga-2">
              <VIcon
                icon="ri-information-line"
                size="16"
                color="warning"
              />
              <span class="text-body-2">Belum ada riwayat import — upload file pertama Anda untuk memulai.</span>
            </div>
          </VAlert>
        </div>

        <!-- Summary Cards -->
        <VRow class="mt-1">
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
              height="100%"
            >
              <VCardText class="pa-4">
                <div class="d-flex align-center ga-3 mb-3">
                  <VIcon
                    :icon="card.icon"
                    size="28"
                  />
                  <div>
                    <div class="text-subtitle-2 font-weight-medium">
                      {{ card.label }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ card.hint }}
                    </div>
                  </div>
                </div>

                <!-- Stats dari import terakhir -->
                <VDivider class="mb-2" />
                <div
                  v-if="loadingLatest"
                  class="text-caption text-medium-emphasis"
                >
                  <VProgressCircular
                    size="12"
                    width="2"
                    indeterminate
                    class="me-1"
                  />
                  Memuat…
                </div>
                <div
                  v-else-if="latestImport"
                  class="d-flex ga-2 flex-wrap"
                >
                  <VChip
                    size="x-small"
                    color="success"
                    variant="tonal"
                    prepend-icon="ri-add-line"
                  >
                    {{ latestImport[card.insKey] ?? 0 }} ditambah
                  </VChip>
                  <VChip
                    size="x-small"
                    color="warning"
                    variant="tonal"
                    prepend-icon="ri-refresh-line"
                  >
                    {{ latestImport[card.updKey] ?? 0 }} diperbarui
                  </VChip>
                  <VChip
                    v-if="card.skipKey && (latestImport[card.skipKey] ?? 0) > 0"
                    size="x-small"
                    color="secondary"
                    variant="tonal"
                    prepend-icon="ri-forbid-line"
                  >
                    {{ latestImport[card.skipKey] }} dilewati
                  </VChip>
                  <VChip
                    v-if="(latestImport[card.failKey] ?? 0) > 0"
                    size="x-small"
                    color="error"
                    variant="tonal"
                    prepend-icon="ri-close-line"
                  >
                    {{ latestImport[card.failKey] }} gagal
                  </VChip>
                </div>
                <div
                  v-else
                  class="text-caption text-medium-emphasis"
                >
                  Belum ada data import
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
      max-width="640"
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
              :disabled="importing"
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
              <li>File harus berformat <strong>.xlsx</strong> dengan <strong>4 sheet</strong>: <strong>MASTER DATA</strong>, <strong>MASTER BARANG</strong>, <strong>MASTER INVOICE</strong>, dan <strong>Petunjuk Pengisian</strong>.</li>
              <li>Sheet <strong>MASTER DATA</strong>: 1 baris = Investor + Resto + Client AR. Kolom <strong>tipe_klien</strong> (PT/RESTO) &amp; <strong>pic_ar</strong> wajib untuk membuat Client AR.</li>
              <li>Sheet <strong>MASTER BARANG</strong>: kode_barang, nama_barang, spesifikasi, keterangan, status. <strong>kode_barang wajib</strong> di setiap baris (identitas unik barang).</li>
              <li>Sheet <strong>MASTER INVOICE</strong>: 1 baris = 1 item. Baris dengan <code>tipe_invoice + nama_klien + tanggal_invoice</code> sama digabung jadi 1 invoice. Kolom no_invoice_resto/kode_resto/nama_resto wajib untuk B2B, opsional untuk B2C (referensi nomor asli).</li>
              <li>Setelah invoice disimpan, link share PDF (<strong>signed URL</strong>, berlaku 30 hari) langsung tersedia — PDF digenerate on-demand, tanpa proses antrian.</li>
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
                    v-if="importProgress.klien_skipped > 0"
                    class="text-medium-emphasis"
                  >⊘{{ importProgress.klien_skipped }} dilewati</span>
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
                  v-if="importProgress.barang_skipped > 0"
                  class="text-medium-emphasis"
                >⊘{{ importProgress.barang_skipped }} dilewati</span>
                <span
                  v-if="importProgress.barang_failed > 0"
                  class="text-error"
                >✗{{ importProgress.barang_failed }}</span>
              </div>
            </div>

            <!-- Sheet MASTER INVOICE progress -->
            <div
              v-if="importProgress.invoice_total > 0 || (importProgress.barang_processed >= importProgress.barang_total && importProgress.barang_total > 0)"
              class="mt-4"
            >
              <div class="text-subtitle-2 mb-2 d-flex align-center ga-1">
                <VIcon
                  icon="ri-file-list-3-line"
                  size="16"
                />
                Sheet MASTER INVOICE
                <span class="text-caption text-medium-emphasis ms-auto">
                  {{ importProgress.invoice_processed }} / {{ importProgress.invoice_total }} invoice
                </span>
              </div>
              <VProgressLinear
                :model-value="importProgress.invoice_total > 0 ? (importProgress.invoice_processed / importProgress.invoice_total) * 100 : 0"
                :indeterminate="importProgress.status === 'processing' && importProgress.invoice_total === 0"
                color="purple"
                height="6"
                rounded
                class="mb-2"
              />
              <div class="d-flex flex-wrap ga-3 text-caption">
                <span>
                  <VIcon
                    icon="ri-file-list-3-line"
                    size="14"
                    color="purple"
                  />
                  Invoice: <strong>+{{ importProgress.invoice_inserted }}</strong>
                  ~{{ importProgress.invoice_updated }}
                  <span
                    v-if="importProgress.invoice_skipped > 0"
                    class="text-medium-emphasis"
                  >⊘{{ importProgress.invoice_skipped }} dilewati</span>
                  <span
                    v-if="importProgress.invoice_failed > 0"
                    class="text-error"
                  >✗{{ importProgress.invoice_failed }}</span>
                </span>
              </div>
            </div>
          </div>

          <!-- ── Hasil setelah selesai ─────────────────────────── -->
          <div
            v-if="importResult"
            class="mt-5"
          >
            <!-- Header sukses / gagal -->
            <div class="d-flex flex-column align-center text-center mb-4">
              <VIcon
                :icon="importResult.status === 'completed' ? 'ri-checkbox-circle-fill' : 'ri-close-circle-fill'"
                :color="importResult.status === 'completed' ? 'success' : 'error'"
                size="52"
                class="mb-2"
              />
              <div class="text-h6 font-weight-bold">
                {{ importResult.status === 'completed' ? 'Import Berhasil!' : 'Import Gagal' }}
              </div>
              <div
                v-if="importResult.status === 'completed'"
                class="text-caption text-medium-emphasis mt-1"
              >
                Selesai pada: {{ formatDateTime(new Date().toISOString()) }}
              </div>
              <div
                v-else
                class="text-body-2 text-error mt-1"
              >
                {{ importResult.message }}
              </div>
            </div>

            <!-- Ringkasan per entitas (hanya jika completed) -->
            <template v-if="importResult.status === 'completed'">
              <VDivider class="mb-4" />
              <VRow dense>
                <VCol
                  v-for="stat in resultStats"
                  :key="stat.label"
                  cols="6"
                >
                  <VCard
                    variant="tonal"
                    :color="stat.color"
                    rounded="lg"
                  >
                    <VCardText class="pa-3">
                      <div class="d-flex align-center ga-2 mb-2">
                        <VIcon
                          :icon="stat.icon"
                          size="18"
                          :color="stat.color"
                        />
                        <span class="text-subtitle-2 font-weight-medium">{{ stat.label }}</span>
                      </div>
                      <div class="d-flex flex-wrap ga-1">
                        <VChip
                          size="x-small"
                          color="success"
                          variant="flat"
                        >
                          +{{ stat.inserted }} ditambah
                        </VChip>
                        <VChip
                          size="x-small"
                          color="warning"
                          variant="flat"
                        >
                          ~{{ stat.updated }} diperbarui
                        </VChip>
                        <VChip
                          v-if="stat.skipped > 0"
                          size="x-small"
                          color="secondary"
                          variant="flat"
                        >
                          ⊘{{ stat.skipped }} dilewati
                        </VChip>
                        <VChip
                          v-if="stat.failed > 0"
                          size="x-small"
                          color="error"
                          variant="flat"
                        >
                          ✗{{ stat.failed }} gagal
                        </VChip>
                      </div>
                    </VCardText>
                  </VCard>
                </VCol>
              </VRow>
            </template>

            <!-- Error table -->
            <div
              v-if="importResult.errors && importResult.errors.length > 0"
              class="mt-4"
            >
              <div class="text-subtitle-2 mb-2 text-error d-flex align-center ga-1">
                <VIcon
                  icon="ri-error-warning-line"
                  size="16"
                  color="error"
                />
                {{ importResult.errors.length }} baris gagal diproses:
              </div>
              <VTable
                density="compact"
                fixed-header
                height="180"
              >
                <thead>
                  <tr>
                    <th>Sheet</th>
                    <th>Baris</th>
                    <th>Pesan Error</th>
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

  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import api from '@/utils/axios'
import { useMasterDataImportStore, WIDGET_ID } from '@/stores/master-data-import.store'
import { useMinimizeWidgetStore } from '@/stores/minimize-widget.store'

const importStore   = useMasterDataImportStore()
const minimizeStore = useMinimizeWidgetStore()
const { importing, progress: importProgress, result: importResult } = storeToRefs(importStore)

const showImport          = ref(false)
const importFile          = ref(null)
const downloadingTemplate = ref(false)
const latestImport        = ref(null)
const loadingLatest       = ref(true)

const summaryCards = [
  {
    label:   'Investor',
    hint:    'Upsert by nama+cabang',
    icon:    'ri-money-dollar-circle-line',
    color:   'primary',
    insKey:  'investor_inserted',
    updKey:  'investor_updated',
    failKey: 'investor_failed',
  },
  {
    label:   'Resto',
    hint:    'Upsert by nama_cabang',
    icon:    'ri-store-2-line',
    color:   'success',
    insKey:  'resto_inserted',
    updKey:  'resto_updated',
    failKey: 'resto_failed',
  },
  {
    label:   'Client AR',
    hint:    'Upsert by entitas (PT) / resto (RESTO)',
    icon:    'ri-building-4-line',
    color:   'warning',
    insKey:  'klien_inserted',
    updKey:  'klien_updated',
    failKey: 'klien_failed',
    skipKey: 'klien_skipped',
  },
  {
    label:   'Barang',
    hint:    'Upsert by kode_barang',
    icon:    'ri-box-3-line',
    color:   'info',
    insKey:  'barang_inserted',
    updKey:  'barang_updated',
    failKey: 'barang_failed',
    skipKey: 'barang_skipped',
  },
]

const resultStats = computed(() => {
  if (!importResult.value) return []
  const r = importResult.value

  return [
    { label: 'Investor',  icon: 'ri-money-dollar-circle-line', color: 'primary', inserted: r.investor_inserted ?? 0, updated: r.investor_updated ?? 0, skipped: 0,                    failed: r.investor_failed ?? 0 },
    { label: 'Resto',     icon: 'ri-store-2-line',             color: 'success', inserted: r.resto_inserted ?? 0,    updated: r.resto_updated ?? 0,    skipped: 0,                    failed: r.resto_failed ?? 0 },
    { label: 'Client AR', icon: 'ri-building-4-line',          color: 'warning', inserted: r.klien_inserted ?? 0,    updated: r.klien_updated ?? 0,    skipped: r.klien_skipped ?? 0,   failed: r.klien_failed ?? 0 },
    { label: 'Barang',    icon: 'ri-box-3-line',               color: 'info',    inserted: r.barang_inserted ?? 0,   updated: r.barang_updated ?? 0,   skipped: r.barang_skipped ?? 0,  failed: r.barang_failed ?? 0 },
    { label: 'Invoice',   icon: 'ri-file-list-3-line',         color: 'purple',  inserted: r.invoice_inserted ?? 0,  updated: r.invoice_updated ?? 0,  skipped: r.invoice_skipped ?? 0, failed: r.invoice_failed ?? 0 },
  ]
})

function formatDateTime(isoString) {
  if (!isoString) return '—'
  const d = new Date(isoString)

  return d.toLocaleString('id-ID', {
    day:    '2-digit',
    month:  'long',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  })
}

async function fetchLatestImport() {
  loadingLatest.value = true
  try {
    const res = await api.get('/master/master-data/import/latest')
    latestImport.value = res.data?.data ?? null
  } catch {
    latestImport.value = null
  } finally {
    loadingLatest.value = false
  }
}

function openImport() {
  minimizeStore.setMinimizedFalse(WIDGET_ID)

  if (importing.value) {
    showImport.value = true
    return
  }

  importFile.value = null
  importStore.reset()
  showImport.value = true
}

function minimizeImport() {
  minimizeStore.setMinimized(WIDGET_ID, true)
  showImport.value = false
}

function closeImport() {
  showImport.value = false
  minimizeStore.remove(WIDGET_ID)
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
  await importStore.startImport(importFile.value)
}

watch(importResult, val => {
  if (val?.status === 'completed') fetchLatestImport()
})

onMounted(() => {
  fetchLatestImport()

  const widget = minimizeStore.widgets[WIDGET_ID]
  if (widget?.pendingRestore) {
    minimizeStore.clearPendingRestore(WIDGET_ID)
    minimizeStore.setMinimizedFalse(WIDGET_ID)
    showImport.value = true
  }
})
</script>
