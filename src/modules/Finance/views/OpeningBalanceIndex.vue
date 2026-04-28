<template>
  <div>
    <PageHeader
      title="Opening Balance"
      subtitle="Kelola saldo awal piutang klien"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Opening Balance', disabled: true },
      ]"
    >
      <VBtn
        v-if="authStore.canOperateOpeningBalance"
        color="primary"
        prepend-icon="ri-add-line"
        :to="{ name: 'finance-opening-balance-create' }"
      >
        Ajukan Opening Balance
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
                  Total Data
                </div>
                <div class="text-h6 font-weight-bold">
                  {{ summary.total_invoice ?? '-' }}
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
                color="warning"
                variant="tonal"
                size="44"
              >
                <VIcon icon="ri-wallet-3-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">
                  Total Saldo Awal
                </div>
                <div class="text-h6 font-weight-bold">
                  {{ formatCurrency(summary.total_tagihan) }}
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
                  Sisa Piutang
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
          placeholder="Cari no. OB / klien..."
          clearable
          hide-details
          density="compact"
          style="max-width: 250px"
          prepend-inner-icon="ri-search-line"
          @update:model-value="debouncedFetch"
        />
        <VSelect
          v-model="params.status"
          placeholder="Semua Status"
          clearable
          hide-details
          density="compact"
          style="max-width: 160px"
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
          style="max-width: 220px"
          :items="approvalStatusOptions"
          item-title="label"
          item-value="value"
          @update:model-value="doFetch"
        />
        <VAutocomplete
          v-model="params.klien_ar_id"
          placeholder="Semua Klien"
          clearable
          hide-details
          density="compact"
          style="max-width: 220px"
          :items="klienList"
          item-title="nama_klien"
          item-value="id"
          :loading="klienLoading"
          @update:model-value="doFetch"
        />
        <VSelect
          v-model="params.periode_bulan"
          placeholder="Bulan"
          clearable
          hide-details
          density="compact"
          style="max-width: 140px"
          :items="bulanOptions"
          item-title="label"
          item-value="value"
          @update:model-value="doFetch"
        />
        <VTextField
          v-model="params.periode_tahun"
          placeholder="Tahun"
          clearable
          hide-details
          density="compact"
          style="max-width: 100px"
          type="number"
          @update:model-value="debouncedFetch"
        />
      </VCardText>

      <BaseTable
        :headers="headers"
        :items="items"
        :total="meta.total"
        :loading="loading"
        :per-page="meta.per_page"
        :page="meta.current_page"
        class="mt-2"
        @update:options="onTableOptions"
      >
        <template #item.no="{ index }">
          {{ (meta.current_page - 1) * meta.per_page + index + 1 }}
        </template>
        <template #item.no_invoice="{ item }">
          <VChip
            color="primary"
            size="small"
            variant="tonal"
            label
          >
            {{ item.no_invoice }}
          </VChip>
        </template>
        <template #item.klien_ar="{ item }">
          {{ item.klien_ar?.nama_klien ?? '-' }}
        </template>
        <template #item.perusahaan="{ item }">
          <VChip
            v-if="item.perusahaan"
            color="secondary"
            size="small"
            variant="tonal"
            label
          >
            {{ item.perusahaan.nama_singkatan_perusahaan }}
          </VChip>
          <span v-else>-</span>
        </template>
        <template #item.tanggal_invoice="{ item }">
          {{ formatDate(item.tanggal_invoice) }}
        </template>
        <template #item.periode="{ item }">
          {{ formatPeriode(item) }}
        </template>
        <template #item.total_tagihan="{ item }">
          {{ formatCurrency(item.total_tagihan) }}
        </template>
        <template #item.total_pembayaran="{ item }">
          {{ formatCurrency(item.total_pembayaran) }}
        </template>
        <template #item.sisa_tagihan="{ item }">
          <span :class="item.sisa_tagihan > 0 ? 'text-error' : 'text-success'">
            {{ formatCurrency(item.sisa_tagihan) }}
          </span>
        </template>
        <template #item.status="{ item }">
          <InvoiceStatusBadge :status="item.status" />
        </template>
        <template #item.approval_status="{ item }">
          <ApprovalStatusBadge :status="item.approval_status" />
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <VBtn
              icon
              size="small"
              variant="text"
              color="info"
              :to="{ name: 'finance-invoice-show', params: { id: item.id } }"
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
              v-if="item.can_edit"
              icon
              size="small"
              variant="text"
              color="primary"
              :to="{ name: 'finance-opening-balance-edit', params: { id: item.id } }"
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
              v-if="item.can_print"
              icon
              size="small"
              variant="text"
              color="secondary"
              @click="printInvoice(item.id)"
            >
              <VIcon
                icon="ri-printer-line"
                size="18"
              />
              <VTooltip activator="parent">
                Cetak
              </VTooltip>
            </VBtn>
          </div>
        </template>
      </BaseTable>
    </VCard>
  </div>
</template>

