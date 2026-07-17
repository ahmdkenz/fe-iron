<template>
  <div>
    <PageHeader
      title="Vendor"
      subtitle="Kelola data vendor/pemasok Account Payable"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Vendor', disabled: true }
      ]"
    >
      <VBtn
        v-if="authStore.canOperateVendorAp"
        color="primary"
        prepend-icon="ri-add-line"
        @click="openCreate"
      >
        Tambah Vendor
      </VBtn>
    </PageHeader>

    <VCard>
      <VCardText class="d-flex flex-wrap gap-3 pb-0">
        <VTextField
          v-model="params.search"
          placeholder="Cari kode / nama vendor / NPWP..."
          clearable
          hide-details
          density="compact"
          style="max-width: 280px"
          prepend-inner-icon="ri-search-line"
          @update:model-value="debouncedFetch"
        />
        <VSelect
          v-model="params.status"
          placeholder="Semua Status"
          clearable
          hide-details
          density="compact"
          style="max-width: 180px"
          :items="statusOptions"
          item-title="label"
          item-value="value"
          @update:model-value="doFetch"
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
        show-select
        v-model:selected="selected"
        column-resize-key="ap-vendor-index"
        @update:options="onTableOptions"
      >
        <template #item.no="{ index }">
          {{ (meta.current_page - 1) * meta.per_page + index + 1 }}
        </template>
        <template #item.kode_vendor="{ item }">
          <VChip color="primary" size="small" variant="tonal" label>
            {{ item.kode_vendor }}
          </VChip>
        </template>
        <template #item.karyawan_ap="{ item }">
          {{ item.karyawan_ap?.nama_karyawan ?? '-' }}
        </template>
        <template #item.status="{ item }">
          <StatusChip :active="item.status" />
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <VBtn icon size="small" variant="text" color="info" @click="openDetail(item)">
              <VIcon icon="ri-eye-line" size="18" />
              <VTooltip activator="parent">Detail</VTooltip>
            </VBtn>
            <VBtn
              v-if="authStore.canOperateVendorAp"
              icon
              size="small"
              variant="text"
              color="primary"
              @click="openEdit(item)"
            >
              <VIcon icon="ri-pencil-line" size="18" />
              <VTooltip activator="parent">Edit</VTooltip>
            </VBtn>
            <VBtn
              v-if="authStore.canOperateVendorAp"
              icon
              size="small"
              variant="text"
              color="error"
              @click="confirmDeleteItem(item)"
            >
              <VIcon icon="ri-delete-bin-line" size="18" />
              <VTooltip activator="parent">Hapus</VTooltip>
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
        <span class="text-h6 font-weight-semibold">Detail Vendor</span>
        <VBtn icon size="small" variant="text" @click="showDetail = false">
          <VIcon icon="ri-close-line" />
        </VBtn>
      </div>
      <VDivider />
      <div v-if="selectedVendor" class="pa-4">
        <div class="mb-4 text-center">
          <VAvatar size="72" color="primary" class="mb-3">
            <span class="text-h5">{{ selectedVendor.nama_vendor?.charAt(0)?.toUpperCase() }}</span>
          </VAvatar>
          <div class="text-h6 font-weight-bold">{{ selectedVendor.nama_vendor }}</div>
          <VChip color="primary" size="small" variant="tonal" label class="mt-1">
            {{ selectedVendor.kode_vendor }}
          </VChip>
        </div>
        <VDivider class="mb-4" />
        <DetailRow label="NPWP" :value="selectedVendor.no_npwp" />
        <DetailRow label="PKP">
          {{ selectedVendor.status_pkp ? 'PKP' : 'Non-PKP' }}
        </DetailRow>
        <DetailRow label="Bank" :value="selectedVendor.bank_nama" />
        <DetailRow label="No. Rekening" :value="selectedVendor.bank_no_rekening" />
        <DetailRow label="Atas Nama" :value="selectedVendor.bank_atas_nama" />
        <DetailRow label="PIC AP" :value="selectedVendor.karyawan_ap?.nama_karyawan" />
        <DetailRow label="Status">
          <StatusChip :active="selectedVendor.status" />
        </DetailRow>
      </div>
    </VNavigationDrawer>

    <!-- Confirm Delete -->
    <BaseModal
      v-if="showDelete"
      v-model="showDelete"
      title="Hapus Vendor"
      :loading="loading"
      confirm-action="hapus"
      @confirm="doDelete"
    >
      <p>
        Apakah Anda yakin ingin menghapus vendor
        <strong>{{ selectedVendor?.nama_vendor }}</strong>?
      </p>
      <VAlert type="warning" variant="tonal" density="compact" class="mt-3">
        Tindakan ini tidak dapat diurungkan — data akan dihapus permanen dari database.
      </VAlert>
      <VAlert v-if="deleteError" type="error" variant="tonal" class="mt-3">
        {{ deleteError }}
      </VAlert>
    </BaseModal>

    <!-- Form Tambah / Edit Vendor -->
    <VendorForm
      v-model="showForm"
      :vendor-data="selectedForm"
      :minimizable="true"
      @minimize="minimizeForm"
      @saved="onFormSaved"
    />

    <BulkDeleteBar :selected="selected" @delete="doBulkDelete" @clear="selected = []" />
  </div>
</template>

