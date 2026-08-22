<template>
  <div>
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between pa-4 flex-wrap ga-2">
        <span class="text-h6">Import Master Invoice</span>
        <VBtn
          color="primary"
          prepend-icon="ri-upload-2-line"
          :disabled="store.awaitingReview"
          @click="openImport"
        >
          Import File
        </VBtn>
      </VCardTitle>
      <VDivider />

      <VCardText>
        <CollapsibleInfoAlert
          type="info"
          title="Cara kerja import aman:"
          class="mb-4"
        >
          <li>Upload file → sistem <strong>hanya membaca &amp; mengklasifikasi</strong>. Belum ada invoice yang ditulis.</li>
          <li>Tekan <strong>Proses Data Aman</strong> → invoice <strong>baru</strong> dibuat, invoice lama <strong>diperbarui</strong> mengikuti file.</li>
          <li>Invoice yang sudah <strong>LUNAS</strong> atau periodenya <strong>terkunci di Ending Balance</strong> tidak pernah disentuh — ubah lewat <strong>Credit/Debit Note manual</strong> di menu Ending Balance.</li>
          <li>Pembayaran &amp; no. referensi yang sudah ada <strong>tetap utuh</strong>. Sisa tagihan dihitung ulang, jadi kalau nilainya naik sisanya bisa langsung dialokasikan dari <strong>Cocokkan Transaksi</strong>.</li>
          <li>Hasilnya tercatat di tabel <strong>Riwayat Perubahan</strong> di bawah.</li>
          <li>Pastikan <strong>MASTER DATA</strong> &amp; <strong>MASTER BARANG</strong> sudah diimport lebih dulu di tab sebelah.</li>
        </CollapsibleInfoAlert>

        <!-- ── Belum ada batch aktif ───────────────────────────── -->
        <VAlert
          v-if="!progress"
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
            <span class="text-body-2">Belum ada file yang diproses pada sesi ini — klik <strong>Import File</strong> untuk memulai.</span>
          </div>
        </VAlert>

        <!-- ── Ringkasan klasifikasi ───────────────────────────── -->
        <template v-else>
          <VAlert
            :type="statusAlert.type"
            variant="tonal"
            density="compact"
            class="mb-4"
            :icon="false"
          >
            <div class="d-flex align-center ga-2 flex-wrap">
              <VIcon
                :icon="statusAlert.icon"
                size="18"
                :color="statusAlert.type"
              />
              <span class="text-body-2">
                <strong>{{ statusAlert.title }}</strong>
                <span v-if="progress.message"> — {{ progress.message }}</span>
                <span
                  v-if="progress.uploaded_by"
                  class="text-caption text-medium-emphasis d-block"
                >
                  Diunggah oleh {{ progress.uploaded_by }} · {{ formatDateTime(progress.created_at) }}
                </span>
              </span>
            </div>
          </VAlert>

          <VRow class="mb-1">
            <VCol
              v-for="card in summaryCards"
              :key="card.label"
              :cols="xs ? 6 : 12"
              sm="6"
              md="3"
            >
              <VCard
                variant="tonal"
                :color="card.color"
                height="100%"
              >
                <VCardText :class="xs ? 'pa-3' : 'pa-4'">
                  <div class="d-flex align-center ga-2 mb-1">
                    <VIcon
                      :icon="card.icon"
                      :size="xs ? 20 : 24"
                    />
                    <span class="text-h6">{{ card.value }}</span>
                  </div>
                  <div class="text-subtitle-2 font-weight-medium">
                    {{ card.label }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ card.hint }}
                  </div>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>

          <!-- Aksi utama -->
          <div class="d-flex flex-wrap ga-2 mb-4">
            <VBtn
              color="primary"
              prepend-icon="ri-play-circle-line"
              :loading="busy"
              :disabled="!canApplySafe"
              @click="doApplySafe"
            >
              Proses Data Aman ({{ safeCount }})
            </VBtn>
            <VBtn
              v-if="progress.cancelable"
              color="error"
              variant="outlined"
              prepend-icon="ri-close-circle-line"
              :disabled="store.cancelRequested"
              @click="confirmCancel = true"
            >
              {{ store.cancelRequested ? 'Membatalkan…' : 'Batalkan Import' }}
            </VBtn>
          </div>

          <!-- Progress "Proses Data Aman" -->
          <div
            v-if="busy && progress.status === 'processing'"
            class="mb-4"
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
                icon="ri-file-list-3-line"
                size="16"
              />
              Menulis invoice aman
              <span class="text-caption text-medium-emphasis ms-auto">
                {{ progress.applied_processed }} / {{ progress.applied_total }} invoice
              </span>
            </div>
            <VProgressLinear
              :model-value="progress.applied_total > 0 ? (progress.applied_processed / progress.applied_total) * 100 : 0"
              :indeterminate="progress.applied_total === 0"
              color="primary"
              height="6"
              rounded
            />
          </div>

          <!-- Error parsing -->
          <div
            v-if="progress.errors?.length"
            class="mt-4"
          >
            <div class="text-subtitle-2 mb-2 text-error d-flex align-center ga-1">
              <VIcon
                icon="ri-error-warning-line"
                size="16"
                color="error"
              />
              {{ progress.errors.length }} baris ditolak saat pembacaan file:
            </div>
            <VTable
              density="compact"
              fixed-header
              height="180"
            >
              <thead>
                <tr>
                  <th style="inline-size: 90px;">
                    Baris
                  </th>
                  <th>Pesan</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(err, i) in progress.errors"
                  :key="i"
                >
                  <td>{{ err.row }}</td>
                  <td>{{ err.message }}</td>
                </tr>
              </tbody>
            </VTable>
          </div>
        </template>

        <!--
          ── Riwayat perubahan (batch import terakhir) ──
          Sengaja DI LUAR blok v-else di atas: sumbernya endpoint import/latest
          (batch completed terakhir), bukan batch yang sedang berjalan — jadi
          tabel tetap tampil setelah reload halaman meski tidak ada batch aktif.
        -->
        <VDivider class="my-4" />

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
              <span class="text-body-2">
                Belum ada riwayat perubahan — tekan <strong>Proses Data Aman</strong> untuk mulai menulis invoice.
              </span>
            </div>
          </VAlert>
        </div>

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
            column-resize-key="invoice-import-change-log"
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

    <!-- ── Dialog upload ─────────────────────────────────────── -->
    <VDialog
      v-model="showImport"
      max-width="640"
      :fullscreen="xs"
      persistent
    >
      <VCard>
        <VCardTitle class="d-flex align-center justify-space-between pa-4">
          <span>Import Master Invoice</span>
          <div class="d-flex ga-1">
            <VBtn
              v-if="busy && !xs"
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
              :disabled="busy"
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
              Upload di sini <strong>tidak langsung menulis invoice</strong>. Sistem membaca &amp; mengklasifikasi dulu,
              lalu Anda yang menekan <strong>Proses Data Aman</strong> setelah melihat ringkasannya.
            </li>
            <li>
              Gunakan <strong>XLSX</strong> untuk data hingga ±13.000 baris; gunakan <strong>CSV</strong> untuk data lebih besar,
              hingga ±50.000–100.000 baris.
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

          <VFileInput
            v-model="importFile"
            label="Pilih File (.xlsx atau .csv)"
            accept=".xlsx,.xls,.csv,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            prepend-icon="ri-file-upload-line"
            variant="outlined"
            density="compact"
            clearable
            hide-details="auto"
            :disabled="busy"
          />

          <div
            v-if="busy && progress"
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
                icon="ri-search-line"
                size="16"
              />
              {{ phaseLabel }}
              <span class="text-caption text-medium-emphasis ms-auto">
                {{ progress.classified_groups }} / {{ progress.total_groups }} invoice
              </span>
            </div>
            <VProgressLinear
              :model-value="progress.total_groups > 0 ? (progress.classified_groups / progress.total_groups) * 100 : 0"
              :indeterminate="progress.total_groups === 0"
              color="primary"
              height="6"
              rounded
            />
            <div class="text-caption text-medium-emphasis mt-2">
              {{ progress.parsed_rows }} baris terbaca dari {{ progress.total_rows }} baris.
            </div>
          </div>

          <VAlert
            v-if="result && result.status === 'awaiting_review'"
            type="success"
            variant="tonal"
            class="mt-4"
          >
            Klasifikasi selesai. Tutup dialog ini untuk meninjau hasilnya.
          </VAlert>
        </VCardText>

        <VDivider />
        <VCardActions class="pa-4 justify-end ga-2">
          <VBtn
            v-if="busy && progress?.cancelable"
            color="error"
            variant="flat"
            :disabled="store.cancelRequested"
            @click="confirmCancel = true"
          >
            {{ store.cancelRequested ? 'Membatalkan…' : 'Batalkan' }}
          </VBtn>
          <VBtn
            color="error"
            variant="flat"
            :disabled="busy"
            @click="closeImport"
          >
            Tutup
          </VBtn>
          <VBtn
            color="primary"
            variant="flat"
            :loading="busy"
            :disabled="!importFile || busy"
            @click="doImport"
          >
            Baca &amp; Klasifikasi
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

    <!-- ── Dialog konfirmasi batalkan import ────────────────────── -->
    <VDialog
      v-model="confirmCancel"
      max-width="480"
    >
      <VCard>
        <VCardTitle>Batalkan Import Ini?</VCardTitle>
        <VDivider />
        <VCardText class="pt-4">
          <p>
            File <strong>{{ progress?.original_filename }}</strong> beserta seluruh baris yang belum diproses
            pada batch ini akan dibuang.
          </p>
          <p class="mt-2 text-medium-emphasis">
            Anda bisa langsung mengunggah file yang sudah dibetulkan setelah ini.
          </p>
        </VCardText>
        <VDivider />
        <VCardActions class="pa-4 justify-end ga-2">
          <VBtn
            variant="outlined"
            :disabled="canceling"
            @click="confirmCancel = false"
          >
            Batal
          </VBtn>
          <VBtn
            color="error"
            :loading="canceling"
            @click="doCancelImport"
          >
            Ya, Batalkan
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
import BaseTable from '@/components/base/BaseTable.vue'
import { useMasterInvoiceImportStore, WIDGET_ID } from '@/stores/master-invoice-import.store'
import { useMinimizeWidgetStore } from '@/stores/minimize-widget.store'
import { useImportEta } from '@/composables/useImportEta'
import { useSweetAlert } from '@/composables/useSweetAlert'
import CollapsibleInfoAlert from '@/components/shared/CollapsibleInfoAlert.vue'

