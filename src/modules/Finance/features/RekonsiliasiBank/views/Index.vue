<template>
  <div>
    <PageHeader
      title="Rekonsiliasi Bank"
      subtitle="Cocokkan mutasi rekening dengan data pembayaran secara otomatis maupun manual."
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Rekonsiliasi Bank', disabled: true },
      ]"
    >
      <template #default="{ mobile }">
        <div
          class="d-flex align-center gap-2"
          :class="{ 'w-100': mobile }"
        >
          <ReportPickerSelect
            v-model="selectedReportId"
            :reports="reportItems"
            :loading="reportsLoading"
            :class="{ 'flex-grow-1': mobile }"
          />
          <UploadFlow
            v-if="!authStore.isArOnly && !authStore.isApOnly"
            @imported="onImported"
          />
        </div>
      </template>
    </PageHeader>

    <template v-if="selectedReportId">
      <StatCards :report="report" />
      <ProgressCard :report="report" />

      <VTabs
        v-model="activeTab"
        class="mb-4"
      >
        <VTab value="transaksi">
          Transaksi Bank
        </VTab>
        <VTab value="belum-cocok">
          Belum Cocok
          <VChip
            size="x-small"
            class="ms-2"
          >
            {{ report.jumlah_unmatched ?? 0 }}
          </VChip>
        </VTab>
        <VTab value="sudah-cocok">
          Sudah Cocok
          <VChip
            size="x-small"
            class="ms-2"
          >
            {{ report.jumlah_matched ?? 0 }}
          </VChip>
        </VTab>
        <VTab value="riwayat">
          Riwayat Upload
        </VTab>
      </VTabs>

      <UploadHistoryTable
        v-show="activeTab === 'riwayat'"
        :reports="reportItems"
        :total="reportsTotal"
        :loading="reportsLoading"
        :loading-more="reportsLoadingMore"
        :has-more="reportsHasMore"
        :selected-report-id="selectedReportId"
        :deletable="!authStore.isArOnly && !authStore.isApOnly"
        @select-report="onSelectReport"
        @delete="confirmDelete"
        @load-more="loadMoreReports"
      />

      <!--
        v-show (bukan v-if/v-else) sengaja dipakai supaya TransactionTable
        TIDAK di-unmount saat pindah ke tab Riwayat Upload lalu kembali —
        instance & cache internalnya (per status) tetap hidup, jadi kembali
        ke Transaksi Bank/Belum Cocok/Sudah Cocok tidak selalu fetch ulang.
      -->
      <div v-show="activeTab !== 'riwayat'">
        <VRow v-if="!xs">
          <VCol
            cols="12"
            :md="desktopDetailOpen ? 8 : 12"
          >
            <TransactionTable
              ref="transactionTableRef"
              :key="selectedReportId"
              :report-id="selectedReportId"
              :status="filterStatus"
              :selected-id="selectedItem?.id"
              :can-process-row="canProcessRow"
              :uploaded-by="report.uploaded_by"
              :abaikan-loading-id="abaikanLoadingId"
              :unmatch-loading-id="unmatchLoadingId"
              @select-row="onSelectRow"
              @cocokkan="openMatchDialog"
              @abaikan="doAbaikan"
              @unmatch="openUnmatchDialog"
              @kelebihan="openKelebihanDialog"
              @options-change="resetDesktopDetailPosition"
            />
          </VCol>
          <VCol
            v-if="desktopDetailOpen"
            cols="12"
            md="4"
            class="rekon-detail-col"
          >
            <div
              ref="detailTrackRef"
              class="rekon-detail-track"
              :style="desktopDetailRequiredHeight ? { '--detail-required-height': `${desktopDetailRequiredHeight}px` } : undefined"
            >
              <div
                ref="detailFollowRef"
                class="rekon-detail-follow"
                :style="{ top: `${desktopDetailOffset}px` }"
              >
                <DetailPanel
                  :item="selectedItem"
                  :uploaded-by="report.uploaded_by"
                  :can-process-row="canProcessRow"
                  :abaikan-loading-id="abaikanLoadingId"
                  :unmatch-loading-id="unmatchLoadingId"
                  @close="desktopDetailOpen = false"
                  @cocokkan="openMatchDialog"
                  @abaikan="doAbaikan"
                  @unmatch="openUnmatchDialog"
                  @kelebihan="openKelebihanDialog"
                />
              </div>
            </div>
          </VCol>
        </VRow>

        <template v-else>
          <TransactionTable
            ref="transactionTableRef"
            :key="selectedReportId"
            :report-id="selectedReportId"
            :status="filterStatus"
            :selected-id="selectedItem?.id"
            :can-process-row="canProcessRow"
            :uploaded-by="report.uploaded_by"
            :abaikan-loading-id="abaikanLoadingId"
            :unmatch-loading-id="unmatchLoadingId"
            @select-row="onSelectRow"
            @cocokkan="openMatchDialog"
            @abaikan="doAbaikan"
            @unmatch="openUnmatchDialog"
            @kelebihan="openKelebihanDialog"
          />
          <VBottomSheet v-model="mobileDetailOpen">
            <DetailPanel
              compact
              :item="selectedItem"
              :uploaded-by="report.uploaded_by"
              :can-process-row="canProcessRow"
              :abaikan-loading-id="abaikanLoadingId"
              :unmatch-loading-id="unmatchLoadingId"
              @close="mobileDetailOpen = false"
              @cocokkan="openMatchDialog"
              @abaikan="doAbaikan"
              @unmatch="openUnmatchDialog"
              @kelebihan="openKelebihanDialog"
            />
          </VBottomSheet>
        </template>
      </div>
    </template>

    <VCard v-else-if="!reportsLoading">
      <VCardText class="text-center py-8 text-medium-emphasis">
        Belum ada laporan rekening koran yang diupload.
      </VCardText>
    </VCard>

    <!-- Dialog Cocokkan & Kelebihan Bayar — dimuat async, hanya saat dibuka -->
    <MatchDialog
      v-if="matchDialog"
      v-model="matchDialog"
      :item="matchItem"
      @matched="onMatched"
      @connection-error="onMatchConnectionError"
    />
    <ApMatchDialog
      v-if="apMatchDialog"
      v-model="apMatchDialog"
      :item="matchItem"
      @matched="onMatched"
      @connection-error="onMatchConnectionError"
    />
    <KelebihanDialog
      v-if="kelebihanDialog"
      v-model="kelebihanDialog"
      :item="kelebihanItem"
      @changed="onKelebihanChanged"
    />

    <!-- Dialog Konfirmasi Batalkan Cocok -->
    <VDialog
      v-model="unmatchDialog"
      max-width="400"
      persistent
    >
      <VCard>
        <VCardTitle class="pa-4 pb-2">
          <span class="text-h6">Batalkan Cocok Transaksi</span>
        </VCardTitle>
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
          <AppActionButton
            action="batalkan"
            @click="unmatchDialog = false"
          />
          <AppActionButton
            action="custom"
            color="error"
            :loading="unmatchSaving"
            @click="doUnmatch"
          >
            Ya, Batalkan
          </AppActionButton>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Dialog Konfirmasi Hapus Laporan -->
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
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useLoadMore } from '@/composables/useLoadMore.js'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/utils/axios'
import ReportPickerSelect from '../components/ReportPickerSelect.vue'
import StatCards from '../components/StatCards.vue'
import ProgressCard from '../components/ProgressCard.vue'
import TransactionTable from '../components/TransactionTable.vue'
import DetailPanel from '../components/DetailPanel.vue'
import UploadHistoryTable from '../components/UploadHistoryTable.vue'
import UploadFlow from '../components/UploadFlow.vue'

