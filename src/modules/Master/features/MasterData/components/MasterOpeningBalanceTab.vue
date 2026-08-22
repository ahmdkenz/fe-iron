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
        <CollapsibleInfoAlert
          type="info"
          title="Tentang tab ini:"
        >
          <li>Untuk mengisi <strong>saldo awal piutang klien</strong> secara massal — 1 baris = 1 invoice historis, baris dengan <strong>no_urut</strong> yang sama otomatis digabung jadi 1 Opening Balance (pola yang sama seperti Import Master Invoice).</li>
          <li>Identitas klien (nama_klien, kode_resto, tipe_klien) hanya wajib diisi di <strong>baris pertama</strong> tiap no_urut. tipe_klien: <strong>PT/B2B</strong> (saldo konsolidasi head office, tanpa resto spesifik) atau <strong>RESTO/B2C</strong> (saldo per outlet — <strong>kode_resto</strong> wajib diisi &amp; divalidasi ke MASTER DATA Resto).</li>
          <li><strong>Tanggal Saldo Awal (cutover)</strong> diisi 1x di form ini sebelum upload — berlaku untuk semua baris dalam file. Bukan tanggal invoice historisnya (itu tetap diisi per baris di kolom tanggal_invoice_asal).</li>
          <li>Item per invoice historis bersifat <strong>opsional</strong> — didukung oleh <strong>kedua template</strong> (XLSX maupun CSV).</li>
          <li>Gunakan <strong>Template CSV</strong> untuk volume data besar — mendukung baris jauh lebih banyak dari XLSX.</li>
          <li>Gunakan <strong>Template XLSX</strong> untuk volume kecil-menengah — item ditulis di sheet terpisah, lebih mudah dibaca manual di Excel.</li>
          <li>Baris/grup gagal tidak menggagalkan baris/grup lain — hasil akhir menampilkan rincian baris mana yang gagal dan alasannya.</li>
          <li>Kalau klien sudah punya Opening Balance di tanggal cutover yang sama: data yang <strong>identik</strong> otomatis <strong>dilewati</strong>, data yang <strong>berbeda</strong> otomatis <strong>menggantikan</strong> yang lama (tercatat sebagai "Diperbarui" di Riwayat Import) — tanpa perlu konfirmasi manual.</li>
          <li>Semua Opening Balance hasil import langsung berstatus <strong>APPROVED</strong> — tidak perlu persetujuan manual, karena import hanya dapat dilakukan oleh role tepercaya.</li>
          <li>Import hanya dapat dilakukan oleh role <strong>ADMIN, MANAGER, atau SUPERVISOR</strong>.</li>
        </CollapsibleInfoAlert>

        <!-- Banner riwayat import terakhir -->
        <div class="mb-4 mt-4">
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
            column-resize-key="opening-balance-change-log"
            @update:options="onChangeLogOptions"
          >
            <template #item.created_at="{ item }">
              <span class="text-no-wrap">{{ formatDateTimeWithSeconds(item.created_at) }}</span>
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
          <CollapsibleInfoAlert
            type="warning"
            title="Petunjuk Import"
            class="mb-4"
          >
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
          </CollapsibleInfoAlert>

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

            <div
              v-if="importProgress?.cancelable"
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
            :disabled="!importFile || !cutoverDate || importing"
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
import { ref, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useDisplay } from 'vuetify'
import { useRouter } from 'vue-router'
import api from '@/utils/axios'
import { useMasterOpeningBalanceImportStore, WIDGET_ID } from '@/stores/master-opening-balance-import.store'
import { useMinimizeWidgetStore } from '@/stores/minimize-widget.store'
import { useImportEta } from '@/composables/useImportEta'
import { useSweetAlert } from '@/composables/useSweetAlert'
import CollapsibleInfoAlert from '@/components/shared/CollapsibleInfoAlert.vue'
import BaseTable from '@/components/base/BaseTable.vue'

const { xs } = useDisplay()
const router = useRouter()
const importStore = useMasterOpeningBalanceImportStore()
const minimizeStore = useMinimizeWidgetStore()
const { showSuccess, showError } = useSweetAlert()
const { importing, progress: importProgress, result: importResult } = storeToRefs(importStore)
const { elapsedLabel, etaLabel } = useImportEta(
  importProgress,
  () => importing.value && !['completed', 'failed'].includes(importProgress.value?.status),
)

const showImport = ref(false)
const importFile = ref(null)
const cutoverDate = ref(null)
const downloadingTemplate = ref({ xlsx: false, csv: false })
const latestImport = ref(null)
const loadingLatest = ref(true)

// ── Riwayat perubahan (tabel yang menggantikan panel hasil di modal) ───────
// OB AR single-entity — TIDAK ada entity_type/kolom Sheet (beda dari Master Data yang
// punya 4 entitas). 'diperbarui' = resolusi konflik otomatis (OB lama dihapus &
// digantikan data baru saat data yang diimport berbeda dari OB lama pada klien+tanggal
// cutover yang sama — lihat OpeningBalanceImportService::openingBalanceUnchanged()).
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

// Field "identitas utama" yang selalu ditampilkan di baris pertama kolom Data
// Sebelumnya/Data Baru — field lain (kalau ada) disembunyikan di balik "Lihat detail".
const PRIMARY_FIELDS = ['no_invoice', 'nama_klien']

const FIELD_LABELS = {
  no_invoice: 'No. Invoice', nama_klien: 'Nama Klien', kode_resto: 'Kode Resto',
  tipe_klien: 'Tipe Klien', tanggal: 'Tanggal', tanggal_invoice: 'Tanggal Invoice',
  saldo_awal: 'Saldo Awal', jumlah_detail: 'Jumlah Rincian', jumlah_item: 'Jumlah Item',
  existing_no_invoice: 'No. Invoice Lama',
}

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
const changeLogFilters = ref({ change_type: null, status: null, search: '' })
let changeLogSearchTimer = null

function primaryLine(item, dataKey) {
  const data = item[dataKey]
  if (!data) return '-'

  return PRIMARY_FIELDS.map(f => `${FIELD_LABELS[f] ?? f}: ${data[f] ?? '-'}`).join(', ')
}

function extraFields(item, dataKey) {
  const data = item[dataKey]
  if (!data) return []

  return Object.entries(data)
    .filter(([k]) => k !== 'id' && !PRIMARY_FIELDS.includes(k))
    .map(([k, v]) => ({ label: FIELD_LABELS[k] ?? k, value: v ?? '-' }))
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

async function fetchLatestImport() {
  loadingLatest.value = true
  try {
    const res = await api.get('/master/master-data/opening-balance/import/latest')

    latestImport.value = res.data?.data ?? null
  } catch {
    latestImport.value = null
  } finally {
    loadingLatest.value = false
  }
  fetchChangeLog(1)
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
    const res = await api.get(`/master/master-data/opening-balance/import/${latestImport.value.id}/change-log`, {
      params: {
        page: changeLogPage.value,
        per_page: changeLogPerPage.value,
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

async function doCancelImport() {
  try {
    await importStore.cancelImport()
  } catch (err) {
    showError({ text: err.response?.data?.message ?? 'Gagal membatalkan import.' })
  }
}

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

function importSummaryText() {
  const r = importResult.value ?? {}

  return `${r.inserted_ob ?? 0} Opening Balance berhasil ditambahkan.`
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
      await showSuccess({ title: 'Import Selesai', text: importSummaryText() })
      router.push({ name: 'finance-opening-balance' })
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
  importStore.checkActive()
  fetchLatestImport()

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
