<template>
  <div>
    <PageHeader 
      title="Manajemen Investor" 
      subtitle="Kelola data investor"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Investor', disabled: true }
      ]"
    >
      <div class="d-flex gap-2">
        <VBtn
          color="primary"
          prepend-icon="ri-file-excel-line"
          :loading="exporting"
          @click="exportCsv"
        >
          Export
        </VBtn>
        <VBtn
          v-if="!authStore.isArOnly"
          color="primary"
          prepend-icon="ri-upload-line"
          @click="openImport"
        >
          Import
        </VBtn>
        <VBtn
          v-if="!authStore.isArOnly"
          color="primary"
          prepend-icon="ri-add-line"
          @click="openCreate"
        >
          Tambah Investor
        </VBtn>
      </div>
    </PageHeader>

    <VCard ref="tableCard">
      <VCardText class="d-flex gap-4 pb-0">
        <VTextField
          v-model="params.search"
          placeholder="Cari nama, pengelola, kode/ID cabang..."
          clearable
          hide-details
          density="compact"
          style="max-width: 300px"
          prepend-inner-icon="ri-search-line"
          @update:model-value="debouncedFetch"
        />
        <VBtn
          icon
          variant="tonal"
          color="primary"
          density="compact"
          class="ms-auto"
          :loading="loading"
          @click="fetchList"
        >
          <VIcon icon="ri-refresh-line" />
          <VTooltip activator="parent">
            Refresh
          </VTooltip>
        </VBtn>
      </VCardText>

      <BaseTable
        :headers="headers"
        :items="items"
        :total="meta.total"
        :loading="loading"
        :per-page="meta.per_page"
        :page="meta.current_page"
        wrap-text
        show-select
        v-model:selected="selectedItems"
        class="mt-2"
        @update:options="onTableOptions"
      >
        <template #item.no="{ index }">
          {{ (meta.current_page - 1) * meta.per_page + index + 1 }}
        </template>
        <template #item.kode_cabang="{ item }">
          {{ item.kode_cabang ?? '-' }}
        </template>
        <template #item.id_cabang="{ item }">
          {{ item.id_cabang ?? '-' }}
        </template>
        <template #item.status="{ item }">
          <VChip
            :color="item.status ? 'success' : 'error'"
            size="small"
            label
          >
            {{ item.status ? 'Aktif' : 'Nonaktif' }}
          </VChip>
        </template>
        <template #item.created_by_name="{ item }">
          {{ item.created_by_name ?? '-' }}
        </template>
        <template #item.updated_by_name="{ item }">
          {{ item.updated_by_name ?? '-' }}
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
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
              v-if="!authStore.isArOnly"
              icon
              size="small"
              variant="text"
              color="primary"
              @click="openEdit(item)"
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
              v-if="!authStore.isArOnly"
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



    <!-- Detail Dialog -->
    <DetailDialog
      v-model="showDetail"
      title="Detail Investor"
    >
      <template #hero>
        <VAvatar
          size="88"
          color="primary"
          class="mb-3"
        >
          <span class="text-h4 font-weight-bold text-white">{{ selectedInvestor?.nama_investor?.charAt(0)?.toUpperCase() }}</span>
        </VAvatar>
        <div class="text-h6 font-weight-bold mb-2">
          {{ selectedInvestor?.nama_investor }}
        </div>
        <VChip
          :color="selectedInvestor?.status ? 'success' : 'error'"
          size="small"
          label
        >
          {{ selectedInvestor?.status ? 'Aktif' : 'Nonaktif' }}
        </VChip>
      </template>

      <DetailRow
        label="No. KTP"
        :value="selectedInvestor?.ktp"
      />
      <DetailRow
        label="NPWP"
        :value="selectedInvestor?.npwp"
      />
      <DetailRow
        label="No. HP"
        :value="selectedInvestor?.no_hp"
      />
      <DetailRow
        label="Nama Pengelola"
        :value="selectedInvestor?.pengelola"
      />
      <DetailRow
        label="No. HP Pengelola"
        :value="selectedInvestor?.no_hp_pengelola"
      />
      <DetailRow
        label="Kode Cabang"
        :value="selectedInvestor?.kode_cabang"
      />
      <DetailRow
        label="ID Cabang"
        :value="selectedInvestor?.id_cabang"
      />
      <DetailRow
        label="Created By"
        :value="selectedInvestor?.created_by_name"
      />
      <DetailRow
        label="Updated By"
        :value="selectedInvestor?.updated_by_name"
      />
      <DetailRow
        label="Created At"
        :value="selectedInvestor?.created_at"
      />
      <DetailRow
        label="Updated At"
        :value="selectedInvestor?.updated_at"
      />
    </DetailDialog>

    <!-- Confirm Delete -->
    <BaseModal
      v-if="showDelete"
      v-model="showDelete"
      title="Hapus Investor"
      :loading="loading"
      @confirm="doDelete"
    >
      <p>Apakah Anda yakin ingin menghapus investor <strong>{{ selectedInvestor?.nama_investor }}</strong>?</p>
      <VAlert
        v-if="deleteError"
        type="error"
        variant="tonal"
        class="mt-3"
      >
        {{ deleteError }}
      </VAlert>
    </BaseModal>

    <!-- Form Tambah / Edit Investor -->
    <InvestorForm
      v-model="showForm"
      :investor-data="selectedForm"
      @saved="onFormSaved"
    />

    <!-- Import Modal -->
    <VDialog
      v-model="showImport"
      max-width="560"
      persistent
    >
      <VCard>
        <VCardTitle class="d-flex align-center justify-space-between pa-4">
          <span>Import Data Investor</span>
          <div class="d-flex ga-1">
            <VBtn
              v-if="importing"
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
              @click="closeImport"
            >
              <VIcon icon="ri-close-line" />
            </VBtn>
          </div>
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
              <li>Download template Excel, isi data, lalu upload file (.xlsx atau .csv).</li>
              <li>Kolom <strong>nama_investor</strong> wajib diisi.</li>
              <li>Kolom <strong>status</strong>: 1 = Aktif, 0 = Nonaktif (default: 1).</li>
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
            :disabled="importing"
            @update:model-value="importResult = null"
          />

          <!-- Progress saat import berjalan di latar belakang -->
          <div
            v-if="importing && importProgress"
            class="mt-4"
          >
            <div class="d-flex align-center justify-space-between text-caption mb-1">
              <span>
                {{ importProgress.status === 'queued' ? 'Menunggu antrian…' : 'Memproses data…' }}
              </span>
              <span v-if="importProgress.progress_total > 0">
                {{ importProgress.processed }} / {{ importProgress.progress_total }} baris
              </span>
            </div>
            <VProgressLinear
              :model-value="importProgress.progress_total > 0 ? (importProgress.processed / importProgress.progress_total) * 100 : 0"
              :indeterminate="importProgress.status === 'queued' || !importProgress.progress_total"
              color="warning"
              height="8"
              rounded
            />
            <div class="text-caption text-medium-emphasis mt-1">
              Anda boleh menutup dialog ini — proses tetap berjalan di latar belakang.
            </div>
          </div>

          <div
            v-if="importResult"
            class="mt-4"
          >
            <VAlert
              :type="(importResult.total === 0 || importResult.failed > 0) ? 'warning' : 'success'"
              variant="tonal"
              class="mb-3"
            >
              Import selesai:
              <strong>{{ importResult.inserted }}</strong> ditambahkan,
              <strong>{{ importResult.updated }}</strong> diperbarui,
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
                    <th>Baris</th>
                    <th>Pesan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="err in importResult.errors"
                    :key="err.row"
                  >
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

    <BulkDeleteBar
      v-if="!authStore.isArOnly"
      :selected="selectedItems"
      @delete="doBulkDelete"
      @clear="selectedItems = []"
    />

    <!-- Floating Import Progress Widget (saat modal di-minimize) -->
    <Transition name="slide-up">
      <VCard
        v-if="isImportMinimized"
        elevation="8"
        rounded="lg"
        style="position: fixed; bottom: 24px; right: 24px; z-index: 2400; width: 300px; cursor: pointer;"
        @click="restoreImport"
      >
        <VCardText class="pa-3">
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="d-flex align-center ga-2">
              <VIcon
                :icon="importing ? 'ri-loader-4-line' : 'ri-checkbox-circle-line'"
                :color="importing ? 'warning' : 'success'"
                size="18"
              />
              <span class="text-subtitle-2 font-weight-medium">Import Investor</span>
            </div>
            <VBtn
              icon
              size="x-small"
              variant="text"
              @click.stop="closeImport"
            >
              <VIcon icon="ri-close-line" size="16" />
            </VBtn>
          </div>

          <template v-if="importing && importProgress">
            <VProgressLinear
              :model-value="importProgress.progress_total > 0
                ? (importProgress.processed / importProgress.progress_total) * 100
                : 0"
              :indeterminate="importProgress.status === 'queued' || !importProgress.progress_total"
              color="warning"
              height="6"
              rounded
              class="mb-1"
            />
            <div class="text-caption text-medium-emphasis">
              {{ importProgress.status === 'queued'
                ? 'Menunggu antrian…'
                : `${importProgress.processed} / ${importProgress.progress_total} baris diproses` }}
            </div>
          </template>

          <template v-else-if="importResult">
            <div class="text-caption">
              <strong>{{ importResult.inserted }}</strong> ditambahkan,
              <strong>{{ importResult.updated }}</strong> diperbarui,
              <strong>{{ importResult.failed }}</strong> gagal
            </div>
            <div class="text-caption text-primary mt-1">
              Klik untuk lihat detail →
            </div>
          </template>
        </VCardText>
      </VCard>
    </Transition>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useAuthStore } from '@/stores/auth.store'
