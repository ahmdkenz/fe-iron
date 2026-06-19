<template>
  <div>
    <PageHeader 
      title="Manajemen Resto" 
      subtitle="Kelola data restoran"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Resto', disabled: true }
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
          Tambah Resto
        </VBtn>
      </div>
    </PageHeader>

    <VCard ref="tableCard">
      <VCardText class="d-flex gap-4 pb-0">
        <VTextField
          v-model="params.search"
          placeholder="Cari kode / nama resto / kota..."
          clearable
          hide-details
          density="compact"
          style="max-width: 300px"
          prepend-inner-icon="ri-search-line"
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
        wrap-text
        class="mt-2"
        @update:options="onTableOptions"
      >
        <template #item.no="{ index }">
          {{ (meta.current_page - 1) * meta.per_page + index + 1 }}
        </template>
        <template #item.kode_resto="{ item }">
          <VChip
            color="primary"
            size="small"
            variant="tonal"
            label
          >
            {{ item.kode_resto }}
          </VChip>
        </template>
        <template #item.investor="{ item }">
          {{ item.investor?.nama_investor ?? '-' }}
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
        <template #item.brand="{ item }">
          <VChip
            v-if="item.brand"
            color="info"
            size="small"
            variant="tonal"
            label
          >
            {{ item.brand.nama_brand }}
          </VChip>
          <span v-else>-</span>
        </template>
        <template #item.pic="{ item }">
          {{ item.pic?.nama_karyawan ?? '-' }}
        </template>
        <template #item.tgl_aktif="{ item }">
          {{ item.tgl_aktif ? formatDate(item.tgl_aktif) : '-' }}
        </template>
        <template #item.supervisor="{ item }">
          {{ item.supervisor ?? '-' }}
        </template>
        <template #item.no_hp_supervisor="{ item }">
          {{ item.no_hp_supervisor ?? '-' }}
        </template>
        <template #item.stokis="{ item }">
          {{ item.stokis ?? '-' }}
        </template>
        <template #item.keterangan="{ item }">
          {{ item.keterangan ?? '-' }}
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
      title="Detail Resto"
    >
      <template #hero>
        <VAvatar
          size="88"
          color="primary"
          class="mb-3"
        >
          <span class="text-h4 font-weight-bold text-white">{{ selectedResto?.nama_resto?.charAt(0)?.toUpperCase() }}</span>
        </VAvatar>
        <div class="text-h6 font-weight-bold mb-2">
          {{ selectedResto?.nama_resto }}
        </div>
        <VChip
          color="primary"
          size="small"
          variant="tonal"
          label
        >
          {{ selectedResto?.kode_resto }}
        </VChip>
      </template>

      <DetailRow
        label="Investor"
        :value="selectedResto?.investor?.nama_investor"
      />
      <DetailRow
        label="Entitas"
        :value="selectedResto?.perusahaan?.nama_perusahaan"
      />
      <DetailRow
        label="Brand"
        :value="selectedResto?.brand?.nama_brand"
      />
      <DetailRow
        label="PIC"
        :value="selectedResto?.pic?.nama_karyawan"
      />
      <DetailRow
        label="Supervisor"
        :value="selectedResto?.supervisor"
      />
      <DetailRow
        label="No. HP SPV"
        :value="selectedResto?.no_hp_supervisor"
      />
      <DetailRow
        label="STOKIS"
        :value="selectedResto?.stokis"
      />
      <DetailRow
        label="Area"
        :value="selectedResto?.area"
      />
      <DetailRow
        label="Kota"
        :value="selectedResto?.kota"
      />
      <DetailRow
        label="Alamat"
        :value="selectedResto?.alamat"
      />
      <DetailRow
        label="No. Telp"
        :value="selectedResto?.no_telp"
      />
      <DetailRow
        label="Tanggal Aktif"
        :value="selectedResto?.tgl_aktif ? formatDate(selectedResto.tgl_aktif) : '-'"
      />
      <DetailRow
        label="Keterangan"
        :value="selectedResto?.keterangan"
      />
      <DetailRow label="Status">
        <VChip
          :color="selectedResto?.status ? 'success' : 'error'"
          size="small"
          label
        >
          {{ selectedResto?.status ? 'Aktif' : 'Nonaktif' }}
        </VChip>
      </DetailRow>
      <DetailRow
        label="Created By"
        :value="selectedResto?.created_by_name"
      />
      <DetailRow
        label="Updated By"
        :value="selectedResto?.updated_by_name"
      />
      <DetailRow
        label="Created At"
        :value="selectedResto?.created_at"
      />
      <DetailRow
        label="Updated At"
        :value="selectedResto?.updated_at"
      />
    </DetailDialog>

    <!-- Confirm Delete -->
    <BaseModal
      v-if="showDelete"
      v-model="showDelete"
      title="Hapus Resto"
      :loading="loading"
      @confirm="doDelete"
    >
      <p>Apakah Anda yakin ingin menghapus resto <strong>{{ selectedResto?.nama_resto }}</strong>?</p>
      <VAlert
        v-if="deleteError"
        type="error"
        variant="tonal"
        class="mt-3"
      >
        {{ deleteError }}
      </VAlert>
    </BaseModal>

    <!-- Form Tambah / Edit Resto -->
    <RestoForm
      v-model="showForm"
      :resto-data="selectedForm"
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
          <span>Import Data Resto</span>
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
              <li>Download template Excel, isi data, lalu upload file (.xlsx atau .csv).</li>
              <li>Kolom <strong>nama_resto</strong> dan <strong>kode_resto</strong> wajib diisi untuk data baru.</li>
              <li>Kolom <strong>kode_resto</strong> diisi manual (contoh: KD-001). Untuk data yang sudah ada, <strong>kode_resto tidak akan diperbarui</strong>.</li>
              <li>Kolom <strong>nama_investor</strong>, <strong>nama_entitas</strong>, <strong>nama_brand</strong>, <strong>nama_pic</strong> harus <strong>persis sama</strong> dengan data di sistem.</li>
              <li>Kolom <strong>tgl_aktif</strong> format: DD-MM-YYYY. Contoh: 15-01-2026.</li>
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
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref } from 'vue'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useAuthStore } from '@/stores/auth.store'
import { useCrud } from '@/composables/useCrud'
import api from '@/utils/axios'

