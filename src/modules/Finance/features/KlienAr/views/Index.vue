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
          color="primary"
          prepend-icon="ri-add-line"
          @click="openCreate"
        >
          Tambah Klien
        </VBtn>
      </div>
    </PageHeader>

    <!-- B2B Table (canSeeAll only) -->
    <VCard
      v-if="canSeeAll"
      class="mb-4"
    >
      <div class="d-flex align-center justify-space-between px-4 py-3">
        <div class="d-flex align-center gap-2">
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
        <VBtn
          variant="text"
          color="secondary"
          size="small"
          prepend-icon="ri-refresh-line"
          @click="resetFilterB2B"
        >
          Reset
        </VBtn>
      </div>
      <VDivider />
      <div class="d-flex flex-wrap align-center gap-4 px-4 py-3">
        <div style="min-width: 260px; flex: 1; max-width: 360px;">
          <div class="text-caption text-medium-emphasis mb-2">Pencarian</div>
          <VTextField
            v-model="searchB2B"
            placeholder="Cari kode / nama klien..."
            clearable
            hide-details
            density="compact"
            prepend-inner-icon="ri-search-line"
            @update:model-value="debouncedFetchB2B"
          />
        </div>
        <div style="min-width: 140px; max-width: 180px;">
          <div class="text-caption text-medium-emphasis mb-2">Status</div>
          <VSelect
            v-model="statusB2B"
            placeholder="Semua Status"
            clearable
            hide-details
            density="compact"
            :items="statusOptions"
            item-title="label"
            item-value="value"
            @update:model-value="debouncedFetchB2B"
          />
        </div>
      </div>
      <VDivider />
      <BaseTable
        :headers="headersB2B"
        :items="itemsB2B"
        :total="metaB2B.total"
        :loading="loadingB2B"
        :per-page="metaB2B.per_page"
        :page="metaB2B.current_page"
        wrap-text
        show-select
        v-model:selected="selectedB2B"
        column-resize-key="finance-klien-ar-b2b"
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
        <template #item.karyawan_ar="{ item }">
          {{ item.karyawan_ar?.nama_karyawan ?? '-' }}
        </template>
        <template #item.status="{ item }">
          <StatusChip :active="item.status" />
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
        class="d-flex align-center justify-space-between px-4 py-3"
      >
        <div class="d-flex align-center gap-2">
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
        <VBtn
          variant="text"
          color="secondary"
          size="small"
          prepend-icon="ri-refresh-line"
          @click="resetFilterB2C"
        >
          Reset
        </VBtn>
      </div>
      <VDivider v-if="canSeeAll" />
      <div class="d-flex flex-wrap align-center gap-4 px-4 py-3">
        <div style="min-width: 260px; flex: 1; max-width: 360px;">
          <div class="text-caption text-medium-emphasis mb-2">Pencarian</div>
          <VTextField
            v-model="searchB2C"
            placeholder="Cari kode / nama klien..."
            clearable
            hide-details
            density="compact"
            prepend-inner-icon="ri-search-line"
            @update:model-value="debouncedFetchB2C"
          />
        </div>
        <div style="min-width: 140px; max-width: 180px;">
          <div class="text-caption text-medium-emphasis mb-2">Status</div>
          <VSelect
            v-model="statusB2C"
            placeholder="Semua Status"
            clearable
            hide-details
            density="compact"
            :items="statusOptions"
            item-title="label"
            item-value="value"
            @update:model-value="debouncedFetchB2C"
          />
        </div>
      </div>
      <VDivider />
      <BaseTable
        :headers="headersB2C"
        :items="itemsB2C"
        :total="metaB2C.total"
        :loading="loadingB2C"
        :per-page="metaB2C.per_page"
        :page="metaB2C.current_page"
        wrap-text
        show-select
        v-model:selected="selectedB2C"
        column-resize-key="finance-klien-ar-b2c"
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
          <StatusChip :active="item.status" />
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
          label="Outlet"
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
          :label="selectedKlien.client_contact_source === 'investor' ? 'No. NPWP (Investor)' : selectedKlien.client_contact_source === 'perusahaan' ? 'No. NPWP (Perusahaan)' : 'No. NPWP'"
          :value="selectedKlien.client_npwp"
        />
        <DetailRow
          :label="selectedKlien.tipe_klien === 'RESTO' ? 'No. HP Investor' : selectedKlien.tipe_klien === 'PT' ? 'No. Telp Perusahaan' : 'No. WhatsApp'"
          :value="selectedKlien.client_contact_phone"
        />
        <DetailRow
          v-if="selectedKlien.no_wa && selectedKlien.no_wa !== selectedKlien.client_contact_phone"
          label="No. WhatsApp (Fallback)"
          :value="selectedKlien.no_wa"
        />
        <DetailRow
          label="PIC AR"
          :value="selectedKlien.karyawan_ar?.nama_karyawan"
        />
        <DetailRow label="Status">
          <StatusChip :active="selectedKlien.status" />
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

    <!-- Confirm Delete -->
    <BaseModal
      v-if="showDelete"
      v-model="showDelete"
      title="Hapus Client"
      :loading="loadingB2C"
      confirm-action="hapus"
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

    <BulkDeleteBar
      :selected="selectedKlienAll"
      @delete="doBulkDelete"
      @clear="clearAllSelected"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onDeactivated, onMounted, ref } from 'vue'

