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
          color="primary"
          prepend-icon="ri-file-excel-line"
          :loading="exportingExcel"
          @click="exportExcel"
        >
          Export
        </VBtn>
        <VBtn
          v-if="!authStore.isDirectorOnly"
          color="primary"
          prepend-icon="ri-upload-line"
          @click="openImport"
        >
          Import
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

    <!-- Filter Card -->
    <VCard class="mb-4">
      <VCardText class="pa-0">
        <div class="d-flex align-center justify-space-between px-4 py-3">
          <div class="d-flex align-center gap-2">
            <VIcon icon="ri-filter-3-line" size="16" color="primary" />
            <span class="text-body-2 font-weight-semibold">Filter</span>
          </div>
          <VBtn
            variant="text"
            color="secondary"
            size="small"
            prepend-icon="ri-refresh-line"
            @click="resetFilter"
          >
            Reset
          </VBtn>
        </div>
        <VDivider />
        <div class="d-flex flex-wrap align-center gap-4 px-4 py-3">
          <div>
            <div class="text-caption text-medium-emphasis mb-2">Segment</div>
            <VBtnToggle
              v-model="segment"
              variant="outlined"
              mandatory
              divided
              density="compact"
              @update:model-value="onSegmentChange"
            >
              <VBtn value="ALL" size="small" style="min-width: 80px">Semua</VBtn>
              <VBtn value="B2C" size="small" style="min-width: 70px">B2C</VBtn>
              <VBtn value="B2B" size="small" style="min-width: 70px">B2B</VBtn>
            </VBtnToggle>
          </div>
          <VDivider vertical style="height: 40px; align-self: flex-end;" class="d-none d-sm-block" />
          <div style="min-width: 200px; flex: 1; max-width: 280px;">
            <div class="text-caption text-medium-emphasis mb-2">Pencarian</div>
            <VTextField
              v-model="params.search"
              placeholder="Cari no. invoice / klien..."
              clearable
              hide-details
              density="compact"
              prepend-inner-icon="ri-search-line"
              @update:model-value="debouncedFetch"
            />
          </div>
          <div style="min-width: 140px; max-width: 180px;">
            <div class="text-caption text-medium-emphasis mb-2">Status</div>
            <VSelect
              v-model="params.status"
              placeholder="Semua Status"
              clearable
              hide-details
              density="compact"
              :items="statusOptions"
              item-title="label"
              item-value="value"
              @update:model-value="doFetch"
            />
          </div>
          <div style="min-width: 180px; flex: 1; max-width: 260px;">
            <div class="text-caption text-medium-emphasis mb-2">Klien</div>
            <VAutocomplete
              v-model="params.klien_ar_id"
              placeholder="Semua Klien"
              clearable
              hide-details
              density="compact"
              :items="klienList"
              item-title="nama_klien"
              item-value="id"
              :loading="klienLoading"
              @focus="ensureKlienLoaded()"
              @update:model-value="doFetch"
            />
          </div>
          <VDivider vertical style="height: 40px; align-self: flex-end;" class="d-none d-sm-block" />
          <div>
            <div class="text-caption text-medium-emphasis mb-2">Dari</div>
            <VTextField
              v-model="params.tanggal_dari"
              type="date"
              hide-details
              density="compact"
              style="min-width: 150px; max-width: 170px;"
              @update:model-value="debouncedFetch"
            />
          </div>
          <div>
            <div class="text-caption text-medium-emphasis mb-2">Sampai</div>
            <VTextField
              v-model="params.tanggal_sampai"
              type="date"
              hide-details
              density="compact"
              style="min-width: 150px; max-width: 170px;"
              @update:model-value="debouncedFetch"
            />
          </div>
        </div>
      </VCardText>
    </VCard>

    <VCard>
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
        <template #item.tanggal_invoice="{ item }">
          {{ formatDate(item.tanggal_invoice) }}
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
              v-if="item.can_record_payment && item.status !== 'LUNAS'"
              icon
              size="small"
              variant="tonal"
              color="success"
              @click="openCatatBayar(item)"
            >
              <VIcon
                icon="ri-money-cny-circle-line"
                size="18"
              />
              <VTooltip activator="parent">
                Catat Bayar
              </VTooltip>
            </VBtn>
            <VBtn
              v-if="item.can_print"
              icon
              size="small"
              variant="tonal"
              color="success"
              @click="shareViaWhatsapp(item)"
            >
              <VIcon
                icon="ri-whatsapp-line"
                size="18"
              />
              <VTooltip activator="parent">
                Kirim via WhatsApp
              </VTooltip>
            </VBtn>
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
              icon
              size="small"
              variant="text"
              color="secondary"
              :loading="printingId === item.id"
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
    <!-- Catat Bayar Modal -->
    <PembayaranForm
      v-if="selectedForPayment"
      v-model="showPembayaran"
      :invoice-id="selectedForPayment.id"
      :sisa-tagihan="selectedForPayment.sisa_tagihan"
      @saved="onPembayaranSaved"
    />
    <!-- Import Modal -->
    <VDialog
      v-model="showImport"
      max-width="600"
      persistent
    >
      <VCard>
        <VCardTitle class="d-flex align-center justify-space-between pa-4">
          <span>Import Invoice AR</span>
          <VBtn
            icon
            size="small"
            variant="text"
            @click="closeImport"
          >
            <VIcon icon="ri-close-line" />
          </VBtn>
        </VCardTitle>
        <VDivider />
        <VCardText class="pt-4">
          <VAlert
            type="info"
            variant="tonal"
            class="mb-4"
          >
            <div class="mb-2 font-weight-medium">
              Panduan Import:
            </div>
            <ul class="ps-4">
              <li>Download template, isi data, lalu upload file (.xlsx atau .csv).</li>
              <li>Template memiliki 2 sheet: <strong>Invoice</strong> (header) dan <strong>Item Invoice</strong> (rincian).</li>
              <li>Kolom <strong>nama_klien</strong> wajib sesuai persis dengan data klien di sistem.</li>
              <li>Gunakan <strong>no_urut</strong> untuk menghubungkan invoice dengan item-itemnya.</li>
              <li>Format tanggal: <strong>YYYY-MM-DD</strong> (contoh: 2025-06-01). Berlaku untuk <strong>tanggal_invoice</strong>, <strong>tanggal_jatuh_tempo</strong>, <strong>periode_awal</strong>, dan <strong>periode_akhir</strong>.</li>
              <li>Kolom <strong>tanggal_jatuh_tempo</strong> bersifat opsional — boleh dikosongkan.</li>
              <li>Import CSV hanya memproses Sheet "Invoice" tanpa item rincian.</li>
              <li>Lihat sheet <strong>Petunjuk Pengisian</strong> di template untuk panduan lengkap.</li>
            </ul>
          </VAlert>

          <VBtn
            variant="outlined"
            color="primary"
            prepend-icon="ri-file-excel-line"
            class="mb-4"
            @click="downloadTemplate"
          >
            Download Template Excel
          </VBtn>

          <VFileInput
            v-model="importFile"
            label="Pilih File (.xlsx atau .csv)"
            accept=".xlsx,.xls,.csv"
            prepend-icon="ri-file-upload-line"
            variant="outlined"
            density="compact"
            :clearable="true"
            hide-details="auto"
            @update:model-value="importResult = null"
          />

          <div
            v-if="importResult"
            class="mt-4"
          >
            <VAlert
              :type="importResult.failed > 0 ? 'warning' : 'success'"
              variant="tonal"
              class="mb-3"
            >
              Import selesai:
              <strong>{{ importResult.inserted }}</strong> ditambahkan,
              <strong>{{ importResult.failed }}</strong> gagal
              (total {{ importResult.total }} baris).
            </VAlert>

            <div
              v-if="importResult.errors?.length"
              class="mt-2"
            >
              <div class="text-subtitle-2 mb-2">
                Detail Error:
              </div>
              <VTable
                density="compact"
                class="border rounded"
              >
                <thead>
                  <tr>
                    <th>Sheet</th>
                    <th>Baris</th>
                    <th>Pesan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(err, i) in importResult.errors"
                    :key="i"
                  >
                    <td>{{ err.sheet }}</td>
                    <td>{{ err.row }}</td>
                    <td>{{ err.message }}</td>
                  </tr>
                </tbody>
              </VTable>
            </div>
          </div>
        </VCardText>
        <VDivider />
        <VCardActions class="pa-4 gap-2 justify-end">
          <VBtn
            variant="outlined"
            @click="closeImport"
          >
            Tutup
          </VBtn>
          <VBtn
            color="warning"
            :loading="importing"
            :disabled="!importFile"
            prepend-icon="ri-upload-line"
            @click="doImport"
          >
            Import
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup>
import { defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useCrud } from '@/composables/useCrud.js'
import { useLazyFetchAll } from '@/composables/useLazyFetchAll.js'
import { useFormatter } from '@/composables/useFormatter.js'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/utils/axios.js'
import InvoiceStatusBadge from '../components/InvoiceStatusBadge.vue'