import { useCrud } from '@/composables/useCrud'
import api from '@/utils/axios'
import BulkDeleteBar from '@/components/base/BulkDeleteBar.vue'

const authStore = useAuthStore()
const { showSuccess, showError, showLoading, closeAlert, confirmDelete: swalConfirmDelete } = useSweetAlert()
const { items, loading, meta, params, fetchList, remove } = useCrud('/master/investor')

const tableCard        = ref(null)
let prevItemsPerPage   = null

const showDelete       = ref(false)
const showDetail       = ref(false)
const showForm         = ref(false)
const deleteError      = ref('')
const selectedInvestor = ref(null)
const selectedForm     = ref(null)
const selectedItems    = ref([])

const exporting         = ref(false)
const showImport        = ref(false)
const importing         = ref(false)
const importFile        = ref(null)
const importResult      = ref(null)
const importProgress    = ref(null)
const isImportMinimized = ref(false)
let importPollTimer     = null

const headers = [
  { title: 'No',               key: 'no',               sortable: false, width: '60px' },
  { title: 'Nama Investor',    key: 'nama_investor',    sortable: false },
  { title: 'No. HP',           key: 'no_hp',            sortable: false },
  { title: 'Nama Pengelola',   key: 'pengelola',        sortable: false },
  { title: 'No. HP Pengelola', key: 'no_hp_pengelola',  sortable: false },
  { title: 'Kode Cabang',      key: 'kode_cabang',      sortable: false },
  { title: 'ID Cabang',        key: 'id_cabang',        sortable: false },
  { title: 'Status',           key: 'status',           sortable: false },
  { title: 'Created By',       key: 'created_by_name',  sortable: false },
  { title: 'Updated By',       key: 'updated_by_name',  sortable: false },
  { title: 'Aksi',             key: 'actions',          sortable: false, align: 'center', width: '120px' },
]