import { useRouter } from 'vue-router'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useAuthStore } from '@/stores/auth.store'
import { useCrud } from '@/composables/useCrud'
import api from '@/utils/axios'
import BulkDeleteBar from '@/components/base/BulkDeleteBar.vue'

const router = useRouter()
const authStore = useAuthStore()
const { showSuccess, showError, showLoading, closeAlert, confirmDelete: swalConfirmDelete } = useSweetAlert()

const { items: itemsB2C, loading: loadingB2C, meta: metaB2C, params: paramsB2C, fetchList: fetchListB2C, remove } = useCrud('/finance/klien-ar')
const { items: itemsB2B, loading: loadingB2B, meta: metaB2B, params: paramsB2B, fetchList: fetchListB2B } = useCrud('/finance/klien-ar')

const canSeeAll = authStore.hasAnyRole(['ADMIN', 'MANAGER', 'SUPERVISOR'])

if (!canSeeAll) {
  paramsB2C.karyawan_ar_id = authStore.user?.karyawan?.id
}

const searchB2B = ref('')
const statusB2B = ref(null)
const searchB2C = ref('')
const statusB2C = ref(null)

const showDelete      = ref(false)
const showDetail      = ref(false)
const deleteError     = ref('')
const selectedKlien   = ref(null)

const selectedB2B     = ref([])
const selectedB2C     = ref([])
const selectedKlienAll = computed(() => [...selectedB2B.value, ...selectedB2C.value])

function clearAllSelected() {
  selectedB2B.value = []
  selectedB2C.value = []
}

const exporting = ref(false)

const headersB2B = [
  { title: 'No',           key: 'no',          sortable: false, width: '60px' },
  { title: 'Kode Client',  key: 'kode_klien',  sortable: false, minWidth: '140px' },
  { title: 'Nama Billing', key: 'nama_klien',  sortable: false, minWidth: '200px' },
  { title: 'PIC AR',       key: 'karyawan_ar', sortable: false, minWidth: '160px' },
  { title: 'Status',       key: 'status',      sortable: false, minWidth: '90px' },
  { title: 'Aksi',         key: 'actions',     sortable: false, align: 'center', width: '120px' },
]