const { xs } = useDisplay()
const router = useRouter()
const { showSuccess, showError } = useSweetAlert()
const store = useMasterInvoiceImportStore()
const minimizeStore = useMinimizeWidgetStore()
const { busy, progress, result } = storeToRefs(store)
const { elapsedLabel, etaLabel } = useImportEta(
  progress,
  () => busy.value && !['completed', 'failed', 'awaiting_review'].includes(progress.value?.status),
)

const showImport = ref(false)
const importFile = ref(null)
const downloadingTemplate = ref({ xlsx: false, csv: false })
const confirmCancel = ref(false)
const canceling = ref(false)

// ── Riwayat perubahan (menggantikan tabel Review) ──────────────────────────
// Import Master Invoice single-entity — TIDAK ada entity_type/kolom Sheet, jadi
// bentuknya mengikuti MasterOpeningBalanceTab.vue, bukan MasterDataTab.vue.
// Hanya 3 tipe: grup REJECTED (sudah lunas / periode terkunci) & UNCHANGED
// sengaja tidak dicatat sama sekali (lihat InvoiceImportService::applySafeChunk()),
// jumlahnya cukup terlihat di kartu ringkasan "Dilewati".
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
  tanggal_invoice: 'Tanggal Invoice', tanggal_jatuh_tempo: 'Jatuh Tempo',
  no_surat_jalan: 'No. Surat Jalan', total: 'Total', jumlah_item: 'Jumlah Item',
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