const MatchDialog     = defineAsyncComponent(() => import('../components/MatchDialog.vue'))
const ApMatchDialog   = defineAsyncComponent(() => import('../components/ApMatchDialog.vue'))
const KelebihanDialog = defineAsyncComponent(() => import('../components/KelebihanDialog.vue'))

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const { xs } = useDisplay()
const { showSuccess, showError } = useSweetAlert()

const {
  items: reportItems, loading: reportsLoading, loadingMore: reportsLoadingMore,
  hasMore: reportsHasMore, total: reportsTotal,
  reset: resetReports, loadMore: loadMoreReports, abort: abortReports,
} = useLoadMore('/finance/rekonsiliasi-bank', { perPage: 20 })

const selectedReportId  = ref(null)
const activeTab         = ref('transaksi')
const selectedItem      = ref(null)
const mobileDetailOpen  = ref(false)
const desktopDetailOpen = ref(true)
const transactionTableRef = ref(null)
const detailTrackRef    = ref(null)
const detailFollowRef   = ref(null)
const desktopDetailOffset = ref(0)
const desktopDetailRequiredHeight = ref(0)

const report = reactive({
  id: null, bank_type: null, nama_file: null,
  periode_awal: null, periode_akhir: null,
  total_transaksi: 0, total_kredit: 0,
  jumlah_matched: 0, jumlah_unmatched: 0,
  uploaded_by: null, created_at: null,
})

