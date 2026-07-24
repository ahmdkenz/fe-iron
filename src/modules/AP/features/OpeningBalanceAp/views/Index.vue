<template>
  <div>
    <PageHeader
      title="Opening Balance AP"
      subtitle="Saldo awal hutang vendor"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Opening Balance AP', disabled: true }
      ]"
    >
      <VBtn
        color="secondary"
        variant="tonal"
        prepend-icon="ri-download-2-line"
        class="me-2"
        :loading="exportingExcel"
        @click="exportExcel"
      >
        Export Excel
      </VBtn>
      <VBtn
        v-if="authStore.canOperateOpeningBalanceAp"
        color="primary"
        prepend-icon="ri-add-line"
        :to="{ name: 'ap-opening-balance-create' }"
      >
        Buat Opening Balance
      </VBtn>
    </PageHeader>

    <ApSummaryInsights
      :cards="summaryCards"
      :summary="summary"
      show-approval-breakdown
      detail-route-name="ap-opening-balance-show"
      noun="OB"
      due-soon-title="OB Jatuh Tempo Terdekat"
    />

    <VCard>
      <VCardText class="d-flex flex-wrap align-center gap-3 pb-0">
        <VTextField
          v-model="params.search"
          placeholder="Cari no. OB / vendor..."
          clearable
          hide-details
          density="compact"
          style="max-width: 220px"
          prepend-inner-icon="ri-search-line"
          @update:model-value="debouncedFetch"
        />
        <VTextField
          v-model="dateDraft.tanggal_dari"
          label="Dari Tanggal"
          type="date"
          clearable
          hide-details
          density="compact"
          style="max-width: 160px"
        />
        <VTextField
          v-model="dateDraft.tanggal_sampai"
          label="Sampai Tanggal"
          type="date"
          clearable
          hide-details
          density="compact"
          style="max-width: 160px"
        />
        <VBtn
          color="primary"
          variant="tonal"
          prepend-icon="ri-filter-3-line"
          @click="applyFilter"
        >
          Filter
        </VBtn>
        <VBtn
          variant="text"
          prepend-icon="ri-refresh-line"
          @click="resetFilters"
        >
          Reset
        </VBtn>
      </VCardText>

      <BaseTable
        :headers="headers"
        :items="items"
        :total="total"
        :loading="loading"
        pagination-mode="load-more"
        :has-more="hasMore"
        :loading-more="loadingMore"
        :loaded-count="items.length"
        column-resize-key="ap-opening-balance-index"
        class="mt-2"
        @load-more="loadMore"
      >
        <template #item.no="{ index }">
          {{ index + 1 }}
        </template>
        <template #item.no_tagihan="{ item }">
          <VChip
            color="primary"
            size="small"
            variant="tonal"
            label
          >
            {{ item.no_tagihan }}
          </VChip>
          <VIcon
            v-if="item.is_eb_ap_locked"
            icon="ri-lock-line"
            size="14"
            color="warning"
            class="ms-1"
          >
            <VTooltip activator="parent">
              Periode opening balance ini sudah dikunci di Ending Balance AP — tidak dapat diedit
            </VTooltip>
          </VIcon>
        </template>
        <template #item.vendor_ap="{ item }">
          <div>
            <div>{{ item.vendor_ap?.nama_vendor ?? '-' }}</div>
            <div
              v-if="item.vendor_ap?.kode_vendor"
              class="text-caption text-medium-emphasis"
            >
              {{ item.vendor_ap.kode_vendor }}
            </div>
          </div>
        </template>
        <template #item.tanggal_tagihan="{ item }">
          <div>
            <div>{{ formatDate(item.tanggal_tagihan) }}</div>
            <div class="text-caption text-medium-emphasis">
              Jatuh tempo: {{ item.tanggal_jatuh_tempo ? formatDate(item.tanggal_jatuh_tempo) : '-' }}
            </div>
          </div>
        </template>
        <template #item.total_tagihan="{ item }">
          {{ formatCurrency(item.total_tagihan) }}
        </template>
        <template #item.sisa_tagihan="{ item }">
          <span :class="item.sisa_tagihan > 0 ? 'text-error' : 'text-success'">
            {{ formatCurrency(item.sisa_tagihan) }}
          </span>
        </template>
        <template #item.status="{ item }">
          <TagihanApStatusBadge :status="item.status" />
        </template>
        <template #item.approval_status="{ item }">
          <ApprovalStatusBadge :status="item.approval_status" />
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex gap-1 justify-center">
            <VBtn
              icon
              size="small"
              variant="text"
              color="info"
              :to="{ name: 'ap-opening-balance-show', params: { id: item.id } }"
            >
              <VIcon
                icon="ri-eye-line"
                size="18"
              />
              <VTooltip activator="parent">
                Detail
              </VTooltip>
            </VBtn>
            <VBtn
              v-if="item.can_print"
              icon
              size="small"
              variant="text"
              color="secondary"
              :loading="printingId === item.id"
              @click="printOpeningBalance(item.id)"
            >
              <VIcon
                icon="ri-printer-line"
                size="18"
              />
              <VTooltip activator="parent">
                Cetak
              </VTooltip>
            </VBtn>
            <VBtn
              v-if="item.approval_status === 'PENDING' && authStore.canApproveOpeningBalanceAp"
              icon
              size="small"
              variant="text"
              color="success"
              :loading="approvingId === item.id"
              @click="confirmApprove(item)"
            >
              <VIcon
                icon="ri-checkbox-circle-line"
                size="18"
              />
              <VTooltip activator="parent">
                Approve
              </VTooltip>
            </VBtn>
            <VBtn
              v-if="item.approval_status === 'PENDING' && authStore.canApproveOpeningBalanceAp"
              icon
              size="small"
              variant="text"
              color="error"
              :loading="rejectingId === item.id"
              @click="confirmReject(item)"
            >
              <VIcon
                icon="ri-close-circle-line"
                size="18"
              />
              <VTooltip activator="parent">
                Tolak
              </VTooltip>
            </VBtn>
            <VBtn
              v-if="item.can_edit && authStore.canOperateOpeningBalanceAp"
              icon
              size="small"
              variant="text"
              color="primary"
              :to="{ name: 'ap-opening-balance-edit', params: { id: item.id } }"
            >
              <VIcon
                icon="ri-pencil-line"
                size="18"
              />
              <VTooltip activator="parent">
                Edit
              </VTooltip>
            </VBtn>
            <VBtn
              v-if="item.can_resubmit && authStore.canOperateOpeningBalanceAp"
              icon
              size="small"
              variant="text"
              color="warning"
              :loading="resubmittingId === item.id"
              @click="confirmResubmit(item)"
            >
              <VIcon
                icon="ri-send-plane-line"
                size="18"
              />
              <VTooltip activator="parent">
                Ajukan Ulang
              </VTooltip>
            </VBtn>
          </div>
        </template>
      </BaseTable>
    </VCard>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useAuthStore } from '@/stores/auth.store'