const latestImport = ref(null)
const loadingLatest = ref(true)
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

function formatDateTimeWithSeconds(isoString) {
  if (!isoString) return '—'

  return new Date(isoString).toLocaleString('id-ID', {
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
    const res = await api.get('/finance/invoices/import/latest')

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
    const res = await api.get(`/finance/invoices/import/${latestImport.value.id}/change-log`, {
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

const safeCount = computed(() => (progress.value?.cnt_new ?? 0) + (progress.value?.cnt_safe_update ?? 0))

const canApplySafe = computed(() => store.awaitingReview && safeCount.value > 0 && !busy.value)

const summaryCards = computed(() => {
  const p = progress.value ?? {}

  return [
    { label: 'Dibuat Baru', hint: 'Belum ada invoice-nya', icon: 'ri-add-circle-line', color: 'success', value: p.cnt_new ?? 0 },
    { label: 'Update Aman', hint: 'Belum tersentuh transaksi', icon: 'ri-refresh-line', color: 'info', value: p.cnt_safe_update ?? 0 },
    { label: 'Dilewati', hint: 'Sudah lunas / periode terkunci', icon: 'ri-forbid-line', color: 'warning', value: p.cnt_rejected ?? 0 },
    { label: 'Tanpa Perubahan', hint: 'Isi invoice sama dengan data existing', icon: 'ri-checkbox-blank-circle-line', color: 'secondary', value: p.cnt_unchanged ?? 0 },
  ]
})

const statusAlert = computed(() => {
  const s = progress.value?.status

  if (store.cancelRequested) return { type: 'warning', icon: 'ri-close-circle-line', title: 'Membatalkan import…' }
  if (s === 'failed' && progress.value?.phase === 'canceled') {
    return { type: 'info', icon: 'ri-information-line', title: 'Tidak ada perubahan — import dibatalkan otomatis' }
  }
  if (s === 'failed') return { type: 'error', icon: 'ri-close-circle-line', title: 'Import gagal' }
  if (s === 'awaiting_review') return { type: 'warning', icon: 'ri-question-answer-line', title: 'Klasifikasi selesai — tekan Proses Data Aman' }
  if (s === 'completed') return { type: 'success', icon: 'ri-checkbox-circle-line', title: 'Proses data aman selesai' }
  if (s === 'processing') return { type: 'info', icon: 'ri-loader-4-line', title: 'Sedang menulis invoice aman…' }

  return { type: 'info', icon: 'ri-loader-4-line', title: 'Sedang membaca & mengklasifikasi file…' }
})

const phaseLabel = computed(() => {
  const phase = progress.value?.phase

  if (phase === 'parsing_file') return 'Membuka file'
  if (phase === 'parsing_rows') return 'Membaca baris'
  if (phase === 'classifying') return 'Mengklasifikasi invoice'

  return 'Memproses'
})

function formatDateTime(v) {
  if (!v) return '—'

  return new Date(v).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function openImport() {
  minimizeStore.setMinimizedFalse(WIDGET_ID)

  if (busy.value) {
    showImport.value = true

    return
  }

  // Masih ada batch (mungkin milik PIC lain) menunggu konfirmasi — jangan buang
  // kartu ringkasan yang sudah ditampilkan dengan membuka dialog upload kosong.
  // Tombol sudah didisable di kondisi ini (lihat :disabled di atas), guard ini
  // jaga-jaga kalau dipanggil lewat jalur lain.
  if (store.awaitingReview) return

  importFile.value = null
  store.reset()
  notifiedCompletion.value = false
  showImport.value = true
}

async function doCancelImport() {
  canceling.value = true
  try {
    await store.cancelImport()
    confirmCancel.value = false
  } finally {
    canceling.value = false
  }
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
    const res = await api.get('/finance/invoices/import-template', {
      params: { format },
      responseType: 'blob',
    })
    const url = URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')

    a.href = url
    a.download = `template-import-master-invoice.${format}`
    a.click()
    URL.revokeObjectURL(url)
  } finally {
    downloadingTemplate.value[format] = false
  }
}

async function doImport() {
  if (!importFile.value) return
  await store.startImport(importFile.value)
}

async function doApplySafe() {
  await store.applySafe()
}

// Klasifikasi selesai → tutup dialog otomatis supaya user langsung melihat ringkasannya.
watch(() => progress.value?.status, status => {
  if (!showImport.value || busy.value) return

  if (status === 'awaiting_review') {
    setTimeout(() => { showImport.value = false }, 900)
  } else if (status === 'failed') {
    const isAutoCancel = progress.value?.phase === 'canceled'

    setTimeout(() => {
      showImport.value = false
      minimizeStore.remove(WIDGET_ID)
      if (isAutoCancel) {
        showSuccess({ title: 'Tidak Ada Perubahan', text: result.value?.message ?? 'Data sama dengan yang sudah tersimpan — import dibatalkan otomatis.' })
      } else {
        showError({ text: result.value?.message ?? 'Gagal membaca/mengklasifikasi file.' })
      }
    }, 900)
  }
})

// "Proses Data Aman" selesai → segarkan tabel Riwayat Perubahan (batch completed
// terakhir kini adalah batch ini), lalu beri tahu user & arahkan ke daftar invoice.
const notifiedCompletion = ref(false)

watch(progress, val => {
  if (notifiedCompletion.value || val?.status !== 'completed') return

  notifiedCompletion.value = true
  fetchLatestImport()
  showSuccess({ title: 'Import Selesai', text: val.message ?? 'Invoice berhasil diproses.' })
    .then(() => router.push({ name: 'finance-invoice-index' }))
}, { deep: true })

onMounted(() => {
  const widget = minimizeStore.widgets[WIDGET_ID]

  if (widget?.pendingRestore) {
    minimizeStore.clearPendingRestore(WIDGET_ID)
    minimizeStore.setMinimizedFalse(WIDGET_ID)
    showImport.value = true

    return
  }

  // Batch awaiting_review milik sesi/PIC lain hidup independen dari FE (lihat
  // komentar di store.checkActive()) — cek begitu tab dibuka supaya langsung
  // terlihat tanpa harus gagal upload dulu untuk tahu masih ada yang menggantung.
  store.checkActive()
})

// Riwayat perubahan punya sumber sendiri (batch completed terakhir), independen
// dari batch aktif — jadi tetap terisi walau tidak ada import yang berjalan.
onMounted(fetchLatestImport)
</script>

<style scoped>
/* Ringkas lagi tampilan mobile khusus tab ini (page-specific, tidak dipakai
   modul lain — aman diringkas langsung tanpa :deep() kecuali untuk VChip/BaseTable). */
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

  :deep(.base-table-mobile-card__body) {
    font-size: 0.8125rem !important;
  }

  :deep(.base-table-mobile-card) {
    padding: 8px !important;
  }
}
</style>