const headersB2C = [
  { title: 'No',                   key: 'no',          sortable: false, width: '60px' },
  { title: 'Kode Client',          key: 'kode_klien',  sortable: false, minWidth: '140px' },
  { title: 'Nama Billing',         key: 'nama_klien',  sortable: false, minWidth: '200px' },
  { title: 'Outlet',                key: 'resto',        sortable: false, minWidth: '160px' },
  { title: 'Investor / Pengelola', key: 'investor',    sortable: false, minWidth: '180px' },
  { title: 'PIC AR',               key: 'karyawan_ar', sortable: false, minWidth: '160px' },
  { title: 'Status',               key: 'status',      sortable: false, minWidth: '90px' },
  { title: 'Aksi',                 key: 'actions',     sortable: false, align: 'center', width: '120px' },
]

const statusOptions = [
  { label: 'Aktif',    value: 1 },
  { label: 'Nonaktif', value: 0 },
]

function applyFilterB2C() {
  paramsB2C.search = searchB2C.value
  paramsB2C.status = statusB2C.value ?? ''
}

function applyFilterB2B() {
  paramsB2B.search = searchB2B.value
  paramsB2B.status = statusB2B.value ?? ''
}

function loadListB2C() { fetchListB2C({ segment: canSeeAll ? 'B2C' : undefined }) }
function loadListB2B() { if (canSeeAll) fetchListB2B({ segment: 'B2B' }) }

let debounceTimerB2C = null
let debounceTimerB2B = null

function debouncedFetchB2C() {
  clearTimeout(debounceTimerB2C)
  debounceTimerB2C = setTimeout(() => {
    applyFilterB2C()
    paramsB2C.page = 1
    loadListB2C()
  }, 400)
}

function debouncedFetchB2B() {
  clearTimeout(debounceTimerB2B)
  debounceTimerB2B = setTimeout(() => {
    applyFilterB2B()
    paramsB2B.page = 1
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

function resetFilterB2C() {
  searchB2C.value = ''
  statusB2C.value = null
  applyFilterB2C()
  paramsB2C.page  = 1
  loadListB2C()
}

function resetFilterB2B() {
  searchB2B.value = ''
  statusB2B.value = null
  applyFilterB2B()
  paramsB2B.page  = 1
  loadListB2B()
}

function openCreate()      { router.push({ name: 'finance-klien-ar-create' }) }
function openEdit(k)       { router.push({ name: 'finance-klien-ar-edit', params: { id: k.id } }) }
function openDetail(k)     { selectedKlien.value = k;    showDetail.value = true }
function confirmDelete(k)  { selectedKlien.value = k;    deleteError.value = ''; showDelete.value = true }

// Detail drawer / delete modal teleports (VNavigationDrawer, VDialog) survive
// keep-alive deactivation, so force-close them to avoid a stuck scrim on other pages.
onDeactivated(() => {
  showDetail.value = false
  showDelete.value = false
})

async function exportExcel() {
  exporting.value = true
  showLoading({ title: 'Mengeksport Data Klien AR', text: 'Mohon tunggu sebentar...' })
  try {
    const query = new URLSearchParams()
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

async function doBulkDelete() {
  if (!selectedKlienAll.value.length) return
  const { isConfirmed } = await swalConfirmDelete(`Sebanyak ${selectedKlienAll.value.length} data yang dipilih akan dihapus.`)
  if (!isConfirmed) return
  showLoading({ title: 'Menghapus Data', text: 'Mohon tunggu...' })
  try {
    const res = await api.delete('/finance/klien-ar/bulk', { data: { ids: selectedKlienAll.value.map(i => i.id) } })
    const deleted = res.data?.data?.deleted ?? selectedKlienAll.value.length
    clearAllSelected()
    loadListB2C()
    loadListB2B()
    await showSuccess(`${deleted} client berhasil dihapus.`)
  } catch (err) {
    await showError(err.response?.data?.message ?? 'Gagal menghapus data')
  } finally {
    closeAlert({ onlyLoading: true })
  }
}

onBeforeUnmount(() => {
  clearTimeout(debounceTimerB2C)
  clearTimeout(debounceTimerB2B)
})

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