const authStore = useAuthStore()
const { showSuccess, showError, showLoading, closeAlert } = useSweetAlert()
const { items, loading, meta, params, fetchList, remove } = useCrud('/master/resto')

const tableCard     = ref(null)
let prevItemsPerPage = null

const showDelete    = ref(false)
const showDetail    = ref(false)
const showForm      = ref(false)
const deleteError   = ref('')
const selectedResto = ref(null)
const selectedForm  = ref(null)

const exporting    = ref(false)
const showImport   = ref(false)
const importing    = ref(false)
const importFile   = ref(null)
const importResult = ref(null)

const headers = [
  { title: 'No',            key: 'no',              sortable: false, width: '60px' },
  { title: 'Kode Resto',    key: 'kode_resto',      sortable: false },
  { title: 'Nama Resto',    key: 'nama_resto',      sortable: false },
  { title: 'Investor',      key: 'investor',        sortable: false },
  { title: 'Entitas',       key: 'perusahaan',      sortable: false },
  { title: 'Brand',         key: 'brand',           sortable: false },
  { title: 'PIC',           key: 'pic',             sortable: false },
  { title: 'Supervisor',    key: 'supervisor',      sortable: false },
  { title: 'No. HP SPV',   key: 'no_hp_supervisor', sortable: false },
  { title: 'STOKIS',       key: 'stokis',          sortable: false },
  { title: 'Area',          key: 'area',            sortable: false },
  { title: 'Kota',          key: 'kota',            sortable: false },
  { title: 'Alamat',        key: 'alamat',          sortable: false },
  { title: 'No. Telp',      key: 'no_telp',         sortable: false },
  { title: 'Tanggal Aktif', key: 'tgl_aktif',       sortable: false },
  { title: 'Keterangan',    key: 'keterangan',      sortable: false },
  { title: 'Status',        key: 'status',          sortable: false },
  { title: 'Created By',    key: 'created_by_name', sortable: false },
  { title: 'Updated By',    key: 'updated_by_name', sortable: false },
  { title: 'Aksi',          key: 'actions',         sortable: false, align: 'center', width: '120px' },
]

function formatDate(d) {
  if (!d) return '-'
  const dt = new Date(d)
  
  return dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

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
function openEdit(r)   { selectedForm.value = r;    showForm.value = true }
function onFormSaved() { showForm.value = false; fetchList() }
function openDetail(r)     { selectedResto.value = r;    showDetail.value = true }
function confirmDelete(r)  { selectedResto.value = r;    deleteError.value = ''; showDelete.value = true }

function openImport() {
  importFile.value   = null
  importResult.value = null
  showImport.value   = true
}

function closeImport() {
  showImport.value = false
  fetchList()
}

async function exportCsv() {
  exporting.value = true
  showLoading({ title: 'Mengeksport Data Resto', text: 'Mohon tunggu sebentar...' })
  try {
    const query = new URLSearchParams()
    if (params.search) query.set('search', params.search)
    if (params.status !== undefined && params.status !== '') query.set('status', params.status)

    const res  = await api.get(`/master/resto/export?${query}`, { responseType: 'blob' })
    const url  = URL.createObjectURL(res.data)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `resto-${new Date().toISOString().slice(0, 10)}.xlsx`
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
    const res  = await api.get('/master/resto/import-template', { responseType: 'blob' })
    const url  = URL.createObjectURL(res.data)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'template-resto.xlsx'
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
  showLoading({ title: 'Mengimport Data Resto', text: 'Mohon tunggu sebentar...' })

  try {
    const formData = new FormData()
    formData.append('file', importFile.value)

    const res = await api.post('/master/resto/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    importResult.value = res.data.data
    importFile.value   = null
    if ((importResult.value?.inserted > 0) || (importResult.value?.updated > 0)) fetchList()
  } catch (err) {
    const message = err?.response?.data?.message || 'Gagal mengimport data.'
    await showError(message)
  } finally {
    importing.value = false
    closeAlert({ onlyLoading: true })
  }
}

async function doDelete() {
  deleteError.value = ''

  const deleteId = selectedResto.value?.id
  if (!deleteId) return

  showDelete.value = false
  await nextTick()

  const res = await remove(deleteId)
  if (res.success) {
    fetchList()
    await showSuccess('Resto berhasil dihapus.')
  } else {
    deleteError.value = res.message || 'Gagal menghapus data'
    await showError(deleteError.value)
  }
}

onMounted(() => {
  if (authStore.isArOnly && authStore.user?.karyawan_id) {
    params.karyawan_id = authStore.user.karyawan_id
  }
  fetchList()
})
</script>
