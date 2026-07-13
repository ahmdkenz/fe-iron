<template>
  <div>
    <!-- Info Header -->
    <VCard class="mb-4" v-if="report.id">
      <VCardText>
        <div class="d-flex flex-wrap gap-4 align-center">
          <VChip v-if="report.bank_type && report.bank_type !== 'GENERAL'" :color="bankColor(report.bank_type)" variant="tonal" label>
            {{ report.bank_type }}
          </VChip>
          <div>
            <div class="text-caption text-medium-emphasis">Periode</div>
            <div class="text-body-2 font-weight-medium">{{ report.periode_awal }} — {{ report.periode_akhir }}</div>
          </div>
          <div>
            <div class="text-caption text-medium-emphasis">File</div>
            <div class="text-body-2">{{ report.nama_file }}</div>
          </div>
          <div>
            <div class="text-caption text-medium-emphasis">Diupload oleh</div>
            <div class="text-body-2">{{ report.uploaded_by }}</div>
          </div>
          <VSpacer />
          <div class="text-caption text-medium-emphasis text-right">
            {{ formatDateTime(report.created_at) }}
          </div>
          <VBtn variant="text" color="secondary" size="small" prepend-icon="ri-close-line" @click="$emit('close')">
            Tutup Detail
          </VBtn>
        </div>
      </VCardText>
    </VCard>

    <!-- Summary Cards -->
    <VRow class="mb-4">
      <VCol cols="6" sm="3">
        <VCard>
          <VCardText class="text-center">
            <div class="text-caption text-medium-emphasis">Total Transaksi</div>
            <div class="text-h5 font-weight-bold">{{ report.total_transaksi ?? 0 }}</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="6" sm="3">
        <VCard>
          <VCardText class="text-center">
            <div class="text-caption text-medium-emphasis">MATCHED</div>
            <div class="text-h5 font-weight-bold text-success">{{ report.jumlah_matched ?? 0 }}</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="6" sm="3">
        <VCard>
          <VCardText class="text-center">
            <div class="text-caption text-medium-emphasis">UNMATCHED</div>
            <div class="text-h5 font-weight-bold text-error">{{ report.jumlah_unmatched ?? 0 }}</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="6" sm="3">
        <VCard>
          <VCardText class="text-center">
            <div class="text-caption text-medium-emphasis">Total Kredit</div>
            <div class="text-h5 font-weight-bold text-primary">{{ formatCurrency(report.total_kredit ?? 0) }}</div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Filter Tabs + Table -->
    <VCard>
      <VCardText class="pb-0">
        <VBtnToggle :model-value="filterStatus" @update:model-value="onFilterChange" variant="outlined" mandatory divided density="compact">
          <VBtn value="SEMUA"     size="small" style="min-width: 80px">Semua</VBtn>
          <VBtn value="MATCHED"   size="small" style="min-width: 90px"><span class="text-success">MATCHED</span></VBtn>
          <VBtn value="UNMATCHED" size="small" style="min-width: 105px"><span class="text-error">UNMATCHED</span></VBtn>
        </VBtnToggle>
      </VCardText>
      <VDivider class="mt-3" />
      <VProgressLinear v-if="loading" indeterminate color="primary" />
      <BaseTable
        :headers="headers"
        :items="rows"
        :total="meta.total"
        :loading="loading"
        :per-page="perPage"
        :page="page"
        @update:options="onTableOptions"
      >
        <template #item.no="{ index }">
          {{ (page - 1) * perPage + index + 1 }}
        </template>
        <template #item.debit="{ item }">
          <span v-if="item.debit > 0" class="text-warning font-weight-medium">{{ formatCurrency(item.debit) }}</span>
          <span v-else class="text-disabled">-</span>
        </template>
        <template #item.kredit="{ item }">
          <span v-if="item.kredit > 0" class="text-success font-weight-medium">{{ formatCurrency(item.kredit) }}</span>
          <span v-else class="text-disabled">-</span>
        </template>
        <template #item.saldo="{ item }">
          {{ formatCurrency(item.saldo) }}
        </template>
        <template #item.status_cocok="{ item }">
          <VChip :color="statusColor(item.status_cocok)" size="x-small" variant="tonal" label>
            {{ item.status_cocok }}
          </VChip>
        </template>
        <template #item.no_referensi="{ item }">
          <span v-if="item.no_referensi" class="text-caption font-weight-medium text-primary">
            {{ item.no_referensi }}
          </span>
          <span v-else class="text-disabled">-</span>
        </template>

        <template #item.pembayaran="{ item }">
          <div v-if="item.pembayaran" class="text-caption">
            <div class="font-weight-medium">{{ item.pembayaran.no_referensi || '-' }}</div>
            <div class="text-medium-emphasis">{{ formatDate(item.pembayaran.tanggal_pembayaran) }}</div>
            <div class="text-medium-emphasis">{{ item.pembayaran.klien }}</div>
          </div>
          <span v-else class="text-disabled">-</span>
        </template>

        <template #item.selisih_bank="{ item }">
          <template v-if="item.selisih_bank !== null && item.selisih_bank !== undefined">
            <VChip v-if="item.selisih_bank === 0" color="success" size="x-small" variant="tonal">
              Rp 0
            </VChip>
            <span v-else :class="item.selisih_bank > 0 ? 'text-error font-weight-medium' : 'text-warning font-weight-medium'">
              {{ item.selisih_bank > 0 ? '+' : '-' }}{{ formatCurrency(Math.abs(item.selisih_bank)) }}
            </span>
          </template>
          <span v-else class="text-disabled">-</span>
        </template>

        <template #item.matched_by="{ item }">
          <span v-if="item.matched_by" class="text-caption font-weight-medium">{{ item.matched_by }}</span>
          <span v-else-if="item.status_cocok === 'MATCHED'" class="text-caption font-weight-medium">{{ report.uploaded_by }}</span>
          <span v-else class="text-disabled">-</span>
        </template>

        <template #item.kelebihan="{ item }">
          <div v-if="item.kelebihan_bayar?.sisa > 0" class="d-flex flex-column align-start gap-1">
            <span class="text-caption text-error font-weight-medium">
              {{ formatCurrency(item.kelebihan_bayar.sisa) }}
            </span>
            <AppActionButton v-if="item.can_manage_match" action="gunakan" label="Alokasikan / PDM" size="x-small" @click="openKelebihanDialog(item)" />
          </div>
          <div v-else-if="item.kelebihan_bayar?.total > 0" class="d-flex flex-column align-start gap-1">
            <VChip v-if="item.kelebihan_bayar?.pdm?.status === 'AKTIF'" size="x-small" color="deep-purple" variant="tonal">
              PDM
            </VChip>
            <VChip v-else size="x-small" color="success" variant="tonal">
              Teralokasi
            </VChip>
          </div>
          <span v-else class="text-disabled">-</span>
        </template>

        <template #item.aksi="{ item }">
          <div class="d-flex gap-1 align-center flex-wrap">
            <template v-if="item.status_cocok === 'UNMATCHED' || item.status_cocok === 'POSSIBLE'">
              <AppActionButton action="cocokkan" size="x-small" @click="openMatchDialog(item)" />
              <VBtn size="x-small" variant="text" color="grey" :loading="abaikanLoading === item.id" @click="doAbaikan(item)">
                Abaikan
              </VBtn>
            </template>
            <template v-else-if="item.status_cocok === 'MATCHED'">
              <AppActionButton v-if="item.can_manage_match" action="batalkan" icon="ri-link-unlink" size="x-small" :loading="unmatchLoading === item.id" @click="openUnmatchDialog(item)" />
              <AppActionButton
                v-if="item.can_manage_match && item.status_posting_2 !== 'POSTED'"
                action="custom"
                color="success"
                icon="ri-checkbox-circle-line"
                size="x-small"
                :loading="postingLoadingId === item.id"
                @click="openPostingDialog(item)"
              >
                Posting
              </AppActionButton>
              <VChip v-else-if="item.status_posting_2 === 'POSTED'" color="success" size="x-small" variant="tonal" label>
                <VIcon start size="12">ri-check-line</VIcon>Sudah Posting
              </VChip>
            </template>
          </div>
        </template>
      </BaseTable>
    </VCard>


    <!-- ── Dialog: Konfirmasi Batalkan Cocok ── -->
    <VDialog v-model="unmatchDialog" max-width="400" persistent>
      <VCard>
        <VCardTitle class="pa-4 pb-2"><span class="text-h6">Batalkan Cocok Transaksi</span></VCardTitle>
        <VDivider />
        <VCardText class="pa-4">
          <p class="text-body-2 mb-0">
            Apakah Anda yakin ingin membatalkan cocok transaksi ini?
            Status akan kembali ke <strong>UNMATCHED</strong>.
          </p>
        </VCardText>
        <VDivider />
        <VCardActions class="pa-4">
          <VSpacer />
          <AppActionButton action="batalkan" @click="unmatchDialog = false" />
          <AppActionButton action="custom" color="error" :loading="unmatchSaving" @click="doUnmatch">Ya, Batalkan</AppActionButton>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- ── Dialog: Konfirmasi Posting Jurnal ── -->
    <VDialog v-model="postingDialog" max-width="420" persistent>
      <VCard>
        <VCardTitle class="pa-4 pb-2"><span class="text-h6">Konfirmasi Posting</span></VCardTitle>
        <VDivider />
        <VCardText class="pa-4">
          <p class="text-body-2 mb-1">Posting transaksi berikut ke jurnal Rekening Koran?</p>
          <p class="text-body-2 font-weight-bold mb-0">{{ postingTarget?.no_referensi ?? '-' }}</p>
        </VCardText>
        <VDivider />
        <VCardActions class="pa-4">
          <VSpacer />
          <AppActionButton action="batalkan" @click="postingDialog = false" />
          <AppActionButton action="custom" color="success" icon="ri-checkbox-circle-line" :loading="postingSaving" @click="doPosting">Ya, Posting</AppActionButton>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Dialog Cocokkan & Kelebihan Bayar — dimuat async, hanya saat dibuka -->
    <MatchDialog
      v-if="matchDialog"
      v-model="matchDialog"
      :item="selectedItem"
      @matched="onMatched"
      @connection-error="onMatchConnectionError"
    />
    <KelebihanDialog
      v-if="kelebihanDialog"
      v-model="kelebihanDialog"
      :item="kelebihanItem"
      @changed="onKelebihanChanged"
    />

  </div>