import { useLoadMore } from '@/composables/useLoadMore.js'
import { useFormatter } from '@/composables/useFormatter'
import api from '@/utils/axios'
import { readBlobError } from '@/utils/readBlobError'
import TagihanApStatusBadge from '../../TagihanAp/components/TagihanApStatusBadge.vue'
import ApprovalStatusBadge from '@/modules/Finance/shared/components/ApprovalStatusBadge.vue'
import ApSummaryInsights from '@/modules/AP/shared/components/ApSummaryInsights.vue'
import { getCurrentMonthRange } from '@/modules/AP/shared/utils/dateRange'

const authStore = useAuthStore()
const { showAlert, showSuccess, showError, resolveThemeTokens } = useSweetAlert()
const { formatCurrency, formatDate } = useFormatter()

const {
  items, loading, loadingMore, hasMore, total, params, reset, loadMore, abort,
} = useLoadMore('/ap/opening-balance', { perPage: 25 })

const dateDraft = reactive(getCurrentMonthRange())

Object.assign(params, dateDraft)

const summary = reactive({
  total_tagihan: null,
  total_nominal: null,
  total_pembayaran: null,
  total_sisa: null,
  payment_rate_pct: null,
  outstanding_count: null,
  overdue_count: 0,
  overdue_amount: 0,
  due_soon_count: 0,
  due_soon_amount: 0,
  status_breakdown: [],
  approval_breakdown: [],
  top_vendors: [],
  due_soon: [],
})

