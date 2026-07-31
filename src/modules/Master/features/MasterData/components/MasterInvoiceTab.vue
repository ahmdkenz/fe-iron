<template>
  <div>
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between pa-4 flex-wrap ga-2">
        <span class="text-h6">Import Master Invoice</span>
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
          <div class="d-flex align-center justify-space-between ga-2">
            <div class="font-weight-medium">
              Cara kerja import aman:
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
            <li>Upload file → sistem <strong>hanya membaca &amp; mengklasifikasi</strong>. Belum ada invoice yang ditulis.</li>
            <li>Tekan <strong>Proses Data Aman</strong> → hanya invoice <strong>baru</strong> dan <strong>update aman</strong> (belum dibayar, belum cocok rekening koran, periode belum terkunci) yang ditulis.</li>
            <li>Invoice yang sudah ditagih/dibayar masuk ke tabel <strong>Butuh Review</strong>. Perubahan nilainya diajukan sebagai <strong>Credit Note</strong> (nilai turun) atau <strong>Debit Note</strong> (nilai naik) — bukan menimpa invoice lama.</li>
            <li>CN/DN mengikuti alur persetujuan koreksi Ending Balance. Sisa tagihan AR baru berubah <strong>setelah disetujui</strong>.</li>
            <li>Pastikan <strong>MASTER DATA</strong> &amp; <strong>MASTER BARANG</strong> sudah diimport lebih dulu di tab sebelah.</li>
          </ul>
        </VAlert>

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

          <!-- Rincian kandidat penyesuaian -->
          <div
            v-if="progress.cnt_review_required > 0"
            class="d-flex flex-wrap ga-2 mb-4 mt-2"
          >
            <VChip
              size="small"
              color="error"
              variant="tonal"
              prepend-icon="ri-arrow-down-line"
            >
              {{ progress.cnt_cn_candidate }} kandidat Credit Note
            </VChip>
            <VChip
              size="small"
              color="warning"
              variant="tonal"
              prepend-icon="ri-arrow-up-line"
            >
              {{ progress.cnt_dn_candidate }} kandidat Debit Note
            </VChip>
            <VChip
              size="small"
              color="secondary"
              variant="tonal"
              prepend-icon="ri-file-text-line"
            >
              {{ progress.cnt_metadata_candidate }} perubahan metadata
            </VChip>
            <VChip
              size="small"
              color="info"
              variant="tonal"
              prepend-icon="ri-time-line"
            >
              {{ progress.pending_review }} menunggu keputusan
            </VChip>
          </div>

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
              variant="outlined"
              prepend-icon="ri-refresh-line"
              :disabled="busy || !store.batchId"
              @click="store.fetchReview()"
            >
              Muat Ulang Tabel
            </VBtn>
          </div>

          <!-- Progress "Proses Data Aman" -->
          <div
            v-if="busy && progress.status === 'processing'"
            class="mb-4"
          >
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

          <!-- ── Tabel review ─────────────────────────────────── -->
          <VDivider class="mb-4" />

          <div class="d-flex flex-wrap align-center ga-2 mb-3">
            <VSelect
              v-model="store.review.classification"
              :items="classificationOptions"
              label="Tampilkan"
              density="compact"
              variant="outlined"
              hide-details
              style="max-inline-size: 240px;"
              @update:model-value="store.fetchReview(1)"
            />
            <VTextField
              v-model="store.review.search"
              label="Cari klien / kode resto / no. invoice"
              density="compact"
              variant="outlined"
              hide-details
              clearable
              style="max-inline-size: 320px;"
              @update:model-value="onSearch"
            />
            <VSpacer />
            <VBtn
              v-if="selectedSubmittable.length"
              color="error"
              variant="tonal"
              size="small"
              prepend-icon="ri-send-plane-line"
              :loading="store.submitting"
              @click="bulkDecide('submit')"
            >
              Ajukan {{ selectedSubmittable.length }} Penyesuaian
            </VBtn>
            <VBtn
              v-if="selectedPending.length"
              variant="outlined"
              size="small"
              prepend-icon="ri-close-circle-line"
              :loading="store.submitting"
              @click="bulkDecide('dismiss')"
            >
              Abaikan {{ selectedPending.length }}
            </VBtn>
          </div>

          <BaseTable
            v-model:selected="selected"
            :headers="headers"
            :items="store.review.items"
            :total="store.review.total"
            :loading="store.review.loading"
            :page="store.review.page"
            :per-page="store.review.perPage"
            show-select
            mobile-cards
            column-resize-key="invoice-import-review"
            @update:options="onOptions"
          >
            <template #item.nama_klien="{ item }">
              <div class="d-flex flex-column py-1">
                <span class="font-weight-medium">{{ item.nama_klien }}</span>
                <span class="text-caption text-medium-emphasis">
                  {{ item.tipe_invoice }} · {{ item.kode_resto ?? '—' }} · baris {{ item.first_line }}
                </span>
              </div>
            </template>

            <template #item.tanggal_invoice="{ item }">
              <div class="d-flex flex-column py-1">
                <span>{{ formatDate(item.tanggal_invoice) }}</span>
                <span class="text-caption text-medium-emphasis">{{ item.no_invoice ?? 'Belum ada invoice' }}</span>
              </div>
            </template>

            <template #item.classification="{ item }">
              <VChip
                size="small"
                :color="classificationColor(item.classification)"
                variant="tonal"
              >
                {{ classificationLabel(item.classification) }}
              </VChip>
            </template>

            <template #item.selisih="{ item }">
              <div class="d-flex flex-column py-1 text-end">
                <span :class="selisihClass(item.selisih)">{{ formatMoney(item.selisih) }}</span>
                <span class="text-caption text-medium-emphasis">
                  {{ formatMoney(item.total_lama) }} → {{ formatMoney(item.total_baru) }}
                </span>
              </div>
            </template>

            <template #item.adjustment_type="{ item }">
              <VChip
                v-if="item.adjustment_type"
                size="small"
                :color="adjustmentColor(item.adjustment_type)"
                variant="tonal"
              >
                {{ adjustmentLabel(item.adjustment_type) }}
              </VChip>
              <span
                v-else
                class="text-medium-emphasis"
              >—</span>
            </template>

            <template #item.reason="{ item }">
              <div class="py-1">
                <div class="text-caption">
                  {{ item.reason ?? item.apply_message ?? '—' }}
                </div>
                <div
                  v-if="item.risk_flags?.length"
                  class="d-flex flex-wrap ga-1 mt-1"
                >
                  <VChip
                    v-for="flag in item.risk_flags"
                    :key="flag"
                    size="x-small"
                    :color="flag === 'PEMBAYARAN_MELEBIHI' ? 'error' : 'secondary'"
                    variant="tonal"
                  >
                    {{ riskLabel(flag) }}
                  </VChip>
                </div>
              </div>
            </template>

            <template #item.review_status="{ item }">
              <VChip
                v-if="item.review_status"
                size="small"
                :color="reviewColor(item.review_status)"
                variant="tonal"
              >
                {{ reviewLabel(item.review_status) }}
              </VChip>
              <VChip
                v-else-if="item.apply_status"
                size="small"
                :color="item.apply_status === 'APPLIED' ? 'success' : 'error'"
                variant="tonal"
              >
                {{ item.apply_status }}
              </VChip>
              <span
                v-else
                class="text-medium-emphasis"
              >—</span>
            </template>

            <template #item.actions="{ item }">
              <div class="d-flex ga-1 justify-end">
                <VBtn
                  v-if="canSubmit(item)"
                  size="small"
                  color="primary"
                  variant="tonal"
                  :loading="store.submitting"
                  @click="decide(item, 'submit')"
                >
                  Ajukan
                </VBtn>
                <VBtn
                  v-if="item.review_status === 'PENDING'"
                  size="small"
                  variant="text"
                  :loading="store.submitting"
                  @click="decide(item, 'dismiss')"
                >
                  Abaikan
                </VBtn>
              </div>
            </template>

            <template #mobile-card="{ item }">
              <div class="d-flex flex-column ga-1 pa-1">
                <div class="d-flex align-center justify-space-between ga-2">
                  <span class="font-weight-medium">{{ item.nama_klien }}</span>
                  <VChip
                    size="x-small"
                    :color="classificationColor(item.classification)"
                    variant="tonal"
                  >
                    {{ classificationLabel(item.classification) }}
                  </VChip>
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ item.tipe_invoice }} · {{ item.kode_resto ?? '—' }} · {{ formatDate(item.tanggal_invoice) }}
                </div>
                <div class="text-caption">
                  {{ formatMoney(item.total_lama) }} → {{ formatMoney(item.total_baru) }}
                  <strong :class="selisihClass(item.selisih)">({{ formatMoney(item.selisih) }})</strong>
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ item.reason ?? item.apply_message ?? '—' }}
                </div>
                <div class="d-flex ga-1 mt-1">
                  <VBtn
                    v-if="canSubmit(item)"
                    size="small"
                    color="primary"
                    variant="tonal"
                    :loading="store.submitting"
                    @click="decide(item, 'submit')"
                  >
                    Ajukan
                  </VBtn>
                  <VBtn
                    v-if="item.review_status === 'PENDING'"
                    size="small"
                    variant="text"
                    :loading="store.submitting"
                    @click="decide(item, 'dismiss')"
                  >
                    Abaikan
                  </VBtn>
                </div>
              </div>
            </template>
          </BaseTable>

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
              v-if="busy"
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
          <VAlert
            type="warning"
            variant="tonal"
            class="mb-4"
          >
            <ul class="ps-4">
              <li>
                Upload di sini <strong>tidak langsung menulis invoice</strong>. Sistem membaca &amp; mengklasifikasi dulu,
                lalu Anda yang memutuskan mana yang diproses dan mana yang diajukan sebagai Credit/Debit Note.
              </li>
              <li>
                Gunakan <strong>XLSX</strong> untuk data hingga ±13.000 baris; gunakan <strong>CSV</strong> untuk data lebih besar,
                hingga ±50.000–100.000 baris.
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
            v-if="result && result.status === 'failed'"
            type="error"
            variant="tonal"
            class="mt-4"
          >
            {{ result.message }}
          </VAlert>
          <VAlert
            v-else-if="result && result.status === 'awaiting_review'"
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
            variant="outlined"
            :disabled="busy"
            @click="closeImport"
          >
            Tutup
          </VBtn>
          <VBtn
            color="primary"
            :loading="busy"
            :disabled="!importFile || busy"
            @click="doImport"
          >
            Baca &amp; Klasifikasi
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
import api from '@/utils/axios'
import BaseTable from '@/components/base/BaseTable.vue'
import { useMasterInvoiceImportStore, WIDGET_ID } from '@/stores/master-invoice-import.store'
import { useMinimizeWidgetStore } from '@/stores/minimize-widget.store'

