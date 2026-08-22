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
        <CollapsibleInfoAlert
          type="info"
          title="Tentang tab ini:"
          class="mb-4"
        >
          <li>Upload <strong>1 file Excel</strong> dengan <strong>3 sheet</strong>: <strong>MASTER DATA</strong> (Investor + Resto + Client AR), <strong>MASTER BARANG</strong> (Produk/Barang), dan <strong>Petunjuk Pengisian</strong>.</li>
          <li>Sheet <strong>MASTER DATA</strong>: 1 baris = 1 outlet. Kolom <code>tipe_klien</code> boleh diisi <strong>RESTO/B2C</strong> atau <strong>PT/B2B</strong>. Untuk <code>tipe_klien = PT/B2B</code>: <strong>nama_entitas</strong> dan <strong>pic_ar</strong> wajib diisi. Untuk <code>tipe_klien = RESTO/B2C</code>: <strong>nama_pic</strong> wajib diisi (pic_ar hanya fallback jika nama_pic kosong); <strong>nama_investor boleh dikosongkan</strong> — Client AR akan pakai nama fallback "kode_resto (nama_cabang)" otomatis.</li>
          <li>Kolom <code>email</code> (opsional, dipakai untuk fitur Kirim Email Invoice/OB): <strong>1 investor selalu memakai email yang sama</strong> di semua baris — baris kosong atau berbeda dari email yang sudah tercatat tidak akan menimpa, cukup dicatat sebagai info di hasil import.</li>
          <li>Sheet <strong>MASTER BARANG</strong>: <strong>kode_barang wajib</strong> untuk setiap baris (identitas unik barang, boleh nama sama untuk barang berbeda).</li>
          <li><strong>Invoice tidak lagi diimport di sini.</strong> Gunakan tab <strong>Import Master Invoice</strong> — di sana data dibaca &amp; diklasifikasi dulu supaya invoice yang sudah ditagih/dibayar tidak tertimpa.</li>
          <li>Import hanya dapat dilakukan oleh role <strong>ADMIN, MANAGER, atau SUPERVISOR</strong>.</li>
          <li>Download template Excel terlebih dahulu untuk mendapatkan format yang benar.</li>
        </CollapsibleInfoAlert>

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

        <!-- Riwayat perubahan (batch import terakhir) -->
        <template v-if="latestImport">
          <div class="d-flex flex-wrap align-center ga-2 mb-3">
            <VSelect
              v-model="changeLogFilters.entity_type"
              :items="entityTypeOptions"
              label="Sheet"
              density="compact"
              variant="outlined"
              hide-details
              clearable
              style="max-inline-size: 190px;"
              @update:model-value="fetchChangeLog(1)"
            />
            <VSelect
              v-model="changeLogFilters.change_type"
              :items="changeTypeOptions"
              label="Tipe Perubahan"
              density="compact"
              variant="outlined"
              hide-details
              clearable
              style="max-inline-size: 210px;"
              @update:model-value="fetchChangeLog(1)"
            />
            <VSelect
              v-model="changeLogFilters.status"
              :items="statusOptions"
              label="Status"
              density="compact"
              variant="outlined"
              hide-details
              clearable
              style="max-inline-size: 180px;"
              @update:model-value="fetchChangeLog(1)"
            />
            <VTextField
              v-model="changeLogFilters.search"
              label="Cari perubahan data..."
              density="compact"
              variant="outlined"
              hide-details
              clearable
              style="max-inline-size: 280px;"
              @update:model-value="onChangeLogSearch"
            />
          </div>

          <BaseTable
            :headers="changeLogHeaders"
            :items="changeLogItems"
            :total="changeLogTotal"
            :loading="loadingChangeLog"
            :page="changeLogPage"
            :per-page="changeLogPerPage"
            mobile-cards
            column-resize-key="master-data-change-log"
            @update:options="onChangeLogOptions"
          >
            <template #item.created_at="{ item }">
              <span class="text-no-wrap">{{ formatDateTimeWithSeconds(item.created_at) }}</span>
            </template>

            <template #item.entity_type="{ item }">
              <VChip
                size="small"
                :color="ENTITY_META[item.entity_type]?.color ?? 'secondary'"
                variant="tonal"
              >
                {{ ENTITY_META[item.entity_type]?.label ?? item.entity_type }}
              </VChip>
            </template>

            <template #item.change_type="{ item }">
              <div class="d-flex align-center ga-1 text-no-wrap">
                <VIcon
                  :icon="CHANGE_TYPE_META[item.change_type]?.icon"
                  :color="CHANGE_TYPE_META[item.change_type]?.color"
                  size="16"
                />
                <span>{{ CHANGE_TYPE_META[item.change_type]?.label ?? item.change_type }}</span>
              </div>
            </template>

            <template #item.data_sebelum="{ item }">
              <div class="py-1">
                <div class="text-caption">
                  {{ primaryLine(item, 'data_sebelum') }}
                </div>
                <VMenu
                  v-if="extraFields(item, 'data_sebelum').length"
                  location="bottom start"
                  open-on-click
                >
                  <template #activator="{ props: menuProps }">
                    <a
                      href="#"
                      class="text-caption"
                      v-bind="menuProps"
                      @click.prevent
                    >Lihat detail</a>
                  </template>
                  <VCard
                    min-width="220"
                    class="pa-3"
                  >
                    <div
                      v-for="f in extraFields(item, 'data_sebelum')"
                      :key="f.label"
                      class="text-caption mb-1"
                    >
                      <strong>{{ f.label }}:</strong> {{ f.value }}
                    </div>
                  </VCard>
                </VMenu>
              </div>
            </template>

            <template #item.data_baru="{ item }">
              <div class="py-1">
                <div class="text-caption">
                  {{ primaryLine(item, 'data_baru') }}
                </div>
                <div
                  v-if="item.change_type === 'gagal' && item.message"
                  class="text-caption text-error"
                >
                  Error: {{ item.message }}
                </div>
                <VMenu
                  v-if="extraFields(item, 'data_baru').length"
                  location="bottom start"
                  open-on-click
                >
                  <template #activator="{ props: menuProps }">
                    <a
                      href="#"
                      class="text-caption"
                      v-bind="menuProps"
                      @click.prevent
                    >Lihat detail</a>
                  </template>
                  <VCard
                    min-width="220"
                    class="pa-3"
                  >
                    <div
                      v-for="f in extraFields(item, 'data_baru')"
                      :key="f.label"
                      class="text-caption mb-1"
                    >
                      <strong>{{ f.label }}:</strong> {{ f.value }}
                    </div>
                  </VCard>
                </VMenu>
              </div>
            </template>

            <template #item.imported_by>
              {{ latestImport?.imported_by ?? '—' }}
            </template>

            <template #item.status="{ item }">
              <VChip
                size="small"
                :color="STATUS_META[item.change_type]?.color ?? 'secondary'"
                variant="tonal"
              >
                {{ STATUS_META[item.change_type]?.label ?? '-' }}
              </VChip>
            </template>
          </BaseTable>
        </template>
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
          <span>Import Master Data</span>
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
          <CollapsibleInfoAlert
            type="info"
            title="Petunjuk Import"
            class="mb-4"
          >
            <li>File harus berformat <strong>.xlsx</strong> dengan sheet <strong>MASTER DATA</strong> dan <strong>MASTER BARANG</strong>.</li>
            <li>Sheet <strong>MASTER DATA</strong>: 1 baris = Investor + Resto + Client AR. Kolom <strong>tipe_klien</strong> boleh diisi <strong>RESTO/B2C</strong> atau <strong>PT/B2B</strong>. PT/B2B wajib isi <strong>nama_entitas</strong> &amp; <strong>pic_ar</strong>; RESTO/B2C wajib isi <strong>nama_pic</strong>. <strong>nama_investor boleh dikosongkan</strong> untuk RESTO/B2C — Client AR akan pakai nama fallback "kode_resto (nama_cabang)" otomatis. Kolom <strong>email</strong> opsional — 1 investor selalu memakai 1 email yang sama di semua barisnya.</li>
            <li>Sheet <strong>MASTER BARANG</strong>: kode_barang, nama_barang, spesifikasi, keterangan, status. <strong>kode_barang wajib</strong> di setiap baris.</li>
            <li>Sheet <strong>MASTER INVOICE</strong> pada file lama akan <strong>diabaikan</strong> — upload invoice lewat tab Import Master Invoice.</li>
            <li>Format XLSX cocok untuk Master Data hingga ±13.000 baris. Untuk volume lebih besar, pertimbangkan membagi jadi beberapa file upload.</li>
          </CollapsibleInfoAlert>

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

            <div
              v-if="importProgress.cancelable"
              class="d-flex justify-end mt-3"
            >
              <VBtn
                color="error"
                variant="flat"
                size="small"
                prepend-icon="ri-close-circle-line"
                :disabled="importStore.cancelRequested"
                @click="doCancelImport"
              >
                {{ importStore.cancelRequested ? 'Membatalkan…' : 'Batalkan' }}
              </VBtn>
            </div>
          </div>
        </VCardText>

        <VDivider />
        <VCardActions class="pa-4 justify-end ga-2">
          <VBtn
            color="error"
            variant="flat"
            :disabled="importing"
            @click="closeImport"
          >
            Tutup
          </VBtn>
          <VBtn
            color="primary"
            variant="flat"
            :loading="importing"
            :disabled="!importFile || importing"
            @click="doImport"
          >
            Import
            <template #loader>
              <VProgressCircular
                indeterminate
                size="20"
                width="2"
                color="white"
              />
            </template>
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useDisplay } from 'vuetify'
import { useRouter } from 'vue-router'
import api from '@/utils/axios'
import { useMasterDataImportStore, WIDGET_ID } from '@/stores/master-data-import.store'
import { useMinimizeWidgetStore } from '@/stores/minimize-widget.store'
import { useImportEta } from '@/composables/useImportEta'
import { useSweetAlert } from '@/composables/useSweetAlert'
import CollapsibleInfoAlert from '@/components/shared/CollapsibleInfoAlert.vue'
import BaseTable from '@/components/base/BaseTable.vue'

