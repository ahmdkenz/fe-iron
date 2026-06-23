<template>
  <div>
    <PageHeader
      title="Client"
      subtitle="Kelola data klien Account Receivable"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Client', disabled: true }
      ]"
    >
      <div class="d-flex gap-2">
        <VBtn
          color="primary"
          prepend-icon="ri-file-excel-line"
          :loading="exporting"
          @click="exportExcel"
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
          color="primary"
          prepend-icon="ri-add-line"
          @click="openCreate"
        >
          Tambah Klien
        </VBtn>
      </div>
    </PageHeader>

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
          <div style="min-width: 260px; flex: 1; max-width: 360px;">
            <div class="text-caption text-medium-emphasis mb-2">Pencarian</div>
            <VTextField
              v-model="search"
              placeholder="Cari kode / nama klien..."
              clearable
              hide-details
              density="compact"
              prepend-inner-icon="ri-search-line"
              @update:model-value="debouncedFetch"
            />
          </div>
        </div>
      </VCardText>
    </VCard>

    <!-- B2B Table (canSeeAll only) -->
    <VCard
      v-if="canSeeAll"
      class="mb-4"
    >
      <div class="d-flex align-center gap-2 px-4 py-3">
        <VAvatar
          color="warning"
          variant="tonal"
          size="32"
        >
          <VIcon
            icon="ri-building-line"
            size="18"
          />
        </VAvatar>
        <span class="text-subtitle-1 font-weight-semibold">Client B2B</span>
      </div>
      <VDivider />
      <BaseTable
        :headers="headers"
        :items="itemsB2B"
        :total="metaB2B.total"
        :loading="loadingB2B"
        :per-page="metaB2B.per_page"
        :page="metaB2B.current_page"
        wrap-text
        @update:options="onTableOptionsB2B"
      >
        <template #item.no="{ index }">
          {{ (metaB2B.current_page - 1) * metaB2B.per_page + index + 1 }}
        </template>
        <template #item.kode_klien="{ item }">
          <VChip
            color="primary"
            size="small"
            variant="tonal"
            label
          >
            {{ item.kode_klien }}
          </VChip>
        </template>
        <template #item.resto="{ item }">
          <span v-if="item.resto">{{ item.resto.nama_resto }}</span>
          <span
            v-else
            class="text-medium-emphasis"
          >-</span>
        </template>
        <template #item.investor="{ item }">
          <div v-if="item.resto?.investor">
            <div class="text-body-2">
              {{ item.resto.investor.nama_investor }}
            </div>
            <div
              v-if="item.resto.investor.pengelola && item.resto.investor.pengelola !== item.resto.investor.nama_investor"
              class="text-caption text-medium-emphasis"
            >
              Pengelola: {{ item.resto.investor.pengelola }}
            </div>
          </div>
          <span
            v-else
            class="text-medium-emphasis"
          >-</span>
        </template>
        <template #item.karyawan_ar="{ item }">
          {{ item.karyawan_ar?.nama_karyawan ?? '-' }}
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

    <!-- B2C Table -->
    <VCard>
      <div
        v-if="canSeeAll"
        class="d-flex align-center gap-2 px-4 py-3"
      >
        <VAvatar
          color="primary"
          variant="tonal"
          size="32"
        >
          <VIcon
            icon="ri-user-line"
            size="18"
          />
        </VAvatar>
        <span class="text-subtitle-1 font-weight-semibold">Client B2C</span>
      </div>
      <VDivider v-if="canSeeAll" />
      <BaseTable
        :headers="headers"
        :items="itemsB2C"
        :total="metaB2C.total"
        :loading="loadingB2C"
        :per-page="metaB2C.per_page"
        :page="metaB2C.current_page"
        wrap-text
        @update:options="onTableOptionsB2C"
      >
        <template #item.no="{ index }">
          {{ (metaB2C.current_page - 1) * metaB2C.per_page + index + 1 }}
        </template>
        <template #item.kode_klien="{ item }">
          <VChip
            color="primary"
            size="small"
            variant="tonal"
            label
          >
            {{ item.kode_klien }}
          </VChip>
        </template>
        <template #item.resto="{ item }">
          <span v-if="item.resto">{{ item.resto.nama_resto }}</span>
          <span
            v-else
            class="text-medium-emphasis"
          >-</span>
        </template>
        <template #item.investor="{ item }">
          <div v-if="item.resto?.investor">
            <div class="text-body-2">
              {{ item.resto.investor.nama_investor }}
            </div>
            <div
              v-if="item.resto.investor.pengelola && item.resto.investor.pengelola !== item.resto.investor.nama_investor"
              class="text-caption text-medium-emphasis"
            >
              Pengelola: {{ item.resto.investor.pengelola }}
            </div>
          </div>
          <span
            v-else
            class="text-medium-emphasis"
          >-</span>
        </template>
        <template #item.karyawan_ar="{ item }">
          {{ item.karyawan_ar?.nama_karyawan ?? '-' }}
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

    <!-- Detail Drawer -->
    <VNavigationDrawer
      v-if="showDetail"
      v-model="showDetail"
      location="right"
      width="420"
      temporary
    >
      <div class="d-flex align-center justify-space-between pa-4">
        <span class="text-h6 font-weight-semibold">Detail Client</span>
        <VBtn
          icon
          size="small"
          variant="text"
          @click="showDetail = false"
        >
          <VIcon icon="ri-close-line" />
        </VBtn>
      </div>
      <VDivider />
      <div
        v-if="selectedKlien"
        class="pa-4"
      >
        <div class="mb-4 text-center">
          <VAvatar
            size="72"
            color="primary"
            class="mb-3"
          >
            <span class="text-h5">{{ selectedKlien.nama_klien?.charAt(0)?.toUpperCase() }}</span>
          </VAvatar>
          <div class="text-h6 font-weight-bold">
            {{ selectedKlien.nama_klien }}
          </div>
          <VChip
            color="primary"
            size="small"
            variant="tonal"
            label
            class="mt-1"
          >
            {{ selectedKlien.kode_klien }}
          </VChip>
        </div>
        <VDivider class="mb-4" />
        <DetailRow
          label="Resto"
          :value="selectedKlien.resto?.nama_resto"
        />
        <DetailRow
          label="Investor"
          :value="selectedKlien.resto?.investor?.nama_investor"
        />
        <DetailRow
          label="HP Investor"
          :value="selectedKlien.resto?.investor?.no_hp"
        />
        <DetailRow
          label="Pengelola"
          :value="selectedKlien.resto?.investor?.pengelola"
        />
        <DetailRow
          label="HP Pengelola"
          :value="selectedKlien.resto?.investor?.no_hp_pengelola"
        />
        <DetailRow
          label="No. NPWP"
          :value="selectedKlien.no_npwp"
        />
        <DetailRow
          label="No. WhatsApp"
          :value="selectedKlien.no_wa"
        />
        <DetailRow
          label="PIC AR"
          :value="selectedKlien.karyawan_ar?.nama_karyawan"
        />
        <DetailRow label="Status">
          <VChip
            :color="selectedKlien.status ? 'success' : 'error'"
            size="small"
            label
          >
            {{ selectedKlien.status ? 'Aktif' : 'Nonaktif' }}
          </VChip>
        </DetailRow>
        <DetailRow
          label="Created By"
          :value="selectedKlien.created_by_name"
        />
        <DetailRow
          label="Updated By"
          :value="selectedKlien.updated_by_name"
        />

      </div>
    </VNavigationDrawer>

    <!-- Import Modal -->
    <VDialog
      v-model="showImport"
      max-width="560"
      persistent
    >
      <VCard>
        <VCardTitle class="d-flex align-center justify-space-between pa-4">
          <span>Import Data Client</span>
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
              <li>Kolom <strong>kode_klien</strong>, <strong>nama_klien</strong>, dan <strong>tipe_klien</strong> wajib diisi.</li>
              <li>Kolom <strong>nama_klien</strong>: isi <strong>nama investor/pengelola</strong> (untuk B2C/RESTO) atau nama kontak billing PT (untuk B2B/PT).</li>
              <li>Kolom <strong>kode_klien</strong>: isi kode unik klien, format <strong>AR-B2C-xxx</strong> (B2C) atau <strong>AR-B2B-xxx</strong> (B2B).</li>
              <li>Kolom <strong>tipe_klien</strong>: isi persis <strong>RESTO</strong> (B2C) atau <strong>PT</strong> (B2B).</li>
              <li>Untuk tipe RESTO, kolom <strong>nama_resto</strong> wajib diisi sesuai data di sistem.</li>
              <li>Kolom <strong>nama_karyawan_ar</strong> wajib diisi sesuai nama karyawan di sistem.</li>
              <li>Untuk tipe PT, kolom <strong>nama_entitas</strong> wajib diisi persis sesuai nama perusahaan di sistem.</li>
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

          <!-- Loading indicator saat import berjalan -->
          <div
            v-if="importing"
            class="mt-4"
          >
            <VProgressLinear
              indeterminate
              color="primary"
              height="8"
              rounded
            />
            <div class="text-caption text-medium-emphasis mt-1">
              Sedang mengimport data, mohon tunggu…
            </div>
          </div>

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

    <!-- Confirm Delete -->
    <BaseModal
      v-if="showDelete"
      v-model="showDelete"
      title="Hapus Client"
      :loading="loadingB2C"
      @confirm="doDelete"
    >
      <p>
        Apakah Anda yakin ingin menghapus klien
        <strong>{{ selectedKlien?.nama_klien }}</strong>?
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

    <!-- Floating Import Loading Widget (saat modal di-minimize) -->
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
                :color="importing ? 'primary' : 'success'"
                size="18"
              />
              <span class="text-subtitle-2 font-weight-medium">Import Client</span>
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

          <template v-if="importing">
            <VProgressLinear
              indeterminate
              color="primary"
              height="6"
              rounded
              class="mb-1"
            />
            <div class="text-caption text-medium-emphasis">
              Sedang mengimport data...
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
import { nextTick, onMounted, ref } from 'vue'

