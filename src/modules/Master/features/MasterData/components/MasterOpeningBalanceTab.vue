<template>
  <div>
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between pa-4 flex-wrap ga-2">
        <span class="text-h6">Import Master Opening Balance</span>
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
        >
          <div class="d-flex align-center justify-space-between ga-2">
            <div class="font-weight-medium">
              Tentang tab ini:
            </div>
            <VBtn
              v-if="xs"
              variant="text"
              size="small"
              density="comfortable"
              color="info"
              @click="showInfo = !showInfo"
            >
              {{ showInfo ? 'Sembunyikan' : 'Lihat' }}
              <VIcon
                :icon="showInfo ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'"
                end
              />
            </VBtn>
          </div>
          <ul
            v-show="!xs || showInfo"
            class="ps-4 mt-2"
          >
            <li>Untuk mengisi <strong>saldo awal piutang klien</strong> secara massal — 1 baris = 1 invoice historis, baris dengan <strong>no_urut</strong> yang sama otomatis digabung jadi 1 Opening Balance (pola yang sama seperti Import Master Invoice).</li>
            <li>Identitas klien (nama_klien, kode_resto, tipe_klien) hanya wajib diisi di <strong>baris pertama</strong> tiap no_urut. tipe_klien: <strong>PT/B2B</strong> (saldo konsolidasi head office, tanpa resto spesifik) atau <strong>RESTO/B2C</strong> (saldo per outlet — <strong>kode_resto</strong> wajib diisi &amp; divalidasi ke MASTER DATA Resto).</li>
            <li><strong>Tanggal Saldo Awal (cutover)</strong> diisi 1x di form ini sebelum upload — berlaku untuk semua baris dalam file. Bukan tanggal invoice historisnya (itu tetap diisi per baris di kolom tanggal_invoice_asal).</li>
            <li>Item per invoice historis bersifat <strong>opsional</strong> — didukung oleh <strong>kedua template</strong> (XLSX maupun CSV).</li>
            <li>Gunakan <strong>Template CSV</strong> untuk volume data besar — mendukung baris jauh lebih banyak dari XLSX.</li>
            <li>Gunakan <strong>Template XLSX</strong> untuk volume kecil-menengah — item ditulis di sheet terpisah, lebih mudah dibaca manual di Excel.</li>
            <li>Baris/grup gagal tidak menggagalkan baris/grup lain — hasil akhir menampilkan rincian baris mana yang gagal dan alasannya.</li>
            <li>Semua Opening Balance hasil import langsung berstatus <strong>APPROVED</strong> — tidak perlu persetujuan manual, karena import hanya dapat dilakukan oleh role tepercaya.</li>
            <li>Import hanya dapat dilakukan oleh role <strong>ADMIN, MANAGER, atau SUPERVISOR</strong>.</li>
          </ul>
        </VAlert>
      </VCardText>
    </VCard>

    <!-- ── Import Dialog ─────────────────────────────────────────── -->
    <VDialog
      v-model="showImport"
      max-width="640"
      :fullscreen="xs"
      persistent
    >
      <VCard>
        <VCardTitle class="d-flex align-center justify-space-between pa-4">
          <span>Import Master Opening Balance</span>
          <div class="d-flex ga-1">
            <VBtn
              v-if="importing && !xs"
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
            type="warning"
            variant="tonal"
            class="mb-4"
          >
            <ul class="ps-4">
              <li>
                Hanya untuk saldo piutang historis yang berasal dari luar sistem. Jika invoice sudah pernah diinput
                di sistem ini, sisa tagihannya sudah otomatis terbawa — tidak perlu Opening Balance.
              </li>
              <li>
                1 baris = 1 invoice historis. Baris dengan <strong>no_urut</strong> yang sama otomatis digabung jadi
                1 Opening Balance (pola sama seperti Import Master Invoice) — identitas klien hanya wajib di baris
                pertama tiap no_urut. Item per invoice bersifat <strong>opsional</strong>.
              </li>
              <li>
                Gunakan <strong>CSV</strong> untuk volume data besar (kolom <code>tipe_baris</code>: OB/ITEM). Gunakan
                <strong>XLSX</strong> untuk volume kecil-menengah — item ditulis di sheet terpisah, kapasitas
                realistis lebih kecil dari CSV.
              </li>
              <li>
                Isi <strong>tipe_klien</strong>: <code>PT</code> atau <code>B2B</code> (sinonim, kode_resto WAJIB
                DIKOSONGKAN, resolve via nama_klien — harus unik/tidak kembar) atau <code>RESTO</code> atau
                <code>B2C</code> (sinonim, <strong>kode_resto</strong> WAJIB diisi, harus sudah terdaftar di Master Resto
                &amp; punya Client AR aktif tipe RESTO — tidak ada pembuatan otomatis).
              </li>
              <li>
                <strong>Tanggal Saldo Awal (cutover)</strong> di bawah berlaku untuk SEMUA baris di file ini — bukan
                tanggal invoice historisnya masing-masing (itu tetap diisi per baris di file).
              </li>
              <li>
                <strong>Template versi lama (sheet Rincian Invoice Asal terpisah) tidak lagi didukung</strong> —
                download ulang Template XLSX/CSV sebelum import berikutnya.
              </li>
            </ul>
          </VAlert>

          <div class="d-flex flex-wrap ga-2 mb-4">
            <VBtn
              variant="outlined"
              color="primary"
              prepend-icon="ri-file-excel-line"
              :loading="downloadingTemplate.xlsx"
              @click="downloadTemplate('xlsx')"
            >
              Template XLSX
            </VBtn>
            <VBtn
              variant="outlined"
              color="primary"
              prepend-icon="ri-file-text-line"
              :loading="downloadingTemplate.csv"
              @click="downloadTemplate('csv')"
            >
              Template CSV
            </VBtn>
          </div>

          <VTextField
            v-model="cutoverDate"
            label="Tanggal Opening Balance dibuat (Cutover)"
            type="date"
            variant="outlined"
            density="compact"
            hint="Berlaku untuk semua Opening Balance yang dihasilkan dari file ini — bukan tanggal invoice historisnya masing-masing."
            persistent-hint
            :disabled="importing"
            class="mb-4"
          />

          <VFileInput
            v-model="importFile"
            label="Pilih File (.xlsx atau .csv)"
            accept=".xlsx,.xls,.csv,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            prepend-icon="ri-file-upload-line"
            variant="outlined"
            density="compact"
            clearable
            hide-details="auto"
            :disabled="importing"
            @update:model-value="importStore.result = null"
          />

          <!-- Progress saat import berjalan -->
          <div
            v-if="importing && importProgress"
            class="mt-5"
          >
            <div
              v-if="elapsedLabel"
              class="text-caption text-medium-emphasis mb-3 d-flex align-center ga-1"
            >
              <VIcon
                icon="ri-time-line"
                size="14"
              />
              {{ elapsedLabel }}
              <span v-if="etaLabel"> · {{ etaLabel }}</span>
            </div>

            <div class="text-subtitle-2 mb-2 d-flex align-center ga-1">
              <VIcon
                icon="ri-wallet-3-line"
                size="16"
              />
              Opening Balance
              <span class="text-caption text-medium-emphasis ms-auto">
                {{ importProgress.processed_ob }} / {{ importProgress.total_ob }} baris
              </span>
            </div>
            <VProgressLinear
              :model-value="importProgress.total_ob > 0 ? (importProgress.processed_ob / importProgress.total_ob) * 100 : 0"
              :indeterminate="importProgress.status === 'queued' || (importProgress.status === 'processing' && importProgress.total_ob === 0)"
              color="primary"
              height="6"
              rounded
              class="mb-2"
            />
            <div class="d-flex flex-wrap ga-3 text-caption">
              <span>
                <VIcon
                  icon="ri-wallet-3-line"
                  size="14"
                  color="primary"
                />
                Opening Balance: <strong>+{{ importProgress.inserted_ob }}</strong>
                <span
                  v-if="importProgress.skipped_ob > 0"
                  class="text-medium-emphasis"
                >⊘{{ importProgress.skipped_ob }} dilewati</span>
                <span
                  v-if="importProgress.failed_ob > 0"
                  class="text-error"
                >✗{{ importProgress.failed_ob }}</span>
              </span>
              <span v-if="importProgress.inserted_detail > 0">
                <VIcon
                  icon="ri-file-list-3-line"
                  size="14"
                  color="secondary"
                />
                Rincian Invoice Asal: <strong>+{{ importProgress.inserted_detail }}</strong>
              </span>
              <span v-if="importProgress.inserted_item > 0">
                <VIcon
                  icon="ri-box-3-line"
                  size="14"
                  color="info"
                />
                Item: <strong>+{{ importProgress.inserted_item }}</strong>
              </span>
            </div>
          </div>

          <!-- ── Hasil setelah selesai ─────────────────────────── -->
          <div
            v-if="importResult"
            class="mt-5"
          >
            <div class="d-flex flex-column align-center text-center mb-4">
              <VIcon
                :icon="importResult.status === 'completed' ? 'ri-checkbox-circle-fill' : 'ri-close-circle-fill'"
                :color="importResult.status === 'completed' ? 'success' : 'error'"
                size="52"
                class="mb-2"
              />
              <div class="text-h6 font-weight-bold">
                {{ importResult.status === 'completed' ? 'Import Selesai' : 'Import Gagal' }}
              </div>
              <div
                v-if="importResult.status !== 'completed'"
                class="text-body-2 text-error mt-1"
              >
                {{ importResult.message }}
              </div>
            </div>

            <template v-if="importResult.status === 'completed'">
              <VDivider class="mb-4" />
              <VRow dense>
                <VCol cols="12">
                  <VCard
                    variant="tonal"
                    color="primary"
                    rounded="lg"
                  >
                    <VCardText class="pa-3">
                      <div class="d-flex align-center ga-2 mb-2">
                        <VIcon
                          icon="ri-wallet-3-line"
                          size="18"
                          color="primary"
                        />
                        <span class="text-subtitle-2 font-weight-medium">Opening Balance</span>
                      </div>
                      <div class="d-flex flex-wrap ga-1">
                        <VChip
                          size="x-small"
                          color="success"
                          variant="flat"
                        >
                          +{{ importResult.inserted_ob ?? 0 }} ditambah
                        </VChip>
                        <VChip
                          v-if="(importResult.skipped_ob ?? 0) > 0"
                          size="x-small"
                          color="secondary"
                          variant="flat"
                        >
                          ⊘{{ importResult.skipped_ob }} dilewati (duplikat)
                        </VChip>
                        <VChip
                          v-if="(importResult.failed_ob ?? 0) > 0"
                          size="x-small"
                          color="error"
                          variant="flat"
                        >
                          ✗{{ importResult.failed_ob }} gagal
                        </VChip>
                      </div>
                    </VCardText>
                  </VCard>
                </VCol>
                <VCol
                  v-if="(importResult.inserted_detail ?? 0) > 0"
                  cols="6"
                >
                  <VCard
                    variant="tonal"
                    color="secondary"
                    rounded="lg"
                  >
                    <VCardText class="pa-3">
                      <div class="d-flex align-center ga-2">
                        <VIcon
                          icon="ri-file-list-3-line"
                          size="18"
                          color="secondary"
                        />
                        <span class="text-subtitle-2 font-weight-medium">Rincian +{{ importResult.inserted_detail }}</span>
                      </div>
                    </VCardText>
                  </VCard>
                </VCol>
                <VCol
                  v-if="(importResult.inserted_item ?? 0) > 0"
                  cols="6"
                >
                  <VCard
                    variant="tonal"
                    color="info"
                    rounded="lg"
                  >
                    <VCardText class="pa-3">
                      <div class="d-flex align-center ga-2">
                        <VIcon
                          icon="ri-box-3-line"
                          size="18"
                          color="info"
                        />
                        <span class="text-subtitle-2 font-weight-medium">Item +{{ importResult.inserted_item }}</span>
                      </div>
                    </VCardText>
                  </VCard>
                </VCol>
              </VRow>
            </template>

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
                {{ importResult.errors.length }} catatan / baris gagal diproses:
              </div>
              <VTable
                v-if="!xs"
                density="compact"
                fixed-header
                height="180"
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

              <div
                v-else
                class="d-flex flex-column ga-2 overflow-y-auto"
                style="max-height: 260px;"
              >
                <VCard
                  v-for="(err, i) in importResult.errors"
                  :key="i"
                  variant="tonal"
                  color="error"
                  rounded="lg"
                >
                  <VCardText class="pa-2">
                    <div class="d-flex flex-wrap ga-1 mb-1">
                      <VChip
                        size="x-small"
                        color="error"
                        variant="flat"
                      >
                        {{ err.sheet || '-' }}
                      </VChip>
                      <VChip
                        size="x-small"
                        color="error"
                        variant="tonal"
                      >
                        Baris {{ err.row }}
                      </VChip>
                    </div>
                    <div class="text-caption">
                      {{ err.message }}
                    </div>
                  </VCardText>
                </VCard>
              </div>
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
            :disabled="!importFile || !cutoverDate || importing"
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
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useDisplay } from 'vuetify'
import api from '@/utils/axios'
import { useMasterOpeningBalanceImportStore, WIDGET_ID } from '@/stores/master-opening-balance-import.store'
import { useMinimizeWidgetStore } from '@/stores/minimize-widget.store'
import { useImportEta } from '@/composables/useImportEta'