const { xs } = useDisplay()
const router = useRouter()
const { showSuccess, showError } = useSweetAlert()
const importStore = useMasterDataImportStore()
const minimizeStore = useMinimizeWidgetStore()
const { importing, progress: importProgress, result: importResult } = storeToRefs(importStore)
const { elapsedLabel, etaLabel } = useImportEta(
  importProgress,
  () => importing.value && !['completed', 'failed'].includes(importProgress.value?.status),
)

const showImport = ref(false)
const importFile = ref(null)
const downloadingTemplate = ref(false)
const latestImport = ref(null)
const loadingLatest = ref(true)

// ── Riwayat perubahan (tabel yang menggantikan 4 card ringkasan lama) ──────
const ENTITY_META = {
  investor: { label: 'Investor', color: 'primary' },
  resto: { label: 'Resto', color: 'success' },
  klien_ar: { label: 'Client AR', color: 'warning' },
  barang: { label: 'Barang', color: 'info' },
}

const CHANGE_TYPE_META = {
  ditambahkan: { label: 'Ditambahkan', icon: 'ri-add-line', color: 'success' },
  diperbarui: { label: 'Diperbarui', icon: 'ri-pencil-line', color: 'info' },
  gagal: { label: 'Gagal', icon: 'ri-close-line', color: 'error' },
}