import { useRouter } from 'vue-router'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useAuthStore } from '@/stores/auth.store'
import { useCrud } from '@/composables/useCrud'
import api from '@/utils/axios'

const router = useRouter()
const authStore = useAuthStore()
const { showSuccess, showError, showLoading, closeAlert } = useSweetAlert()

const { items: itemsB2C, loading: loadingB2C, meta: metaB2C, params: paramsB2C, fetchList: fetchListB2C, remove } = useCrud('/finance/klien-ar')
const { items: itemsB2B, loading: loadingB2B, meta: metaB2B, params: paramsB2B, fetchList: fetchListB2B } = useCrud('/finance/klien-ar')

const canSeeAll = authStore.hasAnyRole(['ADMIN', 'MANAGER', 'SUPERVISOR'])

if (!canSeeAll) {
  paramsB2C.karyawan_ar_id = authStore.user?.karyawan?.id
}

const search = ref('')

const showDelete      = ref(false)
const showDetail      = ref(false)
const deleteError     = ref('')
const selectedKlien   = ref(null)

const exporting         = ref(false)
const showImport        = ref(false)
const importing         = ref(false)
const importFile        = ref(null)
const importResult      = ref(null)
const isImportMinimized = ref(false)

const headers = [
  { title: 'No',             key: 'no',          sortable: false, width: '60px' },
  { title: 'Kode Client',    key: 'kode_klien',  sortable: false, minWidth: '140px' },
  { title: 'Nama Billing',   key: 'nama_klien',  sortable: false, minWidth: '200px' },
  { title: 'Resto',          key: 'resto',        sortable: false, minWidth: '160px' },
  { title: 'Investor / Pengelola', key: 'investor', sortable: false, minWidth: '180px' },
  { title: 'PIC AR',         key: 'karyawan_ar', sortable: false, minWidth: '160px' },
  { title: 'Status',         key: 'status',      sortable: false, minWidth: '90px' },
  { title: 'Aksi',           key: 'actions',     sortable: false, align: 'center', width: '120px' },
]