</template>

<script setup>
import { defineAsyncComponent, reactive, ref, watch } from 'vue'
import { useFormatter } from '@/composables/useFormatter'
import { useSweetAlert } from '@/composables/useSweetAlert'
import api from '@/utils/axios'

const MatchDialog     = defineAsyncComponent(() => import('../components/MatchDialog.vue'))
const KelebihanDialog = defineAsyncComponent(() => import('../components/KelebihanDialog.vue'))

const props = defineProps({
  reportId: { type: [Number, String], required: true },
})

const emit = defineEmits(['close'])

const { formatCurrency, formatDate, formatDateTime } = useFormatter()
const { showSuccess, showError } = useSweetAlert()

const loading = ref(false)
const report  = reactive({
  id: null, bank_type: null, nama_file: null,
  periode_awal: null, periode_akhir: null,
  total_transaksi: 0, total_kredit: 0,
  jumlah_matched: 0, jumlah_unmatched: 0,
  uploaded_by: null, created_at: null,
})

const rows = ref([])
const meta = reactive({ current_page: 1, per_page: 25, total: 0, last_page: 1 })

const filterStatus    = ref('SEMUA')
const page            = ref(1)
const perPage         = ref(25)
const abaikanLoading  = ref(null)
const unmatchLoading  = ref(null)
let fetchRowsAbort    = null