const PembayaranForm = defineAsyncComponent(() => import('../components/PembayaranForm.vue'))

const { showSuccess, showError, showLoading, closeAlert } = useSweetAlert()
const authStore = useAuthStore()
const { items, loading, meta, params, fetchList, remove } = useCrud('/finance/invoices')
const { items: klienList, loading: klienLoading, fetchAll: fetchKlien } = useCrud('/finance/klien-ar')
const { ensureLoaded: ensureKlienLoaded } = useLazyFetchAll(fetchKlien)
const { formatCurrency, formatDate } = useFormatter()

const canSeeAll = authStore.hasAnyRole(['ADMIN', 'MANAGER', 'SUPERVISOR'])

// Extend params with filter fields
params.status         = ''
params.klien_ar_id    = null
params.tanggal_dari   = null
params.tanggal_sampai = null
if (!canSeeAll) {
  params.karyawan_id = authStore.user?.karyawan?.id
}

const summary       = reactive({ total_invoice: null, total_tagihan: null, total_pembayaran: null, total_sisa: null })
const showDelete         = ref(false)
const deleteError        = ref('')
const selectedInvoice    = ref(null)
const showPembayaran     = ref(false)
const selectedForPayment = ref(null)
const exportingExcel  = ref(false)
const showImport      = ref(false)
const importing       = ref(false)
const printingId      = ref(null)
const importFile      = ref(null)
const importResult    = ref(null)
const segment         = ref('ALL')

