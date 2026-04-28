<template>
  <div>
    <PageHeader 
      title="Invoice AR" 
      subtitle="Kelola tagihan Account Receivable"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Invoice', disabled: true }
      ]"
    >
      <div class="d-flex gap-2">
        <VBtn
          color="secondary"
          variant="tonal"
          prepend-icon="ri-download-2-line"
          :loading="exporting"
          @click="exportCsv"
        >
          Export CSV
        </VBtn>
        <VBtn
          color="primary"
          prepend-icon="ri-add-line"
          :to="{ name: 'finance-invoice-create' }"
        >
          Buat Invoice
        </VBtn>
      </div>
    </PageHeader>

    <!-- Summary Cards -->
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
                <VIcon icon="ri-file-list-3-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">
                  Total Invoice
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
                <VIcon icon="ri-bill-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">
                  Total Tagihan
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

    <!-- Filter & Table -->
    <VCard>
      <VCardText class="d-flex flex-wrap gap-3 pb-0">
        <VTextField
          v-model="params.search"
          placeholder="Cari no. invoice / klien..."
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
          @focus="ensureKlienLoaded()"
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
        <template #item.tanggal_jatuh_tempo="{ item }">
          <span
            v-if="item.tanggal_jatuh_tempo"
            :class="isOverdue(item) ? 'text-error font-weight-bold' : ''"
          >
            {{ formatDate(item.tanggal_jatuh_tempo) }}
            <VChip
              v-if="isOverdue(item)"
              color="error"
              size="x-small"
              variant="tonal"
              label
              class="ms-1"
            >
              Overdue
            </VChip>
          </span>
          <span
            v-else
            class="text-medium-emphasis"
          >-</span>
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
          <InvoiceStatusBadge :status="item.status" />
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
                Cetak Invoice
              </VTooltip>
            </VBtn>
            <VBtn
              v-if="item.status === 'DRAFT'"
              icon
              size="small"
              variant="text"
              color="primary"
              :to="{ name: 'finance-invoice-edit', params: { id: item.id } }"
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
              v-if="item.status === 'DRAFT'"
              icon
              size="small"
              variant="text"
              color="error"
              @click="confirmDelete(item)"
            >
              <VIcon
                icon="ri-delete-bin-line"
                size="18"
              />
              <VTooltip activator="parent">
                Hapus
              </VTooltip>
            </VBtn>
          </div>
        </template>
      </BaseTable>
    </VCard>

    <!-- Confirm Delete -->
    <BaseModal
      v-if="showDelete"
      v-model="showDelete"
      title="Hapus Invoice"
      :loading="loading"
      @confirm="doDelete"
    >
      <p>
        Apakah Anda yakin ingin menghapus invoice
        <strong>{{ selectedInvoice?.no_invoice }}</strong>?
      </p>
      <VAlert
        v-if="deleteError"
        type="error"
        variant="tonal"
        class="mt-3"
      >
        {{ deleteError }}
      </VAlert>
    </BaseModal>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useCrud } from '@/composables/useCrud.js'
import { useLazyFetchAll } from '@/composables/useLazyFetchAll.js'
import { useFormatter } from '@/composables/useFormatter.js'
import api from '@/utils/axios.js'
import InvoiceStatusBadge from '../components/InvoiceStatusBadge.vue'

const { showSuccess, showError } = useSweetAlert()
const { items, loading, meta, params, fetchList, remove } = useCrud('/finance/invoices')
const { items: klienList, loading: klienLoading, fetchAll: fetchKlien } = useCrud('/finance/klien-ar')
const { ensureLoaded: ensureKlienLoaded } = useLazyFetchAll(fetchKlien)
const { formatCurrency, formatDate } = useFormatter()

// Extend params with filter fields
params.status        = ''
params.klien_ar_id   = null
params.periode_bulan = null
params.periode_tahun = null

const summary       = reactive({ total_invoice: null, total_tagihan: null, total_pembayaran: null, total_sisa: null })
const showDelete    = ref(false)
const deleteError   = ref('')
const selectedInvoice = ref(null)
const exporting     = ref(false)