let debounceTimer = null
function debouncedFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { params.page = 1; fetchList() }, 400)
}

function onTableOptions({ page, itemsPerPage }) {
  const perPageChanged = prevItemsPerPage !== null && prevItemsPerPage !== itemsPerPage
  params.page = page
  params['per_page'] = itemsPerPage
  prevItemsPerPage = itemsPerPage
  fetchList()
  if (perPageChanged) {
    nextTick(() => tableCard.value?.$el?.scrollIntoView({ behavior: 'smooth' }))
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function openCreate()  { selectedForm.value = null; showForm.value = true }
function openEdit(inv) { selectedForm.value = inv;  showForm.value = true }
function onFormSaved() { showForm.value = false; fetchList() }
function openDetail(inv)  { selectedInvestor.value = inv;  showDetail.value = true }
function confirmDelete(inv) { selectedInvestor.value = inv; deleteError.value = ''; showDelete.value = true }

function openImport() {
  importFile.value     = null
  importResult.value   = null
  importProgress.value = null
  showImport.value     = true
}

function closeImport() {
  showImport.value        = false
  isImportMinimized.value = false
  stopImportPolling()
  importing.value      = false
  importProgress.value = null
  if ((importResult.value?.inserted > 0) || (importResult.value?.updated > 0)) fetchList()
}

function minimizeImport() {
  showImport.value        = false
  isImportMinimized.value = true
  // Polling TIDAK dihentikan — proses tetap dipantau di background
}

function restoreImport() {
  showImport.value        = true
  isImportMinimized.value = false
}

function stopImportPolling() {
  if (importPollTimer) {
    clearTimeout(importPollTimer)
    importPollTimer = null
  }
}

async function exportCsv() {
  exporting.value = true
  showLoading({ title: 'Mengeksport Data Investor', text: 'Mohon tunggu sebentar...' })
  try {
    const query  = new URLSearchParams()
    if (params.search) query.set('search', params.search)
    if (params.status !== undefined && params.status !== '') query.set('status', params.status)

    const res  = await api.get(`/master/investor/export?${query}`, { responseType: 'blob' })
    const url  = URL.createObjectURL(res.data)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `investor-${new Date().toISOString().slice(0, 10)}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
    showSuccess({ title: 'Export Berhasil!', text: 'File berhasil diunduh.' })
  } catch {
    await showError('Gagal mengunduh data.')
  } finally {
    exporting.value = false
    closeAlert({ onlyLoading: true })
  }
}

async function downloadTemplate() {
  try {
    const res  = await api.get('/master/investor/import-template', { responseType: 'blob' })
    const url  = URL.createObjectURL(res.data)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'template-investor.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    await showError('Gagal mengunduh template.')
  }
}

async function doImport() {
  if (!importFile.value) return
  importing.value      = true
  importResult.value   = null
  importProgress.value = { status: 'queued', processed: 0, progress_total: 0 }

  try {
    const formData = new FormData()
    formData.append('file', importFile.value)

    const res = await api.post('/master/investor/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    const batchId = res.data?.data?.batch_id
    if (!batchId) throw new Error('Batch import tidak valid.')

    importFile.value = null
    pollImportStatus(batchId)
  } catch (err) {
    const message = err?.response?.data?.message || 'Gagal mengimport data.'
    importing.value      = false
    importProgress.value = null
    await showError(message)
  }
}

function pollImportStatus(batchId) {
  stopImportPolling()
  importPollTimer = setTimeout(async () => {
    try {
      const res  = await api.get(`/master/investor/import/${batchId}/status`)
      const data = res.data?.data
      importProgress.value = data

      if (data.status === 'completed' || data.status === 'failed') {
        importing.value = false
        if (data.status === 'failed') {
          importProgress.value    = null
          await showError(data.message || 'Import gagal diproses.')
          isImportMinimized.value = false
        } else {
          importResult.value = data
          if ((data.inserted > 0) || (data.updated > 0)) fetchList()
        }
        return
      }
      pollImportStatus(batchId)
    } catch {
      // Lanjutkan polling; gangguan jaringan sementara tidak menghentikan proses server.
      pollImportStatus(batchId)
    }
  }, 1500)
}

async function doDelete() {
  deleteError.value = ''

  const deleteId = selectedInvestor.value?.id
  if (!deleteId) return

  showDelete.value = false
  await nextTick()

  const res = await remove(deleteId)
  if (res.success) {
    fetchList()
    await showSuccess('Investor berhasil dihapus.')
  } else {
    deleteError.value = res.message || 'Gagal menghapus data'
    await showError(deleteError.value)
  }
}

async function doBulkDelete() {
  if (!selectedItems.value.length) return
  const { isConfirmed } = await swalConfirmDelete(`Sebanyak ${selectedItems.value.length} data yang dipilih akan dihapus.`)
  if (!isConfirmed) return
  showLoading({ title: 'Menghapus Data', text: 'Mohon tunggu...' })
  try {
    const res = await api.delete('/master/investor/bulk', { data: { ids: selectedItems.value.map(i => i.id) } })
    const deleted = res.data?.data?.deleted ?? selectedItems.value.length
    selectedItems.value = []
    fetchList()
    await showSuccess(`${deleted} investor berhasil dihapus.`)
  } catch (err) {
    await showError(err.response?.data?.message ?? 'Gagal menghapus data')
  } finally {
    closeAlert({ onlyLoading: true })
  }
}

onMounted(() => fetchList())

onBeforeUnmount(() => {
  stopImportPolling()
})
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(16px);
  opacity: 0;
}
</style>