const { xs } = useDisplay()
const importStore = useMasterOpeningBalanceImportStore()
const minimizeStore = useMinimizeWidgetStore()
const { importing, progress: importProgress, result: importResult } = storeToRefs(importStore)
const { elapsedLabel, etaLabel } = useImportEta(
  importProgress,
  () => importing.value && !['completed', 'failed'].includes(importProgress.value?.status),
)

const showImport = ref(false)
const showInfo = ref(false)
const importFile = ref(null)
const cutoverDate = ref(null)
const downloadingTemplate = ref({ xlsx: false, csv: false })

function openImport() {
  minimizeStore.setMinimizedFalse(WIDGET_ID)

  if (importing.value) {
    showImport.value = true

    return
  }

  importFile.value = null
  cutoverDate.value = null
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

async function downloadTemplate(format) {
  downloadingTemplate.value[format] = true
  try {
    const res = await api.get('/master/master-data/opening-balance/import-template', {
      params: { format },
      responseType: 'blob',
    })

    const url = URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')

    a.href = url
    a.download = `template-import-master-opening-balance.${format}`
    a.click()
    URL.revokeObjectURL(url)
  } finally {
    downloadingTemplate.value[format] = false
  }
}

async function doImport() {
  if (!importFile.value || !cutoverDate.value) return
  await importStore.startImport(importFile.value, cutoverDate.value)
}

onMounted(() => {
  importStore.checkActive()

  const widget = minimizeStore.widgets[WIDGET_ID]

  if (widget?.pendingRestore) {
    minimizeStore.clearPendingRestore(WIDGET_ID)
    minimizeStore.setMinimizedFalse(WIDGET_ID)
    showImport.value = true
  }
})
</script>

<style scoped>
/* Ringkas lagi tampilan mobile khusus tab ini (page-specific, tidak dipakai
   modul lain — aman diringkas langsung tanpa :deep() kecuali untuk VChip). */
@media (max-width: 599.98px) {
  .text-h6 {
    font-size: 1.05rem !important;
  }

  .text-subtitle-2 {
    font-size: 0.8rem !important;
  }

  :deep(.v-chip) {
    font-size: 0.65rem !important;
    --v-chip-height: 20px;
  }
}
</style>