const STATUS_META = {
  ditambahkan: { label: 'Berhasil', color: 'success' },
  diperbarui: { label: 'Berhasil', color: 'success' },
  gagal: { label: 'Gagal', color: 'error' },
}

// Field "identitas utama" (nama+kode) yang selalu ditampilkan di baris pertama kolom
// Data Sebelumnya/Data Baru — field lain (kalau ada) disembunyikan di balik "Lihat detail".
const PRIMARY_FIELDS = {
  investor: ['nama_investor', 'kode_cabang'],
  resto: ['nama_resto', 'kode_resto'],
  klien_ar: ['nama_klien', 'kode_klien'],
  barang: ['nama_barang', 'kode_barang'],
}

// Duplikasi ringan dari *_FIELD_LABELS di MasterImportService.php — labelnya stabil &
// sedikit, jadi lebih murah dijaga manual di sini daripada mengirim label dari backend
// di tiap baris JSON.
const FIELD_LABELS = {
  nama_investor: 'Nama', kode_cabang: 'Kode', ktp: 'KTP', npwp: 'NPWP', no_hp: 'No. HP',
  pengelola: 'Pengelola', no_hp_pengelola: 'No. HP Pengelola', email: 'Email', id_cabang: 'ID Cabang',
  nama_resto: 'Nama', kode_resto: 'Kode', supervisor: 'Supervisor', no_hp_supervisor: 'No. HP Supervisor',
  stokis: 'Stokis', area: 'Area', kota: 'Kota', alamat: 'Alamat', no_telp: 'No. Telp', tgl_aktif: 'Tanggal Aktif',
  keterangan: 'Keterangan', nama_klien: 'Nama', kode_klien: 'Kode', tipe_klien: 'Tipe Klien',
  no_npwp: 'NPWP', no_wa: 'No. WA', nama_barang: 'Nama', kode_barang: 'Kode', spesifikasi: 'Spesifikasi',
  status: 'Status',
}

