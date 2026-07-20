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
        v-if="authStore.canOperateOpeningBalanceAp"
        color="primary"
        prepend-icon="ri-add-line"
        :to="{ name: 'ap-opening-balance-create' }"
      >
        Buat Opening Balance
      </VBtn>
    </PageHeader>

    <VRow class="mb-4">
      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar
                color="primary"
                variant="tonal"
                size="44"
              >
                <VIcon icon="ri-history-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">
                  Total Opening Balance
                </div>
                <div class="text-h6 font-weight-bold">
                  {{ summary.total_tagihan ?? '-' }}
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar
                color="info"
                variant="tonal"
                size="44"
              >
                <VIcon icon="ri-wallet-3-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">
                  Total Nominal
                </div>
                <div class="text-h6 font-weight-bold">
                  {{ formatCurrency(summary.total_nominal) }}
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar
                color="success"
                variant="tonal"
                size="44"
              >
                <VIcon icon="ri-money-cny-circle-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">
                  Total Terbayar
                </div>
                <div class="text-h6 font-weight-bold">
                  {{ formatCurrency(summary.total_pembayaran) }}
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar
                color="error"
                variant="tonal"
                size="44"
              >
                <VIcon icon="ri-error-warning-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">
                  Sisa Hutang
                </div>
                <div class="text-h6 font-weight-bold">
                  {{ formatCurrency(summary.total_sisa) }}
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VCard>
      <VCardText class="d-flex flex-wrap gap-3 pb-0">
        <VTextField
          v-model="params.search"
          placeholder="Cari no. OB / vendor..."
          clearable
          hide-details
          density="compact"
          style="max-width: 260px"
          prepend-inner-icon="ri-search-line"
          @update:model-value="debouncedFetch"
        />
        <VSelect
          v-model="params.status"
          placeholder="Semua Status"
          clearable
          hide-details
          density="compact"
          style="max-width: 170px"
          :items="statusOptions"
          item-title="label"
          item-value="value"
          @update:model-value="doFetch"
        />
        <VSelect
          v-model="params.approval_status"
          placeholder="Semua Approval"
          clearable
          hide-details
          density="compact"
          style="max-width: 190px"
          :items="approvalOptions"
          item-title="label"
          item-value="value"
          @update:model-value="doFetch"
        />
      </VCardText>

      <BaseTable
        :headers="headers"
        :items="items"
        :total="meta.total"
        :loading="loading"
        :per-page="meta.per_page"
        :page="meta.current_page"
        column-resize-key="ap-opening-balance-index"
        class="mt-2"
        @update:options="onTableOptions"
      >
        <template #item.no="{ index }">
          {{ (meta.current_page - 1) * meta.per_page + index + 1 }}
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
        </template>
        <template #item.vendor_ap="{ item }">
          {{ item.vendor_ap?.nama_vendor ?? '-' }}
        </template>
        <template #item.tanggal_tagihan="{ item }">
          {{ formatDate(item.tanggal_tagihan) }}
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
              @click="openDetail(item)"
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

    <VDialog
      v-model="detailOpen"
      max-width="900"
    >
      <VCard>
        <VCardTitle class="d-flex align-center justify-space-between pa-4">
          <span class="text-subtitle-1 font-weight-bold">Detail Opening Balance — {{ selectedItem?.no_tagihan }}</span>
          <VBtn
            icon
            size="small"
            variant="text"
            @click="detailOpen = false"
          >
            <VIcon icon="ri-close-line" />
          </VBtn>
        </VCardTitle>
        <VDivider />
        <VCardText>
          <div
            v-if="detailLoading"
            class="text-center py-8"
          >
            <VProgressCircular
              indeterminate
              color="primary"
            />
          </div>
          <template v-else>
            <VRow class="mb-3">
              <VCol
                cols="6"
                sm="3"
              >
                <div class="text-caption text-medium-emphasis">
                  Vendor
                </div>
                <div class="text-body-2 font-weight-medium">
                  {{ selectedItem?.vendor_ap?.nama_vendor ?? '-' }}
                </div>
              </VCol>
              <VCol
                cols="6"
                sm="3"
              >
                <div class="text-caption text-medium-emphasis">
                  Status
                </div>
                <TagihanApStatusBadge :status="selectedItem?.status" />
              </VCol>
              <VCol
                cols="6"
                sm="3"
              >
                <div class="text-caption text-medium-emphasis">
                  Approval
                </div>
                <ApprovalStatusBadge :status="selectedItem?.approval_status" />
              </VCol>
              <VCol
                cols="6"
                sm="3"
              >
                <div class="text-caption text-medium-emphasis">
                  Sisa Tagihan
                </div>
                <div class="text-body-2 font-weight-bold text-primary">
                  {{ formatCurrency(selectedItem?.sisa_tagihan) }}
                </div>
              </VCol>
            </VRow>

            <OpeningBalanceApDetailTable
              :details="detailRows"
              readonly
              :saldo-awal="Number(selectedItem?.subtotal) || 0"
            />
          </template>
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useAuthStore } from '@/stores/auth.store'
import { useCrud } from '@/composables/useCrud'
import { useFormatter } from '@/composables/useFormatter'
import api from '@/utils/axios'
import TagihanApStatusBadge from '../../TagihanAp/components/TagihanApStatusBadge.vue'
import ApprovalStatusBadge from '@/modules/Finance/shared/components/ApprovalStatusBadge.vue'
import OpeningBalanceApDetailTable from '../components/OpeningBalanceApDetailTable.vue'

const authStore = useAuthStore()
const { showAlert, showSuccess, showError, resolveThemeTokens } = useSweetAlert()
const { formatCurrency, formatDate } = useFormatter()

const { items, loading, meta, params, fetchList } = useCrud('/ap/opening-balance')

const summary = reactive({ total_tagihan: null, total_nominal: null, total_pembayaran: null, total_sisa: null })

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

const statusOptions = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Diterima', value: 'DITERIMA' },
  { label: 'Sebagian', value: 'SEBAGIAN' },
  { label: 'Lunas', value: 'LUNAS' },
]

const approvalOptions = [
  { label: 'Menunggu Persetujuan', value: 'PENDING' },
  { label: 'Disetujui', value: 'APPROVED' },
  { label: 'Ditolak', value: 'REJECTED' },
]

let debounceTimer = null
function debouncedFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(doFetch, 400)
}

function doFetch() {
  params.page = 1
  fetchList()
  loadSummary()
}

function onTableOptions({ page, itemsPerPage }) {
  params.page = page
  params.per_page = itemsPerPage
  fetchList()
}

async function loadSummary() {
  try {
    const { data } = await api.get('/ap/opening-balance/summary', {
      params: { search: params.search, status: params.status, approval_status: params.approval_status },
    })

    Object.assign(summary, data.data)
  } catch {
    // biarkan summary kosong jika gagal
  }
}

// ── Detail dialog ────────────────────────────────────────────────────────────
const detailOpen = ref(false)
const detailLoading = ref(false)
const selectedItem = ref(null)
const detailRows = ref([])

async function openDetail(item) {
  selectedItem.value = item
  detailOpen.value = true
  detailLoading.value = true
  try {
    const { data } = await api.get(`/ap/opening-balance/${item.id}/details`)

    detailRows.value = data.data ?? []
  } catch {
    detailRows.value = []
  } finally {
    detailLoading.value = false
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
</script>