function applySearch() {
  paramsB2C.search = search.value
  if (canSeeAll) paramsB2B.search = search.value
}

function loadListB2C() { fetchListB2C({ segment: canSeeAll ? 'B2C' : undefined }) }
function loadListB2B() { if (canSeeAll) fetchListB2B({ segment: 'B2B' }) }

let debounceTimer = null
function debouncedFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    applySearch()
    paramsB2C.page = 1
    if (canSeeAll) paramsB2B.page = 1
    loadListB2C()
    loadListB2B()
  }, 400)
}

function onTableOptionsB2C({ page, itemsPerPage }) {
  paramsB2C.page = page
  paramsB2C.per_page = itemsPerPage
  loadListB2C()
}

function onTableOptionsB2B({ page, itemsPerPage }) {
  paramsB2B.page = page
  paramsB2B.per_page = itemsPerPage
  loadListB2B()
}

function resetFilter() {
  search.value  = ''
  applySearch()
  paramsB2C.page = 1
  if (canSeeAll) paramsB2B.page = 1
  loadListB2C()
  loadListB2B()
}

function openCreate()      { router.push({ name: 'finance-klien-ar-create' }) }
function openEdit(k)       { router.push({ name: 'finance-klien-ar-edit', params: { id: k.id } }) }
function openDetail(k)     { selectedKlien.value = k;    showDetail.value = true }
function confirmDelete(k)  { selectedKlien.value = k;    deleteError.value = ''; showDelete.value = true }

