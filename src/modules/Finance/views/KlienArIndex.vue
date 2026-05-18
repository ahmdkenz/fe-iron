<template>
  <div>
    <PageHeader 
      title="Klien AR" 
      subtitle="Kelola data klien Account Receivable"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Klien AR', disabled: true }
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
          v-if="!authStore.isDirectorOnly && !authStore.isArOnly"
          color="primary"
          prepend-icon="ri-upload-line"
          @click="openImport"
        >
          Import
        </VBtn>
        <VBtn
          v-if="!authStore.isDirectorOnly"
          color="primary"
          prepend-icon="ri-add-line"
          @click="openCreate"
        >
          Tambah Klien
        </VBtn>
      </div>
    </PageHeader>

    <VCard>
      <VCardText class="d-flex flex-wrap align-center gap-4 pb-0">
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
        <VTextField
          v-model="params.search"
          placeholder="Cari kode / nama klien..."
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
        class="mt-2"
        wrap-text
        @update:options="onTableOptions"
      >
        <template #item.no="{ index }">
          {{ (meta.current_page - 1) * meta.per_page + index + 1 }}
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
        <template #item.segment="{ item }">
          <VChip
            :color="['RESTO','MITRA'].includes(item.tipe_klien) ? 'success' : 'info'"
            size="small"
            variant="tonal"
            label
          >
            {{ ['RESTO','MITRA'].includes(item.tipe_klien) ? 'B2C' : 'B2B' }}
          </VChip>
          <div class="text-caption text-medium-emphasis mt-1">
            {{ item.tipe_klien }}
          </div>
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
              {{ item.resto.investor.pengelola || item.resto.investor.nama_investor }}
            </div>
            <div
              v-if="item.resto.investor.pengelola"
              class="text-caption text-medium-emphasis"
            >
              {{ item.resto.investor.nama_investor }}
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
              v-if="!authStore.isDirectorOnly"
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
              v-if="!authStore.isDirectorOnly"
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
        <span class="text-h6 font-weight-semibold">Detail Klien AR</span>
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
          <span>Import Data Klien AR</span>
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
              <li>Kolom <strong>nama_klien</strong> dan <strong>tipe_klien</strong> wajib diisi.</li>
              <li>Kolom <strong>tipe_klien</strong>: isi persis <strong>RESTO / MITRA / PT / STOKIS</strong>.</li>
              <li>Untuk tipe RESTO/MITRA, kolom <strong>nama_resto</strong> wajib diisi sesuai data di sistem.</li>
              <li>Kolom <strong>nama_karyawan_ar</strong> wajib diisi sesuai nama karyawan di sistem.</li>
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

    <!-- Confirm Delete -->
    <BaseModal
      v-if="showDelete"
      v-model="showDelete"
      title="Hapus Klien AR"
      :loading="loading"
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
const { items, loading, meta, params, fetchList, remove } = useCrud('/finance/klien-ar')

const canSeeAll = authStore.hasAnyRole(['ADMIN', 'MANAGER', 'SUPERVISOR'])
if (!canSeeAll) {
  params.karyawan_ar_id = authStore.user?.karyawan?.id
}

const segment = ref('ALL')
const showAllItems = ref(false)

// Fetches with all=true when "All" is selected so backend returns every record.
// Meta per_page is forced to -1 afterward to keep the "All" indicator in the table.
async function doFetchList() {
  if (showAllItems.value) {
    await fetchList({ all: true })
    meta.per_page = -1
  } else {
    fetchList()
  }
}

function onSegmentChange(val) {
  params.segment = val === 'ALL' ? undefined : val
  params.page    = 1
  doFetchList()
}

const showDelete  = ref(false)
const showDetail  = ref(false)
const deleteError = ref('')
const selectedKlien = ref(null)

const exporting    = ref(false)
const showImport   = ref(false)
const importing    = ref(false)
const importFile   = ref(null)
const importResult = ref(null)

const headers = [
  { title: 'No',             key: 'no',          sortable: false, width: '60px' },
  { title: 'Kode',           key: 'kode_klien',  sortable: false, minWidth: '140px' },
  { title: 'Segment',        key: 'segment',     sortable: false, minWidth: '100px' },
  { title: 'Nama Pengelola', key: 'nama_klien',  sortable: false, minWidth: '200px' },
  { title: 'Resto',          key: 'resto',        sortable: false, minWidth: '160px' },
  { title: 'Investor / Pengelola', key: 'investor', sortable: false, minWidth: '180px' },
  { title: 'PIC AR',         key: 'karyawan_ar', sortable: false, minWidth: '160px' },
  { title: 'Status',         key: 'status',      sortable: false, minWidth: '90px' },
  { title: 'Aksi',           key: 'actions',     sortable: false, align: 'center', width: '120px' },
]

let debounceTimer = null
function debouncedFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { params.page = 1; doFetchList() }, 400)
}

function onTableOptions({ page, itemsPerPage }) {
  params.page = page
  if (itemsPerPage === -1) {
    showAllItems.value = true
  } else {
    showAllItems.value = false
    params['per_page'] = itemsPerPage
  }
  doFetchList()
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
  showImport.value = false
  if ((importResult.value?.inserted > 0) || (importResult.value?.updated > 0)) doFetchList()
}

async function exportExcel() {
  exporting.value = true
  try {
    const query = new URLSearchParams()
    if (params.search) query.set('search', params.search)
    if (params.status !== undefined && params.status !== '') query.set('status', params.status)
    if (segment.value && segment.value !== 'ALL') query.set('segment', segment.value)

    const res  = await api.get(`/finance/klien-ar/export?${query}`, { responseType: 'blob' })
    const url  = URL.createObjectURL(res.data)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `klien-ar-${new Date().toISOString().slice(0, 10)}.xlsx`
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

function shareWhatsApp(klien) {
  if (!klien.no_wa) return

  const phone = klien.no_wa
    .replace(/\D/g, '')
    .replace(/^0/, '62')

  const isB2C    = ['RESTO', 'MITRA'].includes(klien.tipe_klien)
  const segment  = isB2C ? 'B2C' : 'B2B'

  const lines = [
    '*📋 Data Klien AR*',
    '━━━━━━━━━━━━━━',
    `🔖 Kode: ${klien.kode_klien}`,
    `👤 Nama Billing: ${klien.nama_klien}`,
    `🏷️ Tipe: ${klien.tipe_klien} (${segment})`,
    klien.resto                          ? `🏪 Resto: ${klien.resto.nama_resto}`                            : null,
    klien.resto?.investor                ? `👥 Investor: ${klien.resto.investor.nama_investor}`              : null,
    klien.resto?.investor?.pengelola     ? `👤 Pengelola: ${klien.resto.investor.pengelola}`                 : null,
    `📊 Status: ${klien.status ? 'Aktif' : 'Nonaktif'}`,
    `👨‍💼 PIC AR: ${klien.karyawan_ar?.nama_karyawan ?? '-'}`,
    '━━━━━━━━━━━━━━',
  ].filter(Boolean).join('\n')

  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(lines)}`, '_blank')
}

async function doDelete() {
  deleteError.value = ''

  const deleteId = selectedKlien.value?.id
  if (!deleteId) return

  showDelete.value = false
  await nextTick()

  const res = await remove(deleteId)
  if (res.success) {
    doFetchList()
    await showSuccess('Klien AR berhasil dihapus.')
  } else {
    deleteError.value = res.message || 'Gagal menghapus data'
    await showError(deleteError.value)
  }
}

onMounted(() => fetchList())
</script>