const { xs } = useDisplay()
const store = useMasterInvoiceImportStore()
const minimizeStore = useMinimizeWidgetStore()
const { busy, progress, result } = storeToRefs(store)

const showImport = ref(false)
const showInfo = ref(false)
const importFile = ref(null)
const downloadingTemplate = ref({ xlsx: false, csv: false })
const selected = ref([])

let searchTimer = null

const headers = [
  { title: 'Klien', key: 'nama_klien', minWidth: '200px' },
  { title: 'Tanggal / Invoice', key: 'tanggal_invoice', minWidth: '150px' },
  { title: 'Klasifikasi', key: 'classification', minWidth: '140px' },
  { title: 'Selisih', key: 'selisih', align: 'end', minWidth: '160px' },
  { title: 'Penyesuaian', key: 'adjustment_type', minWidth: '130px' },
  { title: 'Alasan', key: 'reason', minWidth: '280px' },
  { title: 'Status', key: 'review_status', minWidth: '120px' },
  { title: '', key: 'actions', sortable: false, align: 'end', minWidth: '150px' },
]

const classificationOptions = [
  { title: 'Butuh Review', value: 'REVIEW_REQUIRED' },
  { title: 'Akan Dibuat Baru', value: 'NEW_INVOICE' },
  { title: 'Update Aman', value: 'SAFE_UPDATE' },
  { title: 'Tanpa Perubahan', value: 'UNCHANGED' },
  { title: 'Ditolak', value: 'REJECTED' },
  { title: 'Semua', value: 'ALL' },
]

