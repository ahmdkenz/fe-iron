<template>
  <div>
    <PageHeader
      title="Approval Opening Balance"
      subtitle="Tinjau dan proses opening balance yang memerlukan persetujuan"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Approval Opening Balance', disabled: true },
      ]"
    />

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
                color="warning"
                variant="tonal"
                size="44"
              >
                <VIcon icon="ri-timer-line" />
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
                color="primary"
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
                <VIcon icon="ri-checkbox-circle-line" />
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
          v-model="params.approval_status"
          placeholder="Semua Approval"
          clearable
          hide-details
          density="compact"
          style="max-width: 230px"
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
        <template #item.total_tagihan="{ item }">
          {{ formatCurrency(item.total_tagihan) }}
        </template>
        <template #item.submitted_by_name="{ item }">
          {{ item.submitted_by_name ?? item.created_by_name ?? '-' }}
        </template>
        <template #item.submitted_at="{ item }">
          {{ formatDateTime(item.submitted_at) }}
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
              :to="{ name: 'finance-invoice-show', params: { id: item.id } }"
            >
              <VIcon
                icon="ri-eye-line"
                size="18"
              />
              <VTooltip activator="parent">
                Review
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
import { useCrud } from '@/composables/useCrud'
import { useFormatter } from '@/composables/useFormatter'
import api from '@/utils/axios'
import ApprovalStatusBadge from '../components/ApprovalStatusBadge.vue'

const { items, loading, meta, params, fetchList } = useCrud('/finance/opening-balance')
const { items: klienList, loading: klienLoading, fetchAll: fetchKlien } = useCrud('/finance/klien-ar')
const { formatCurrency, formatDate } = useFormatter()

params.approval_status = 'PENDING'
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
  { title: 'Nominal', key: 'total_tagihan', sortable: false },
  { title: 'Pengaju', key: 'submitted_by_name', sortable: false },
  { title: 'Diajukan Pada', key: 'submitted_at', sortable: false },
  { title: 'Approval', key: 'approval_status', sortable: false },
  { title: 'Aksi', key: 'actions', sortable: false, align: 'center', width: '100px' },
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

function formatDateTime(value) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
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