function onSegmentChange(val) {
  params.segment = val === 'ALL' ? undefined : val
  doFetch()
}

function resetFilter() {
  segment.value         = 'ALL'
  params.search         = ''
  params.status         = ''
  params.klien_ar_id    = null
  params.tanggal_dari   = null
  params.tanggal_sampai = null
  params.segment        = undefined
  doFetch()
}

const headers = [
  { title: 'No',             key: 'no',             sortable: false, width: '60px' },
  { title: 'No Invoice',     key: 'no_invoice',     sortable: false },
  { title: 'Klien',          key: 'klien_ar',       sortable: false },
  { title: 'Tanggal',        key: 'tanggal_invoice',    sortable: false },
  { title: 'Total Tagihan',  key: 'total_tagihan',  sortable: false },
  { title: 'Sisa Tagihan',   key: 'sisa_tagihan',   sortable: false },
  { title: 'Status',         key: 'status',         sortable: false },
  { title: 'Aksi',           key: 'actions',        sortable: false, align: 'center', width: '160px' },
]

const statusOptions = [
  { label: 'Draft',    value: 'DRAFT'    },
  { label: 'Terkirim', value: 'TERKIRIM' },
  { label: 'Sebagian', value: 'SEBAGIAN' },
  { label: 'Lunas',    value: 'LUNAS'    },
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
        tanggal_dari: params.tanggal_dari,
        tanggal_sampai: params.tanggal_sampai,
        klien_ar_id: params.klien_ar_id,
        ...(segment.value !== 'ALL' && { segment: segment.value }),
        ...(!canSeeAll && { karyawan_id: params.karyawan_id }),
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

async function exportExcel() {
  exportingExcel.value = true
  showLoading({ title: 'Mengeksport Data Invoice', text: 'Mohon tunggu sebentar...' })
  try {
    const query = new URLSearchParams()
    if (params.status)             query.set('status', params.status)
    if (params.klien_ar_id)        query.set('klien_ar_id', params.klien_ar_id)
    if (params.tanggal_dari)       query.set('tanggal_dari', params.tanggal_dari)
    if (params.tanggal_sampai)     query.set('tanggal_sampai', params.tanggal_sampai)
    if (segment.value !== 'ALL')   query.set('segment', segment.value)

    const res = await api.get(`/finance/invoices/export-excel?${query}`, { responseType: 'blob' })
    const url  = URL.createObjectURL(res.data)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `Data Tagihan Invoice-${new Date().toISOString().slice(0, 10)}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
    showSuccess({ title: 'Export Berhasil!', text: 'File berhasil diunduh.' })
  } catch {
    await showError('Gagal mengunduh data Excel.')
  } finally {
    exportingExcel.value = false
    closeAlert({ onlyLoading: true })
  }
}

function openImport() {
  importFile.value   = null
  importResult.value = null
  showImport.value   = true
}

function closeImport() {
  showImport.value = false
  if (importResult.value?.inserted > 0) {
    loadList()
    loadSummary()
  }
}

async function downloadTemplate() {
  try {
    const res  = await api.get('/finance/invoices/import-template', { responseType: 'blob' })
    const url  = URL.createObjectURL(res.data)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'Template Tagihan Invoice.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    await showError('Gagal mengunduh template.')
  }
}

async function doImport() {
  if (!importFile.value) return
  importing.value    = true
  importResult.value = null
  showLoading({ title: 'Mengimport Data Invoice', text: 'Mohon tunggu sebentar...' })

  try {
    const formData = new FormData()
    formData.append('file', importFile.value)

    const res = await api.post('/finance/invoices/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    importResult.value = res.data.data
    importFile.value   = null
  } catch (err) {
    const message = err?.response?.data?.message || 'Gagal mengimport data.'
    await showError(message)
  } finally {
    importing.value = false
    closeAlert({ onlyLoading: true })
  }
}

function confirmDelete(inv) { selectedInvoice.value = inv; deleteError.value = ''; showDelete.value = true }

function openCatatBayar(item) {
  selectedForPayment.value = item
  showPembayaran.value     = true
}

function onPembayaranSaved() {
  loadList()
  loadSummary()
}

async function printInvoice(id) {
  printingId.value = id
  try {
    const res = await api.get(`/finance/invoices/${id}/print`, { responseType: 'blob' })
    const blobUrl = URL.createObjectURL(res.data)
    window.open(blobUrl, '_blank')
    setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000)
  } catch {
    await showError('Gagal membuka dokumen cetak')
  } finally {
    printingId.value = null
  }
}

async function shareViaWhatsapp(inv) {
  const rawPhone = inv.klien_ar?.no_wa ?? ''
  if (!rawPhone) {
    await showError('Nomor WhatsApp klien belum diisi. Silakan lengkapi data No. WhatsApp pada form Client.')
    return
  }

  const phone = rawPhone.startsWith('0')
    ? '62' + rawPhone.slice(1)
    : rawPhone.replace(/^\+/, '')

  const total = new Intl.NumberFormat('id-ID').format(inv.total_tagihan)
  const msg =
    `Halo, berikut kami kirimkan Invoice *${inv.no_invoice}*.\n\n` +
    `Klien: ${inv.klien_ar.nama_klien}\n` +
    `Total Tagihan: Rp ${total}\n` +
    `Periode: ${inv.periode_awal} s/d ${inv.periode_akhir}\n\n` +
    `Silakan akses dan unduh invoice di:\n${inv.share_url}`

  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
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