const filterStatus = computed(() => ({
  transaksi: 'SEMUA',
  'belum-cocok': 'UNMATCHED',
  'sudah-cocok': 'MATCHED',
}[activeTab.value] ?? 'SEMUA'))

const abaikanLoadingId = ref(null)
const unmatchLoadingId = ref(null)

const matchItem     = ref(null)
const matchDialog   = ref(false)
const apMatchDialog = ref(false)

const unmatchDialog = ref(false)
const unmatchItem   = ref(null)
const unmatchSaving = ref(false)

const kelebihanDialog = ref(false)
const kelebihanItem   = ref(null)

const deleteDialog = ref(false)
const deleteTarget = ref(null)
const deleting     = ref(false)

// PIC AR murni cuma boleh proses baris kredit (invoice/PDM AR), PIC AP murni
// cuma boleh proses baris debit (Payment Voucher AP). Admin/Manager/Supervisor
// bebas keduanya. Backend menegakkan aturan yang sama — ini cuma lapisan UI
// supaya tombol yang tidak relevan tidak ditampilkan.
function canProcessRow(item) {
  if (authStore.isArOnly) return Number(item.kredit) > 0
  if (authStore.isApOnly) return Number(item.debit) > 0

  return true
}

async function fetchHeader(id) {
  const { data } = await api.get(`/finance/rekonsiliasi-bank/${id}/header`)

  Object.assign(report, data.data)
}

async function refreshAfterRowChange() {
  return Promise.all([
    transactionTableRef.value?.refresh(),
    fetchHeader(selectedReportId.value),
  ])
}

function syncDesktopDetailOffset(event) {
  const rowEl = event?.currentTarget
  const trackEl = detailTrackRef.value
  if (!rowEl || !trackEl) {
    desktopDetailOffset.value = 0

    return
  }

  const rowRect = rowEl.getBoundingClientRect()
  const trackRect = trackEl.getBoundingClientRect()

  desktopDetailOffset.value = Math.max(0, Math.round(rowRect.top - trackRect.top))
}

// Dipanggil tiap kali daftar baris di kiri berubah susunan/isinya (ganti
// laporan, tab, halaman, atau items-per-page) — offset lama sudah tidak
// merujuk baris manapun yang valid, jadi panel harus kembali sejajar
// puncak track (bukan nyangkut di posisi baris yang sudah tidak terlihat).
function resetDesktopDetailPosition() {
  desktopDetailOffset.value = 0
}

// rekon-detail-track diberi tinggi minimum = offset baris + tinggi panel,
// supaya saat baris yang diklik dekat dasar tabel (mis. baris 100), track
// otomatis punya ruang untuk menampung panel sepenuhnya alih-alih panel
// meluber ke luar kolom kanan tanpa area yang bisa di-scroll ke sana.
// CSS menggabungkan angka ini dengan floor `100%` lewat max(), jadi tetap
// aman ketika belum ada baris terpilih (angka ini 0).
watch([selectedItem, desktopDetailOffset], async () => {
  if (xs.value || !selectedItem.value) {
    desktopDetailRequiredHeight.value = 0

    return
  }

  await nextTick()
  const followEl = detailFollowRef.value

  desktopDetailRequiredHeight.value = followEl
    ? desktopDetailOffset.value + followEl.offsetHeight
    : 0
})

function onSelectRow(payload) {
  const item = payload?.item ?? payload

  selectedItem.value = item
  desktopDetailOpen.value = true
  if (!xs.value) syncDesktopDetailOffset(payload?.event)
  if (xs.value) mobileDetailOpen.value = true
}

function onSelectReport(item) {
  selectedReportId.value = item.id
  activeTab.value = 'transaksi'
}