// ── Match dialog — komponen async MatchDialog ──
const matchDialog  = ref(false)
const selectedItem = ref(null)

// ── Unmatch dialog ──
const unmatchDialog  = ref(false)
const unmatchItem    = ref(null)
const unmatchSaving  = ref(false)

// ── Kelebihan dialog — komponen async KelebihanDialog ──
const kelebihanDialog = ref(false)
const kelebihanItem   = ref(null)

// ── Posting dialog ──
const postingLoadingId = ref(null)
const postingDialog    = ref(false)
const postingTarget    = ref(null)
const postingSaving    = ref(false)

function onFilterChange(status) {
  filterStatus.value = status
  page.value = 1
  fetchRows()
}

function onTableOptions({ page: p, itemsPerPage }) {
  page.value    = p
  perPage.value = itemsPerPage
  fetchRows()
}

const bankColor   = (t) => ({ BCA: 'info', MANDIRI: 'warning', BNI: 'error', BRI: 'primary', CIMB: 'deep-purple', BSI: 'green' }[t] ?? 'secondary')
const statusColor = (s) => ({ MATCHED: 'success', POSSIBLE: 'warning', UNMATCHED: 'error', DIABAIKAN: 'grey' }[s] ?? 'grey')

const headers = [
  { title: 'No',             key: 'no',            sortable: false, width: '50px' },
  { title: 'Tanggal',        key: 'tanggal',       sortable: false, width: '110px' },
  { title: 'Keterangan',     key: 'keterangan',    sortable: false },
  { title: 'No Ref Bank',    key: 'no_referensi',  sortable: false, width: '140px' },
  { title: 'Debit',          key: 'debit',         sortable: false, align: 'end' },
  { title: 'Kredit',         key: 'kredit',        sortable: false, align: 'end' },
  { title: 'Saldo',          key: 'saldo',         sortable: false, align: 'end' },
  { title: 'Status',         key: 'status_cocok',  sortable: false, width: '110px' },
  { title: 'Cocok Dengan',   key: 'pembayaran',    sortable: false },
  { title: 'Selisih',        key: 'selisih_bank',  sortable: false, width: '90px', align: 'center' },
  { title: 'Dicocokkan Oleh',key: 'matched_by',    sortable: false, width: '130px' },
  { title: 'Kelebihan',      key: 'kelebihan',     sortable: false, width: '120px' },
  { title: 'Aksi',           key: 'aksi',          sortable: false, width: '160px' },
]