function openImport() {
  importFile.value   = null
  importResult.value = null
  showImport.value   = true
}

function closeImport() {
  showImport.value        = false
  isImportMinimized.value = false
  if ((importResult.value?.inserted > 0) || (importResult.value?.updated > 0)) {
    loadListB2C()
    loadListB2B()
  }
}

function minimizeImport() {
  showImport.value        = false
  isImportMinimized.value = true
}

function restoreImport() {
  showImport.value        = true
  isImportMinimized.value = false
}

async function exportExcel() {
  exporting.value = true
  showLoading({ title: 'Mengeksport Data Klien AR', text: 'Mohon tunggu sebentar...' })
  try {
    const query = new URLSearchParams()
    if (search.value) query.set('search', search.value)
    if (paramsB2C.karyawan_ar_id) query.set('karyawan_ar_id', paramsB2C.karyawan_ar_id)

    const res  = await api.get(`/finance/klien-ar/export?${query}`, { responseType: 'blob' })
    const url  = URL.createObjectURL(res.data)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `klien-ar-${new Date().toISOString().slice(0, 10)}.xlsx`
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
    const res  = await api.get('/finance/klien-ar/import-template', { responseType: 'blob' })
    const url  = URL.createObjectURL(res.data)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'template-klien-ar.xlsx'
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

  try {
    const formData = new FormData()
    formData.append('file', importFile.value)

    const res = await api.post('/finance/klien-ar/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    importResult.value = res.data.data
    importFile.value   = null
  } catch (err) {
    const message = err?.response?.data?.message || 'Gagal mengimport data.'
    await showError(message)
  } finally {
    importing.value = false
  }
}

async function doDelete() {
  deleteError.value = ''

  const deleteId = selectedKlien.value?.id
  if (!deleteId) return

  showDelete.value = false
  await nextTick()

  const res = await remove(deleteId)
  if (res.success) {
    loadListB2C()
    loadListB2B()
    await showSuccess('Client berhasil dihapus.')
  } else {
    deleteError.value = res.message || 'Gagal menghapus data'
    await showError(deleteError.value)
  }
}

onMounted(() => {
  loadListB2C()
  loadListB2B()
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