async function onImported(reportId) {
  await resetReports()
  activeTab.value = 'transaksi'
  if (reportId) selectedReportId.value = reportId
}

function openMatchDialog(item) {
  matchItem.value = item
  if (Number(item.debit) > 0) {
    apMatchDialog.value = true
  } else {
    matchDialog.value = true
  }
}

async function onMatched() {
  showSuccess('Pembayaran berhasil dicatat.')
  await refreshAfterRowChange()
}

async function onMatchConnectionError(message) {
  await refreshAfterRowChange()
  showError(message)
}

function openUnmatchDialog(item) {
  unmatchItem.value   = item
  unmatchDialog.value = true
}

async function doUnmatch() {
  if (!unmatchItem.value) return
  unmatchSaving.value  = true
  unmatchLoadingId.value = unmatchItem.value.id
  try {
    await api.patch(`/finance/rekonsiliasi-bank/detail/${unmatchItem.value.id}/unmatch`)
    unmatchDialog.value  = false
    unmatchItem.value    = null
    showSuccess('Pencocokan berhasil dibatalkan.')
    await refreshAfterRowChange()
  } catch (err) {
    unmatchDialog.value = false
    unmatchItem.value   = null
    if (!err?.response || err?.code === 'ECONNABORTED') {
      await refreshAfterRowChange()
      showError('Koneksi terputus. Data telah dimuat ulang — silakan periksa status transaksi.')
    } else {
      showError(err?.response?.data?.message ?? 'Gagal membatalkan pencocokan, coba lagi.')
    }
  } finally {
    unmatchSaving.value  = false
    unmatchLoadingId.value = null
  }
}

async function doAbaikan(item) {
  abaikanLoadingId.value = item.id
  try {
    await api.patch(`/finance/rekonsiliasi-bank/detail/${item.id}/abaikan`)
    await refreshAfterRowChange()
  } finally {
    abaikanLoadingId.value = null
  }
}

function openKelebihanDialog(item) {
  kelebihanItem.value   = item
  kelebihanDialog.value = true
}

async function onKelebihanChanged(itemId) {
  await refreshAfterRowChange()

  const updatedItem = transactionTableRef.value?.rows?.find(d => d.id === itemId)
  if (updatedItem) {
    kelebihanItem.value = updatedItem
    if (selectedItem.value?.id === itemId) selectedItem.value = updatedItem
  }
}

function confirmDelete(item) {
  deleteTarget.value = item
  deleteDialog.value = true
}

async function doDelete() {
  deleting.value = true
  try {
    await api.delete(`/finance/rekonsiliasi-bank/${deleteTarget.value.id}`)

    const wasSelected = selectedReportId.value === deleteTarget.value.id

    deleteDialog.value = false
    await resetReports()
    if (wasSelected) {
      selectedItem.value = null
      selectedReportId.value = reportItems.value[0]?.id ?? null
    }
  } finally {
    deleting.value = false
  }
}

watch(selectedReportId, async id => {
  selectedItem.value = null
  mobileDetailOpen.value = false
  desktopDetailOpen.value = true
  resetDesktopDetailPosition()
  router.replace({ query: { ...route.query, report: id ?? undefined } })
  if (id) await fetchHeader(id)
})

watch(activeTab, tab => {
  router.replace({ query: { ...route.query, tab } })
  resetDesktopDetailPosition()
})

onMounted(async () => {
  await resetReports()
  selectedReportId.value = route.query.report
    ? Number(route.query.report)
    : (reportItems.value[0]?.id ?? null)
  if (route.query.tab) activeTab.value = route.query.tab
})

onBeforeUnmount(() => {
  abortReports()
})
</script>

<style scoped>
.rekon-detail-col {
  position: relative;
}

.rekon-detail-track {
  position: relative;
  /* Floor 100% (biar kolom kanan minimal setinggi tabel kiri) digabung
     dengan kebutuhan aktual (offset baris + tinggi panel) lewat max() —
     jadi track selalu cukup tinggi untuk menampung panel di posisi manapun
     tanpa perlu tahu tinggi kolom kiri dari sisi JS. */
  min-height: max(100%, var(--detail-required-height, 0px));
}

.rekon-detail-follow {
  position: absolute;
  inset-inline-start: 0;
  width: 100%;
  transition: top 0.12s ease;
}
</style>