const CLASSIFICATION_META = {
  NEW_INVOICE: { label: 'Dibuat Baru', color: 'success' },
  SAFE_UPDATE: { label: 'Update Aman', color: 'info' },
  UNCHANGED: { label: 'Tanpa Perubahan', color: 'secondary' },
  REVIEW_REQUIRED: { label: 'Butuh Review', color: 'warning' },
  REJECTED: { label: 'Ditolak', color: 'error' },
}

const ADJUSTMENT_META = {
  CREDIT_NOTE: { label: 'Credit Note', color: 'error' },
  DEBIT_NOTE: { label: 'Debit Note', color: 'warning' },
  METADATA: { label: 'Metadata', color: 'secondary' },
}

const REVIEW_META = {
  PENDING: { label: 'Menunggu', color: 'warning' },
  SUBMITTED: { label: 'Diajukan', color: 'info' },
  DISMISSED: { label: 'Diabaikan', color: 'secondary' },
}

const RISK_LABELS = {
  PEMBAYARAN: 'sudah dibayar',
  NO_REFERENSI: 'ada no. referensi',
  BANK_MATCHED: 'cocok rekening koran',
  PENYESUAIAN: 'sudah ada CN/DN',
  STATUS_SEBAGIAN: 'status SEBAGIAN',
  LUNAS: 'status LUNAS',
  EB_LOCKED: 'periode terkunci',
  KOREKSI_PENDING: 'koreksi pending',
  PEMBAYARAN_MELEBIHI: 'bayar > tagihan baru',
}

