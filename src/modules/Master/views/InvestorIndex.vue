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
          variant="outlined"
          color="success"
          prepend-icon="ri-download-line"
          :loading="exporting"
          @click="exportCsv"
        >
          Export CSV
        </VBtn>
        <VBtn
          v-if="!authStore.isArOnly && !authStore.isDirectorOnly"
          variant="outlined"
          color="warning"
          prepend-icon="ri-upload-line"
          @click="openImport"
        >
          Import CSV
        </VBtn>
        <VBtn
          v-if="!authStore.isArOnly && !authStore.isDirectorOnly"
          color="primary"
          prepend-icon="ri-add-line"
          @click="openCreate"
        >
          Tambah Investor
        </VBtn>
      </div>
    </PageHeader>

    <VCard>
      <VCardText class="d-flex gap-4 pb-0">
        <VTextField
          v-model="params.search"
          placeholder="Cari nama investor / pengelola..."
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
              v-if="!authStore.isArOnly && !authStore.isDirectorOnly"
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
              v-if="!authStore.isArOnly && !authStore.isDirectorOnly"
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
      width="400"
      temporary
    >
      <div class="d-flex align-center justify-space-between pa-4">
        <span class="text-h6 font-weight-semibold">Detail Investor</span>
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
        v-if="selectedInvestor"
        class="pa-4"
      >
        <div class="mb-4 text-center">
          <VAvatar
            size="72"
            color="primary"
            class="mb-3"
          >
            <span class="text-h5">{{ selectedInvestor.nama_investor?.charAt(0)?.toUpperCase() }}</span>
          </VAvatar>
          <div class="text-h6 font-weight-bold">
            {{ selectedInvestor.nama_investor }}
          </div>
        </div>
        <VDivider class="mb-4" />
        <DetailRow
          label="No. KTP"
          :value="selectedInvestor.ktp"
        />
        <DetailRow
          label="NPWP"
          :value="selectedInvestor.npwp"
        />
        <DetailRow
          label="No. HP"
          :value="selectedInvestor.no_hp"
        />
        <DetailRow
          label="Nama Pengelola"
          :value="selectedInvestor.pengelola"
        />
        <DetailRow
          label="No. HP Pengelola"
          :value="selectedInvestor.no_hp_pengelola"
        />
        <DetailRow
          label="Alamat"
          :value="selectedInvestor.alamat"
        />
        <DetailRow
          label="Keterangan"
          :value="selectedInvestor.keterangan"
        />
        <DetailRow label="Status">
          <VChip
            :color="selectedInvestor.status ? 'success' : 'error'"
            size="small"
            label
          >
            {{ selectedInvestor.status ? 'Aktif' : 'Nonaktif' }}
          </VChip>
        </DetailRow>
        <DetailRow
          label="Created By"
          :value="selectedInvestor.created_by_name"
        />
        <DetailRow
          label="Updated By"
          :value="selectedInvestor.updated_by_name"
        />
        <DetailRow
          label="Created At"
          :value="selectedInvestor.created_at"
        />
        <DetailRow
          label="Updated At"
          :value="selectedInvestor.updated_at"
        />
      </div>
    </VNavigationDrawer>

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

    <!-- Import Modal -->
    <VDialog
      v-model="showImport"
      max-width="560"
      persistent
    >
      <VCard>
        <VCardTitle class="d-flex align-center justify-space-between pa-4">
          <span>Import Data Investor</span>
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
              <li>Kolom <strong>nama_investor</strong> wajib diisi.</li>
              <li>Kolom <strong>status</strong>: 1 = Aktif, 0 = Nonaktif (default: 1).</li>
              <li>Lihat sheet <strong>Petunjuk Pengisian</strong> di template untuk panduan lengkap.</li>
              <li>Maksimum 500 baris per file.</li>
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
import { useRouter } from 'vue-router'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useAuthStore } from '@/stores/auth.store'
import { useCrud } from '@/composables/useCrud'
import api from '@/utils/axios'

const router = useRouter()
const authStore = useAuthStore()
const { showSuccess, showError } = useSweetAlert()
const { items, loading, meta, params, fetchList, remove } = useCrud('/master/investor')

const showDelete       = ref(false)
const showDetail       = ref(false)
const deleteError      = ref('')
const selectedInvestor = ref(null)

const exporting    = ref(false)
const showImport   = ref(false)
const importing    = ref(false)
const importFile   = ref(null)
const importResult = ref(null)

const headers = [
  { title: 'No',               key: 'no',               sortable: false, width: '60px' },
  { title: 'Nama Investor',    key: 'nama_investor',    sortable: false },
  { title: 'No. HP',           key: 'no_hp',            sortable: false },
  { title: 'Nama Pengelola',   key: 'pengelola',        sortable: false },
  { title: 'No. HP Pengelola', key: 'no_hp_pengelola',  sortable: false },
  { title: 'Alamat',           key: 'alamat',           sortable: false },
  { title: 'Keterangan',       key: 'keterangan',       sortable: false },
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
  params.page = page
  params['per_page'] = itemsPerPage
  fetchList()
}

function openCreate()     { router.push({ name: 'master-investor-create' }) }
function openEdit(inv)    { router.push({ name: 'master-investor-edit', params: { id: inv.id } }) }
function openDetail(inv)  { selectedInvestor.value = inv;  showDetail.value = true }
function confirmDelete(inv) { selectedInvestor.value = inv; deleteError.value = ''; showDelete.value = true }

function openImport() {
  importFile.value   = null
  importResult.value = null
  showImport.value   = true
}

function closeImport() {
  showImport.value = false
  if ((importResult.value?.inserted > 0) || (importResult.value?.updated > 0)) fetchList()
}

async function exportCsv() {
  exporting.value = true
  try {
    const query  = new URLSearchParams()
    if (params.search) query.set('search', params.search)
    if (params.status !== undefined && params.status !== '') query.set('status', params.status)

    const res  = await api.get(`/master/investor/export?${query}`, { responseType: 'blob' })
    const url  = URL.createObjectURL(res.data)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `investor-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    await showError('Gagal mengunduh data.')
  } finally {
    exporting.value = false
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
  importing.value    = true
  importResult.value = null

  try {
    const formData = new FormData()
    formData.append('file', importFile.value)

    const res = await api.post('/master/investor/import', formData, {
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

onMounted(() => fetchList())
</script>