function approvalCount(status) {
  return summary.approval_breakdown.find(row => row.approval_status === status)?.jumlah ?? 0
}

const summaryCards = computed(() => [
  {
    key: 'saldo_awal',
    label: 'Saldo Awal',
    value: formatCurrency(summary.total_nominal),
    icon: 'ri-history-line',
    color: 'primary',
  },
  {
    key: 'outstanding',
    label: 'Outstanding',
    value: summary.outstanding_count ?? '-',
    sub: summary.total_sisa != null ? formatCurrency(summary.total_sisa) : null,
    icon: 'ri-error-warning-line',
    color: 'error',
  },
  {
    key: 'pending',
    label: 'Menunggu Persetujuan',
    value: approvalCount('PENDING'),
    icon: 'ri-time-line',
    color: 'warning',
  },
  {
    key: 'rejected',
    label: 'Ditolak',
    value: approvalCount('REJECTED'),
    sub: approvalCount('REJECTED') ? 'Perlu diajukan ulang' : null,
    subColor: 'error',
    icon: 'ri-close-circle-line',
    color: 'secondary',
  },
])

const exportingExcel = ref(false)

const headers = [
  { title: 'No', key: 'no', sortable: false, width: '60px' },
  { title: 'No. OB', key: 'no_tagihan', sortable: false, minWidth: '170px' },
  { title: 'Vendor', key: 'vendor_ap', sortable: false, minWidth: '200px' },
  { title: 'Tanggal', key: 'tanggal_tagihan', sortable: false, minWidth: '120px' },
  { title: 'Saldo Awal', key: 'total_tagihan', sortable: false, minWidth: '150px' },
  { title: 'Sisa', key: 'sisa_tagihan', sortable: false, minWidth: '150px' },
  { title: 'Status', key: 'status', sortable: false, minWidth: '120px' },
  { title: 'Approval', key: 'approval_status', sortable: false, minWidth: '150px' },
  { title: 'Aksi', key: 'actions', sortable: false, align: 'center', width: '180px' },
]

let debounceTimer = null
function debouncedFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(doFetch, 400)
}

function doFetch() {
  reset()
  loadSummary()
}

function applyFilter() {
  if (!dateDraft.tanggal_dari || !dateDraft.tanggal_sampai)
    Object.assign(dateDraft, getCurrentMonthRange())

  params.tanggal_dari = dateDraft.tanggal_dari
  params.tanggal_sampai = dateDraft.tanggal_sampai
  doFetch()
}

function resetFilters() {
  params.search = ''
  Object.assign(dateDraft, getCurrentMonthRange())
  params.tanggal_dari = dateDraft.tanggal_dari
  params.tanggal_sampai = dateDraft.tanggal_sampai
  doFetch()
}

function activeFilterParams() {
  return {
    search: params.search,
    tanggal_dari: params.tanggal_dari,
    tanggal_sampai: params.tanggal_sampai,
  }
}

async function loadSummary() {
  try {
    const { data } = await api.get('/ap/opening-balance/summary', { params: activeFilterParams() })

    Object.assign(summary, data.data)
  } catch {
    // biarkan summary kosong jika gagal
  }
}

async function exportExcel() {
  exportingExcel.value = true
  try {
    const res = await api.get('/ap/opening-balance/export-excel', {
      params: activeFilterParams(),
      responseType: 'blob',
      timeout: 300000,
    })

    const blobUrl = URL.createObjectURL(new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }))

    const link = document.createElement('a')

    link.href = blobUrl
    link.download = `opening-balance-ap-${buildTimestamp()}.xlsx`
    link.click()
    URL.revokeObjectURL(blobUrl)
  } catch (err) {
    showError({ text: await readBlobError(err, 'Gagal mengekspor data') })
  } finally {
    exportingExcel.value = false
  }
}

function buildTimestamp() {
  const n = new Date()

  return (
    String(n.getFullYear()) +
    String(n.getMonth() + 1).padStart(2, '0') +
    String(n.getDate()).padStart(2, '0') +
    '-' +
    String(n.getHours()).padStart(2, '0') +
    String(n.getMinutes()).padStart(2, '0') +
    String(n.getSeconds()).padStart(2, '0')
  )
}