const headers = [
  { title: 'No',             key: 'no',             sortable: false, width: '60px' },
  { title: 'No Invoice',     key: 'no_invoice',     sortable: false },
  { title: 'Klien',          key: 'klien_ar',       sortable: false },
  { title: 'Perusahaan',     key: 'perusahaan',     sortable: false },
  { title: 'Tanggal',        key: 'tanggal_invoice',    sortable: false },
  { title: 'Jatuh Tempo',   key: 'tanggal_jatuh_tempo', sortable: false },
  { title: 'Total Tagihan',  key: 'total_tagihan',  sortable: false },
  { title: 'Sisa Tagihan',   key: 'sisa_tagihan',   sortable: false },
  { title: 'Status',         key: 'status',         sortable: false },
  { title: 'Aksi',           key: 'actions',        sortable: false, align: 'center', width: '120px' },
]

const statusOptions = [
  { label: 'Draft',    value: 'DRAFT'    },
  { label: 'Terkirim', value: 'TERKIRIM' },
  { label: 'Sebagian', value: 'SEBAGIAN' },
  { label: 'Lunas',    value: 'LUNAS'    },
]

const bulanOptions = [
  { label: 'Januari',   value: 1  },
  { label: 'Februari', value: 2  },
  { label: 'Maret',     value: 3  },
  { label: 'April',    value: 4  },
  { label: 'Mei',       value: 5  },
  { label: 'Juni',     value: 6  },
  { label: 'Juli',      value: 7  },
  { label: 'Agustus',  value: 8  },
  { label: 'September', value: 9  },
  { label: 'Oktober',  value: 10 },
  { label: 'November',  value: 11 },
  { label: 'Desember', value: 12 },
]

let listController = null
let summaryController = null
let debounceTimer = null

function clearDebounceTimer() {
  clearTimeout(debounceTimer)
  debounceTimer = null
}

function abortPendingRequests() {
  listController?.abort()
  summaryController?.abort()
  listController = null
  summaryController = null
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
    const { data } = await api.get('/finance/invoices/summary', {
      params: {
        periode_bulan: params.periode_bulan,
        periode_tahun: params.periode_tahun,
        klien_ar_id: params.klien_ar_id,
      },
      signal: controller.signal,
    })

    if (controller.signal.aborted)
      return

    Object.assign(summary, data.data)
  } catch (err) {
    if (err.code === 'ERR_CANCELED')
      return
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

function debouncedFetch() {
  clearDebounceTimer()
  debounceTimer = setTimeout(doFetch, 400)
}

function onTableOptions({ page, itemsPerPage }) {
  params.page = page
  params.per_page = itemsPerPage
  loadList()
}

async function exportCsv() {
  exporting.value = true
  try {
    const token   = localStorage.getItem('token')
    const apiBase = import.meta.env.VITE_API_BASE_URL ?? ''
    const query   = new URLSearchParams()
    if (params.status)        query.set('status', params.status)
    if (params.klien_ar_id)   query.set('klien_ar_id', params.klien_ar_id)
    if (params.periode_bulan) query.set('periode_bulan', params.periode_bulan)
    if (params.periode_tahun) query.set('periode_tahun', params.periode_tahun)

    const res = await fetch(`${apiBase}/finance/invoices/export?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `invoice-ar-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  } finally {
    exporting.value = false
  }
}

function isOverdue(item) {
  if (!item.tanggal_jatuh_tempo || item.status === 'LUNAS') return false
  return new Date(item.tanggal_jatuh_tempo) < new Date(new Date().toDateString())
}

function confirmDelete(inv) { selectedInvoice.value = inv; deleteError.value = ''; showDelete.value = true }

function printInvoice(id) {
  const token   = localStorage.getItem('token')
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? ''
  const baseUrl = apiBase.replace(/\/api\/v\d+\/?$/, '')

  window.open(`${baseUrl}/print/invoice/${id}?token=${encodeURIComponent(token)}`, '_blank')
}

async function doDelete() {
  deleteError.value = ''

  const deleteId = selectedInvoice.value?.id
  if (!deleteId) return

  showDelete.value = false
  await nextTick()

  const res = await remove(deleteId)
  if (res.success) {
    loadList()
    loadSummary()
    await showSuccess('Invoice berhasil dihapus.')
  } else {
    deleteError.value = res.message || 'Gagal menghapus data'
    await showError(deleteError.value)
  }
}

onMounted(() => {
  loadList()
  loadSummary()
})

onBeforeUnmount(() => {
  clearDebounceTimer()
  abortPendingRequests()
})
</script>