<script setup>
import { nextTick, onActivated, onDeactivated, ref, watch } from 'vue'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useAuthStore } from '@/stores/auth.store'
import { useCrud } from '@/composables/useCrud'
import { useMinimizeWidgetStore } from '@/stores/minimize-widget.store'
import api from '@/utils/axios'
import BulkDeleteBar from '@/components/base/BulkDeleteBar.vue'
import DetailRow from '@/components/shared/DetailRow.vue'
import VendorForm from '../components/VendorForm.vue'

const authStore = useAuthStore()
const { showSuccess, showError, showLoading, closeAlert, confirmDelete: swalConfirmDelete } = useSweetAlert()

const { items, loading, meta, params, fetchList, remove } = useCrud('/ap/vendors')
const minimizeStore = useMinimizeWidgetStore()

const FORM_WIDGET_ID = 'vendor-form'

const selected = ref([])
const showDetail = ref(false)
const showDelete = ref(false)
const showForm = ref(false)
const deleteError = ref('')
const selectedVendor = ref(null)
const selectedForm = ref(null)

const headers = [
  { title: 'No', key: 'no', sortable: false, width: '60px' },
  { title: 'Kode Vendor', key: 'kode_vendor', sortable: false, minWidth: '140px' },
  { title: 'Nama Vendor', key: 'nama_vendor', sortable: false, minWidth: '220px' },
  { title: 'PIC AP', key: 'karyawan_ap', sortable: false, minWidth: '160px' },
  { title: 'Status', key: 'status', sortable: false, minWidth: '90px' },
  { title: 'Aksi', key: 'actions', sortable: false, align: 'center', width: '120px' },
]

const statusOptions = [
  { label: 'Aktif', value: 1 },
  { label: 'Nonaktif', value: 0 },
]

let debounceTimer = null
function debouncedFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(doFetch, 400)
}

function doFetch() {
  params.page = 1
  fetchList()
}

function onTableOptions({ page, itemsPerPage }) {
  params.page = page
  params.per_page = itemsPerPage
  fetchList()
}

function openCreate() {
  minimizeStore.register(FORM_WIDGET_ID, { title: 'Form Tambah Vendor', routeName: 'ap-vendor-index', type: 'form', minimized: false, mode: 'create', recordId: null, endpoint: null })
  selectedForm.value = null
  showForm.value = true
}
function openEdit(v) {
  minimizeStore.register(FORM_WIDGET_ID, { title: 'Form Edit Vendor', routeName: 'ap-vendor-index', type: 'form', minimized: false, mode: 'edit', recordId: v.id, endpoint: '/ap/vendors' })
  selectedForm.value = v
  showForm.value = true
}
function minimizeForm() {
  minimizeStore.setMinimized(FORM_WIDGET_ID, true)
  showForm.value = false
}
function onFormSaved() { minimizeStore.remove(FORM_WIDGET_ID); showForm.value = false; fetchList() }

watch(showForm, (val) => {
  if (!val) {
    const w = minimizeStore.widgets[FORM_WIDGET_ID]
    if (w && !w.minimized) minimizeStore.remove(FORM_WIDGET_ID)
  }
})

onActivated(async () => {
  if (minimizeStore.widgets[FORM_WIDGET_ID]?.pendingRestore) {
    const widget = minimizeStore.widgets[FORM_WIDGET_ID]
    minimizeStore.clearPendingRestore(FORM_WIDGET_ID)
    minimizeStore.setMinimizedFalse(FORM_WIDGET_ID)
    if (widget.mode === 'edit' && widget.recordId && widget.endpoint) {
      try {
        const res = await api.get(`${widget.endpoint}/${widget.recordId}`)
        selectedForm.value = res.data?.data ?? null
      } catch {
        selectedForm.value = null
      }
    } else {
      selectedForm.value = null
    }
    showForm.value = true
  }
})

function openDetail(v) { selectedVendor.value = v; showDetail.value = true }
function confirmDeleteItem(v) { selectedVendor.value = v; deleteError.value = ''; showDelete.value = true }

onDeactivated(() => {
  showDetail.value = false
  showDelete.value = false

  const widget = minimizeStore.widgets[FORM_WIDGET_ID]
  if (showForm.value && !widget?.minimized)
    showForm.value = false
})

async function doDelete() {
  deleteError.value = ''
  const deleteId = selectedVendor.value?.id
  if (!deleteId) return

  showDelete.value = false
  await nextTick()

  const res = await remove(deleteId)
  if (res.success) {
    fetchList()
    await showSuccess('Vendor berhasil dihapus.')
  } else {
    deleteError.value = res.message || 'Gagal menghapus data'
    await showError(deleteError.value)
  }
}

async function doBulkDelete() {
  if (!selected.value.length) return
  const { isConfirmed } = await swalConfirmDelete(`Sebanyak ${selected.value.length} data yang dipilih akan dihapus.`)
  if (!isConfirmed) return
  showLoading({ title: 'Menghapus Data', text: 'Mohon tunggu...' })
  try {
    const res = await api.delete('/ap/vendors/bulk', { data: { ids: selected.value.map(i => i.id) } })
    const deleted = res.data?.data?.deleted ?? selected.value.length
    selected.value = []
    fetchList()
    await showSuccess(`${deleted} vendor berhasil dihapus.`)
  } catch (err) {
    await showError(err.response?.data?.message ?? 'Gagal menghapus data')
  } finally {
    closeAlert({ onlyLoading: true })
  }
}

doFetch()
</script>