async function fetchRows() {
  fetchRowsAbort?.abort()
  const controller = new AbortController()
  fetchRowsAbort = controller
  loading.value = true
  try {
    const { data } = await api.get(`/finance/rekonsiliasi-bank/${props.reportId}/details`, {
      params: { status: filterStatus.value, page: page.value, per_page: perPage.value },
      signal: controller.signal,
    })
    Object.assign(report, data.data.header)
    rows.value = data.data.rows
    Object.assign(meta, data.data.meta)
  } catch (err) {
    if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return
    throw err
  } finally {
    if (fetchRowsAbort === controller) {
      loading.value    = false
      fetchRowsAbort = null
    }
  }
}

function loadReport() {
  filterStatus.value = 'SEMUA'
  page.value = 1
  fetchRows()
}

watch(() => props.reportId, loadReport, { immediate: true })

async function doAbaikan(item) {
  abaikanLoading.value = item.id
  try {
    await api.patch(`/finance/rekonsiliasi-bank/detail/${item.id}/abaikan`)
    await fetchRows()
  } finally {
    abaikanLoading.value = null
  }
}

// ── Manual Match ──
function openMatchDialog(item) {
  selectedItem.value = item
  matchDialog.value  = true
}

async function onMatched() {
  showSuccess('Pembayaran berhasil dicatat.')
  await fetchRows()
}

async function onMatchConnectionError(message) {
  await fetchRows()
  showError(message)
}

// ── Unmatch ──
function openUnmatchDialog(item) {
  unmatchItem.value   = item
  unmatchDialog.value = true
}

async function doUnmatch() {
  if (!unmatchItem.value) return
  unmatchSaving.value  = true
  unmatchLoading.value = unmatchItem.value.id
  try {
    await api.patch(`/finance/rekonsiliasi-bank/detail/${unmatchItem.value.id}/unmatch`)
    unmatchDialog.value  = false
    unmatchItem.value    = null
    showSuccess('Pencocokan berhasil dibatalkan.')
    await fetchRows()
  } catch (err) {
    unmatchDialog.value = false
    unmatchItem.value   = null
    if (!err?.response || err?.code === 'ECONNABORTED') {
      // Koneksi terputus/timeout: server mungkin sudah memproses. Muat ulang data
      // otoritatif agar status baris sesuai kondisi sebenarnya.
      await fetchRows()
      showError('Koneksi terputus. Data telah dimuat ulang — silakan periksa status transaksi.')
    } else {
      showError(err?.response?.data?.message ?? 'Gagal membatalkan pencocokan, coba lagi.')
    }
  } finally {
    unmatchSaving.value  = false
    unmatchLoading.value = null
  }
}

// ── Posting ──
function openPostingDialog(item) {
  postingTarget.value = item
  postingDialog.value = true
}

async function doPosting() {
  postingSaving.value    = true
  postingLoadingId.value = postingTarget.value.id
  try {
    await api.patch(`/finance/rekening-koran/${postingTarget.value.id}/posting`, {
      status_posting_2: 'POSTED',
    })
    postingDialog.value = false
    await fetchRows()
  } finally {
    postingSaving.value    = false
    postingLoadingId.value = null
  }
}

// ── Kelebihan Bayar ──
function openKelebihanDialog(item) {
  kelebihanItem.value   = item
  kelebihanDialog.value = true
}

async function onKelebihanChanged(itemId) {
  await fetchRows()
  const updatedItem = rows.value.find(d => d.id === itemId)
  if (updatedItem) kelebihanItem.value = updatedItem
}
</script>