const entityTypeOptions = [
  { title: 'Investor', value: 'investor' },
  { title: 'Resto', value: 'resto' },
  { title: 'Client AR', value: 'klien_ar' },
  { title: 'Barang', value: 'barang' },
]

const changeTypeOptions = [
  { title: 'Ditambahkan', value: 'ditambahkan' },
  { title: 'Diperbarui', value: 'diperbarui' },
  { title: 'Gagal', value: 'gagal' },
]

const statusOptions = [
  { title: 'Berhasil', value: 'berhasil' },
  { title: 'Gagal', value: 'gagal' },
]

const changeLogHeaders = [
  { title: 'Waktu', key: 'created_at', minWidth: '160px' },
  { title: 'Sheet', key: 'entity_type', minWidth: '110px' },
  { title: 'Baris', key: 'row_number', align: 'end', minWidth: '70px' },
  { title: 'Tipe Perubahan', key: 'change_type', minWidth: '150px' },
  { title: 'Data Sebelumnya', key: 'data_sebelum', minWidth: '220px' },
  { title: 'Data Baru', key: 'data_baru', minWidth: '220px' },
  { title: 'Di Import Oleh', key: 'imported_by', minWidth: '160px' },
  { title: 'Status', key: 'status', minWidth: '110px' },
]

const changeLogItems = ref([])
const changeLogTotal = ref(0)
const changeLogPage = ref(1)
const changeLogPerPage = ref(20)
const loadingChangeLog = ref(false)
const changeLogFilters = ref({ entity_type: null, change_type: null, status: null, search: '' })
let changeLogSearchTimer = null

function primaryLine(item, dataKey) {
  const data = item[dataKey]
  if (!data) return '-'
  const fields = PRIMARY_FIELDS[item.entity_type] ?? []

  return fields.map(f => `${FIELD_LABELS[f] ?? f}: ${data[f] ?? '-'}`).join(', ')
}

function extraFields(item, dataKey) {
  const data = item[dataKey]
  if (!data) return []
  const primary = PRIMARY_FIELDS[item.entity_type] ?? []

  return Object.entries(data)
    .filter(([k]) => k !== 'id' && !primary.includes(k))
    .map(([k, v]) => ({ label: FIELD_LABELS[k] ?? k, value: v ?? '-' }))
}