const safeCount = computed(() => (progress.value?.cnt_new ?? 0) + (progress.value?.cnt_safe_update ?? 0))

const canApplySafe = computed(() => store.awaitingReview && safeCount.value > 0 && !busy.value)

const summaryCards = computed(() => {
  const p = progress.value ?? {}

  return [
    { label: 'Dibuat Baru', hint: 'Belum ada invoice-nya', icon: 'ri-add-circle-line', color: 'success', value: p.cnt_new ?? 0 },
    { label: 'Update Aman', hint: 'Belum tersentuh transaksi', icon: 'ri-refresh-line', color: 'info', value: p.cnt_safe_update ?? 0 },
    { label: 'Butuh Review', hint: 'Perlu CN/DN atau tinjauan', icon: 'ri-alert-line', color: 'warning', value: p.cnt_review_required ?? 0 },
    { label: 'Dilewati / Ditolak', hint: `${p.cnt_unchanged ?? 0} tanpa perubahan, ${p.cnt_rejected ?? 0} ditolak`, icon: 'ri-forbid-line', color: 'secondary', value: (p.cnt_unchanged ?? 0) + (p.cnt_rejected ?? 0) },
  ]
})

const statusAlert = computed(() => {
  const s = progress.value?.status

  if (s === 'failed') return { type: 'error', icon: 'ri-close-circle-line', title: 'Import gagal' }
  if (s === 'awaiting_review') return { type: 'warning', icon: 'ri-question-answer-line', title: 'Menunggu keputusan Anda' }
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

// Baris terpilih yang benar-benar masih bisa diputuskan.
const selectedPending = computed(() => selected.value.filter(i => i.review_status === 'PENDING'))
const selectedSubmittable = computed(() => selected.value.filter(canSubmit))

function canSubmit(item) {
  return item.review_status === 'PENDING'
    && (item.adjustment_type === 'CREDIT_NOTE' || item.adjustment_type === 'DEBIT_NOTE')
}

function classificationLabel(v) {
  return CLASSIFICATION_META[v]?.label ?? v
}

function classificationColor(v) {
  return CLASSIFICATION_META[v]?.color ?? 'secondary'
}

function adjustmentLabel(v) {
  return ADJUSTMENT_META[v]?.label ?? v
}

function adjustmentColor(v) {
  return ADJUSTMENT_META[v]?.color ?? 'secondary'
}

function reviewLabel(v) {
  return REVIEW_META[v]?.label ?? v
}

function reviewColor(v) {
  return REVIEW_META[v]?.color ?? 'secondary'
}

function riskLabel(v) {
  return RISK_LABELS[v] ?? v
}

function selisihClass(v) {
  if (Number(v) < 0) return 'text-error font-weight-medium'
  if (Number(v) > 0) return 'text-warning font-weight-medium'

  return 'text-medium-emphasis'
}

function formatMoney(v) {
  return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(v ?? 0))
}

function formatDate(v) {
  if (!v) return '—'

  return new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function onOptions(options) {
  store.review.page = options.page ?? store.review.page
  store.review.perPage = options.itemsPerPage ?? store.review.perPage
  store.fetchReview()
}

function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => store.fetchReview(1), 400)
}

function openImport() {
  minimizeStore.setMinimizedFalse(WIDGET_ID)

  if (busy.value) {
    showImport.value = true

    return
  }

  importFile.value = null
  store.reset()
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
  selected.value = []
  await store.applySafe()
}

async function decide(item, action) {
  await store.submitAdjustments([{ group_id: item.id, action }])
  selected.value = []
}

async function bulkDecide(action) {
  const rows = action === 'submit' ? selectedSubmittable.value : selectedPending.value

  await store.submitAdjustments(rows.map(r => ({ group_id: r.id, action })))
  selected.value = []
}

// Klasifikasi selesai → tutup dialog otomatis supaya user langsung melihat tabel review.
watch(() => progress.value?.status, status => {
  if (status === 'awaiting_review' && showImport.value && !busy.value) {
    setTimeout(() => { showImport.value = false }, 900)
  }
})

onMounted(() => {
  const widget = minimizeStore.widgets[WIDGET_ID]

  if (widget?.pendingRestore) {
    minimizeStore.clearPendingRestore(WIDGET_ID)
    minimizeStore.setMinimizedFalse(WIDGET_ID)
    showImport.value = true
  }
})
</script>