<script setup>
/* eslint-disable camelcase */
import { onBeforeUnmount, onDeactivated, onMounted, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useCrud } from '@/composables/useCrud'
import { useFormatter } from '@/composables/useFormatter'
import api from '@/utils/axios'
import ApprovalStatusBadge from '../components/ApprovalStatusBadge.vue'
import InvoiceStatusBadge from '../components/InvoiceStatusBadge.vue'

const authStore = useAuthStore()
const { items, loading, meta, params, fetchList } = useCrud('/finance/opening-balance')
const { items: klienList, loading: klienLoading, fetchAll: fetchKlien } = useCrud('/finance/klien-ar')
const { formatCurrency, formatDate } = useFormatter()

params.status = ''
params.approval_status = ''
params.klien_ar_id = null
params.periode_bulan = null
params.periode_tahun = null

const summary = reactive({
  total_invoice: null,
  total_tagihan: null,
  total_pembayaran: null,
  total_sisa: null,
})

const headers = [
  { title: 'No', key: 'no', sortable: false, width: '60px' },
  { title: 'No Opening Balance', key: 'no_invoice', sortable: false },
  { title: 'Klien', key: 'klien_ar', sortable: false },
  { title: 'Perusahaan', key: 'perusahaan', sortable: false },
  { title: 'Tanggal', key: 'tanggal_invoice', sortable: false },
  { title: 'Periode', key: 'periode', sortable: false },
  { title: 'Saldo Awal', key: 'total_tagihan', sortable: false },
  { title: 'Total Terbayar', key: 'total_pembayaran', sortable: false },
  { title: 'Sisa Tagihan', key: 'sisa_tagihan', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Approval', key: 'approval_status', sortable: false },
  { title: 'Aksi', key: 'actions', sortable: false, align: 'center', width: '120px' },
]

const statusOptions = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Terkirim', value: 'TERKIRIM' },
  { label: 'Sebagian', value: 'SEBAGIAN' },
  { label: 'Lunas', value: 'LUNAS' },
]

const approvalStatusOptions = [
  { label: 'Menunggu Persetujuan', value: 'PENDING' },
  { label: 'Disetujui', value: 'APPROVED' },
  { label: 'Ditolak', value: 'REJECTED' },
]

const bulanOptions = [
  { label: 'Januari', value: 1 },
  { label: 'Februari', value: 2 },
  { label: 'Maret', value: 3 },
  { label: 'April', value: 4 },
  { label: 'Mei', value: 5 },
  { label: 'Juni', value: 6 },
  { label: 'Juli', value: 7 },
  { label: 'Agustus', value: 8 },
  { label: 'September', value: 9 },
  { label: 'Oktober', value: 10 },
  { label: 'November', value: 11 },
  { label: 'Desember', value: 12 },
]

function formatPeriode(item) {
  if (!item.periode_awal || !item.periode_akhir) return '-'
  
  return `${formatDate(item.periode_awal)} - ${formatDate(item.periode_akhir)}`
}

let listController = null
let summaryController = null
let klienController = null

function clearDebounceTimer() {
  clearTimeout(debounceTimer)
  debounceTimer = null
}

function abortPendingRequests() {
  listController?.abort()
  summaryController?.abort()
  klienController?.abort()
  listController = null
  summaryController = null
  klienController = null
}

async function loadKlien() {
  klienController?.abort()

  const controller = new AbortController()

  klienController = controller
  await fetchKlien({ signal: controller.signal })

  if (klienController === controller)
    klienController = null
}

async function loadList() {
  listController?.abort()

  const controller = new AbortController()

  listController = controller
  await fetchList({}, { signal: controller.signal })

  if (listController === controller)
    listController = null
}

async function loadSummary() {
  summaryController?.abort()

  const controller = new AbortController()

  summaryController = controller

  try {
    const { data } = await api.get('/finance/opening-balance/summary', {
      params: {
        search: params.search,
        status: params.status,
        approval_status: params.approval_status,
        klien_ar_id: params.klien_ar_id,
        periode_bulan: params.periode_bulan,
        periode_tahun: params.periode_tahun,
      },
      signal: controller.signal,
    })

    if (controller.signal.aborted)
      return

    Object.assign(summary, data.data)
  } catch (err) {
    if (err.code === 'ERR_CANCELED')
      return

    // ignore summary error
  } finally {
    if (summaryController === controller)
      summaryController = null
  }
}

function doFetch() {
  params.page = 1
  loadList()
  loadSummary()
}

let debounceTimer = null
function debouncedFetch() {
  clearDebounceTimer()
  debounceTimer = setTimeout(doFetch, 400)
}

function onTableOptions({ page, itemsPerPage }) {
  params.page = page
  params.per_page = itemsPerPage
  loadList()
}

function printInvoice(id) {
  const token = localStorage.getItem('token')
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? ''
  const baseUrl = apiBase.replace(/\/api\/v\d+\/?$/, '')

  window.open(`${baseUrl}/print/invoice/${id}?token=${encodeURIComponent(token)}`, '_blank')
}

onMounted(() => {
  loadKlien()
  loadList()
  loadSummary()
})

onDeactivated(() => {
  clearDebounceTimer()
  abortPendingRequests()
})

onBeforeUnmount(() => {
  clearDebounceTimer()
  abortPendingRequests()
})
</script>