function formatDateTimeWithSeconds(isoString) {
  if (!isoString) return '—'

  const d = new Date(isoString)

  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

async function fetchChangeLog(page = null) {
  if (!latestImport.value?.id) {
    changeLogItems.value = []
    changeLogTotal.value = 0

    return
  }
  if (page) changeLogPage.value = page
  loadingChangeLog.value = true
  try {
    const res = await api.get(`/master/master-data/import/${latestImport.value.id}/change-log`, {
      params: {
        page: changeLogPage.value,
        per_page: changeLogPerPage.value,
        entity_type: changeLogFilters.value.entity_type || undefined,
        change_type: changeLogFilters.value.change_type || undefined,
        status: changeLogFilters.value.status || undefined,
        search: changeLogFilters.value.search || undefined,
      },
    })

    changeLogItems.value = res.data?.data ?? []
    changeLogTotal.value = res.data?.meta?.total ?? changeLogItems.value.length
  } catch {
    changeLogItems.value = []
    changeLogTotal.value = 0
  } finally {
    loadingChangeLog.value = false
  }
}

function onChangeLogOptions(options) {
  changeLogPage.value = options.page ?? changeLogPage.value
  changeLogPerPage.value = options.itemsPerPage ?? changeLogPerPage.value
  fetchChangeLog()
}

function onChangeLogSearch() {
  clearTimeout(changeLogSearchTimer)
  changeLogSearchTimer = setTimeout(() => fetchChangeLog(1), 400)
}

const resultStats = computed(() => {
  if (!importResult.value) return []

  const r = importResult.value

  return [
    { label: 'Investor', icon: 'ri-money-dollar-circle-line', color: 'primary', inserted: r.investor_inserted ?? 0, updated: r.investor_updated ?? 0, skipped: r.investor_skipped ?? 0, failed: r.investor_failed ?? 0 },
    { label: 'Resto', icon: 'ri-store-2-line', color: 'success', inserted: r.resto_inserted ?? 0, updated: r.resto_updated ?? 0, skipped: r.resto_skipped ?? 0, failed: r.resto_failed ?? 0 },
    { label: 'Client AR', icon: 'ri-building-4-line', color: 'warning', inserted: r.klien_inserted ?? 0, updated: r.klien_updated ?? 0, skipped: r.klien_skipped ?? 0, failed: r.klien_failed ?? 0 },
    { label: 'Barang', icon: 'ri-box-3-line', color: 'info', inserted: r.barang_inserted ?? 0, updated: r.barang_updated ?? 0, skipped: r.barang_skipped ?? 0, failed: r.barang_failed ?? 0 },
  ]
})

function importSummaryText() {
  const total = resultStats.value.reduce((sum, s) => sum + s.inserted + s.updated, 0)

  return `${total} data berhasil diproses.`
}

function formatDateTime(isoString) {
  if (!isoString) return '—'

  const d = new Date(isoString)

  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
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
  fetchChangeLog(1)
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
    const a = document.createElement('a')

    a.href = url
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

async function doCancelImport() {
  try {
    await importStore.cancelImport()
  } catch (err) {
    showError({ text: err.response?.data?.message ?? 'Gagal membatalkan import.' })
  }
}

watch(importResult, val => {
  if (!val) return

  if (val.status === 'completed') fetchLatestImport()

  // Cuma auto-close + redirect saat dialog masih terbuka di foreground — kalau
  // di-minimize, biarkan widget mengambang + restore manual yang jalan (tidak diubah).
  if (!showImport.value) return

  if (val.status === 'completed') {
    setTimeout(async () => {
      showImport.value = false
      minimizeStore.remove(WIDGET_ID)
      await showSuccess({ title: 'Import Berhasil!', text: importSummaryText() })
      router.push({ name: 'master-investor' })
    }, 700)
  } else if (val.status === 'failed') {
    setTimeout(() => {
      showImport.value = false
      minimizeStore.remove(WIDGET_ID)

      const isCancelled = val.message?.startsWith('Dibatalkan')

      showError({
        title: isCancelled ? 'Import Dibatalkan' : 'Terjadi Kesalahan',
        icon: isCancelled ? 'warning' : 'error',
        text: val.message ?? 'Import gagal.',
      })
    }, 700)
  }
})

onMounted(() => {
  fetchLatestImport()

  // Batch aktif (queued/processing) hidup di server terlepas dari sesi FE — cek
  // begitu tab dibuka supaya batch yang masih berjalan (mis. reload halaman di
  // tengah proses) langsung terlihat lagi. Pola sama seperti checkActive() di
  // master-invoice-import.store.js / master-opening-balance-import.store.js.
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