// ── Print ─────────────────────────────────────────────────────────────────
const printingId = ref(null)

async function printOpeningBalance(id) {
  printingId.value = id
  try {
    const res = await api.get(`/ap/tagihan/${id}/print`, { responseType: 'blob', timeout: 300000 })
    const blobUrl = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))

    window.open(blobUrl, '_blank')
    setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000)
  } catch (err) {
    showError({ text: await readBlobError(err, 'Gagal membuka dokumen cetak') })
  } finally {
    printingId.value = null
  }
}

// ── Approve / Reject / Resubmit ──────────────────────────────────────────────
const approvingId = ref(null)
const rejectingId = ref(null)
const resubmittingId = ref(null)

async function confirmApprove(item) {
  const result = await showAlert({
    icon: 'question',
    title: 'Approve Opening Balance?',
    text: `Anda akan menyetujui Opening Balance ${item.no_tagihan} atas nama ${item.vendor_ap?.nama_vendor ?? '-'}.`,
    confirmButtonText: 'Ya, Approve',
    confirmButtonColor: resolveThemeTokens().success,
    cancelButtonText: 'Batal',
    showCancelButton: true,
    focusCancel: true,
    reverseButtons: true,
  })

  if (!result.isConfirmed) return

  approvingId.value = item.id
  try {
    await api.patch(`/ap/opening-balance/${item.id}/approve`, { note: null })
    await showSuccess({ text: `Opening Balance ${item.no_tagihan} berhasil disetujui.` })
    doFetch()
  } catch (err) {
    showError({ text: err.response?.data?.message ?? 'Gagal menyetujui Opening Balance.' })
  } finally {
    approvingId.value = null
  }
}

async function confirmReject(item) {
  const result = await showAlert({
    icon: 'warning',
    title: 'Tolak Opening Balance?',
    html: `Berikan alasan penolakan untuk <strong>${item.no_tagihan}</strong> atas nama <strong>${item.vendor_ap?.nama_vendor ?? '-'}</strong>.`,
    input: 'textarea',
    inputPlaceholder: 'Alasan penolakan...',
    inputAttributes: { rows: 3 },
    inputValidator: value => !value?.trim() ? 'Alasan penolakan wajib diisi.' : null,
    confirmButtonText: 'Ya, Tolak',
    confirmButtonColor: resolveThemeTokens().error,
    cancelButtonText: 'Batal',
    showCancelButton: true,
    focusCancel: true,
    reverseButtons: true,
  })

  if (!result.isConfirmed) return

  rejectingId.value = item.id
  try {
    await api.patch(`/ap/opening-balance/${item.id}/reject`, { note: result.value })
    await showSuccess({ text: `Opening Balance ${item.no_tagihan} berhasil ditolak.` })
    doFetch()
  } catch (err) {
    showError({ text: err.response?.data?.message ?? 'Gagal menolak Opening Balance.' })
  } finally {
    rejectingId.value = null
  }
}

async function confirmResubmit(item) {
  const result = await showAlert({
    icon: 'question',
    title: 'Ajukan Ulang Opening Balance?',
    text: `Opening Balance ${item.no_tagihan} akan diajukan ulang untuk persetujuan.`,
    confirmButtonText: 'Ya, Ajukan Ulang',
    confirmButtonColor: resolveThemeTokens().primary,
    cancelButtonText: 'Batal',
    showCancelButton: true,
    focusCancel: true,
    reverseButtons: true,
  })

  if (!result.isConfirmed) return

  resubmittingId.value = item.id
  try {
    await api.patch(`/ap/opening-balance/${item.id}/resubmit`, { note: null })
    await showSuccess({ text: `Opening Balance ${item.no_tagihan} berhasil diajukan ulang.` })
    doFetch()
  } catch (err) {
    showError({ text: err.response?.data?.message ?? 'Gagal mengajukan ulang Opening Balance.' })
  } finally {
    resubmittingId.value = null
  }
}

doFetch()

onBeforeUnmount(() => {
  clearTimeout(debounceTimer)
  abort()
})
</script>
