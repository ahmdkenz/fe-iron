<template>
  <div>
    <ManagementIndexShell
      tone="violet"
      icon="ri-team-line"
      title="Manajemen Karyawan"
      subtitle="Kelola data karyawan"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Karyawan', disabled: true }
      ]"
      :stats="stats"
      :stats-loading="loading && !items.length"
      search-placeholder="Cari NIK / nama karyawan..."
      v-model:search="params.search"
      v-model:status="statusFilter"
      @update:search="debouncedFetch"
      @update:status="onStatusChange"
    >
      <template #actions>
        <VBtn
          color="primary"
          prepend-icon="ri-add-line"
          @click="openCreate"
        >
          Tambah Karyawan
        </VBtn>
      </template>

      <BaseTable
        :headers="headers"
        :items="items"
        :total="meta.total"
        :loading="loading"
        :per-page="meta.per_page"
        :page="meta.current_page"
        show-select
        mobile-cards
        v-model:selected="selectedItems"
        @update:options="onTableOptions"
      >
        <template #mobile-card="{ item }">
          <div class="d-flex align-center justify-space-between gap-2 mb-2">
            <div class="min-width-0">
              <div class="font-weight-medium text-truncate">{{ item.nama_karyawan }}</div>
              <div class="text-caption text-medium-emphasis">NIK: {{ item.nik }}</div>
            </div>
            <StatusChip :active="item.status" />
          </div>
          <div class="d-flex align-center justify-space-between gap-2">
            <VChip v-if="item.perusahaan" color="secondary" size="small" variant="tonal" label>
              {{ item.perusahaan.nama_singkatan_perusahaan }}
            </VChip>
            <span v-else class="text-caption text-medium-emphasis">Tanpa entitas</span>
            <div class="d-flex gap-1">
              <VBtn icon size="small" variant="text" color="info" @click="openDetail(item)">
                <VIcon icon="ri-eye-line" size="18" />
              </VBtn>
              <VBtn icon size="small" variant="text" color="primary" @click="openEdit(item)">
                <VIcon icon="ri-pencil-line" size="18" />
              </VBtn>
              <VBtn icon size="small" variant="text" color="error" @click="confirmDelete(item)">
                <VIcon icon="ri-delete-bin-line" size="18" />
              </VBtn>
            </div>
          </div>
        </template>

        <template #item.no="{ index }">
          {{ (meta.current_page - 1) * meta.per_page + index + 1 }}
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
        <template #item.status="{ item }">
          <StatusChip :active="item.status" />
        </template>
        <template #item.keterangan="{ item }">
          {{ item.keterangan ?? '-' }}
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
    </ManagementIndexShell>


    <!-- Detail Dialog -->
    <DetailDialog
      v-model="showDetail"
      title="Detail Karyawan"
    >
      <template #hero>
        <VAvatar
          size="88"
          color="primary"
          class="mb-3"
        >
          <span class="text-h4 font-weight-bold text-white">{{ selectedKaryawan?.nama_karyawan?.charAt(0)?.toUpperCase() }}</span>
        </VAvatar>
        <div class="text-h6 font-weight-bold mb-2">
          {{ selectedKaryawan?.nama_karyawan }}
        </div>
        <VChip
          color="secondary"
          size="small"
          variant="tonal"
          label
        >
          NIK: {{ selectedKaryawan?.nik }}
        </VChip>
      </template>

      <DetailRow
        label="Entitas"
        :value="selectedKaryawan?.perusahaan?.nama_perusahaan"
      />
      <DetailRow
        label="Singkatan"
        :value="selectedKaryawan?.perusahaan?.nama_singkatan_perusahaan"
      />
      <DetailRow
        label="Keterangan"
        :value="selectedKaryawan?.keterangan"
      />
      <DetailRow label="Status">
        <StatusChip :active="selectedKaryawan?.status" />
      </DetailRow>
      <DetailRow
        label="Created By"
        :value="selectedKaryawan?.created_by_name"
      />
      <DetailRow
        label="Updated By"
        :value="selectedKaryawan?.updated_by_name"
      />
      <DetailRow
        label="Created At"
        :value="selectedKaryawan?.created_at"
      />
      <DetailRow
        label="Updated At"
        :value="selectedKaryawan?.updated_at"
      />
    </DetailDialog>

    <!-- Confirm Delete -->
    <BaseModal
      v-if="showDelete"
      v-model="showDelete"
      title="Hapus Karyawan"
      :loading="loading"
      confirm-action="hapus"
      @confirm="doDelete"
    >
      <p>Apakah Anda yakin ingin menghapus karyawan <strong>{{ selectedKaryawan?.nama_karyawan }}</strong>?</p>
      <VAlert
        v-if="deleteError"
        type="error"
        variant="tonal"
        class="mt-3"
      >
        {{ deleteError }}
      </VAlert>
    </BaseModal>

    <!-- Form Tambah / Edit Karyawan -->
    <KaryawanForm
      v-model="showForm"
      :karyawan-data="selectedForm"
      :minimizable="true"
      @minimize="minimizeForm"
      @saved="onFormSaved"
    />

    <BulkDeleteBar
      :selected="selectedItems"
      @delete="doBulkDelete"
      @clear="selectedItems = []"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, onActivated, onDeactivated, onMounted, ref, watch } from 'vue'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useCrud } from '@/composables/useCrud.js'
import { useMinimizeWidgetStore } from '@/stores/minimize-widget.store'
import api from '@/utils/axios'
import BulkDeleteBar from '@/components/base/BulkDeleteBar.vue'

const { showSuccess, showError, showLoading, closeAlert, confirmDelete: swalConfirmDelete } = useSweetAlert()
const { items, loading, meta, params, fetchList, remove } = useCrud('/master/karyawan')
const minimizeStore = useMinimizeWidgetStore()

const FORM_WIDGET_ID = 'karyawan-form'

const showDelete = ref(false)
const showDetail = ref(false)
const showForm   = ref(false)
const deleteError = ref('')
const selectedKaryawan = ref(null)
const selectedForm = ref(null)
const selectedItems = ref([])
const statusFilter = ref('all')

const stats = computed(() => ({
  total: meta.total,
  aktif: items.value.filter(i => i.status).length,
  nonaktif: items.value.filter(i => !i.status).length,
}))

const headers = [
  { title: 'No',           key: 'no',               sortable: false, width: '60px' },
  { title: 'NIK',          key: 'nik',               sortable: false },
  { title: 'Nama Karyawan', key: 'nama_karyawan',     sortable: false },
  { title: 'Entitas',      key: 'perusahaan',        sortable: false },
  { title: 'Keterangan',   key: 'keterangan',        sortable: false },
  { title: 'Status',       key: 'status',            sortable: false },
  { title: 'Created By',   key: 'created_by_name',   sortable: false },
  { title: 'Updated By',   key: 'updated_by_name',   sortable: false },
  { title: 'Aksi',         key: 'actions',           sortable: false, align: 'center', width: '120px' },
]

let debounceTimer = null
function debouncedFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { params.page = 1; fetchList() }, 400)
}

function onTableOptions({ page, itemsPerPage }) {
  params.page = page
  params.per_page = itemsPerPage
  fetchList()
}

function onStatusChange(val) {
  statusFilter.value = val
  if (val === 'all') delete params.status
  else params.status = val
  params.page = 1
  fetchList()
}

function openCreate() {
  minimizeStore.register(FORM_WIDGET_ID, { title: 'Form Tambah Karyawan', routeName: 'master-karyawan', type: 'form', minimized: false, mode: 'create', recordId: null, endpoint: null })
  selectedForm.value = null
  showForm.value = true
}
function openEdit(k) {
  minimizeStore.register(FORM_WIDGET_ID, { title: 'Form Edit Karyawan', routeName: 'master-karyawan', type: 'form', minimized: false, mode: 'edit', recordId: k.id, endpoint: '/master/karyawan' })
  selectedForm.value = k
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
function openDetail(k)    { selectedKaryawan.value = k;    showDetail.value = true }
function confirmDelete(k) { selectedKaryawan.value = k;    deleteError.value = ''; showDelete.value = true }

// Dialog teleports (VDialog) survive keep-alive deactivation, so force-close
// anything not intentionally minimized to avoid a stuck scrim on other pages.
onDeactivated(() => {
  showDetail.value = false
  showDelete.value = false

  const widget = minimizeStore.widgets[FORM_WIDGET_ID]
  if (showForm.value && !widget?.minimized)
    showForm.value = false
})

async function doDelete() {
  deleteError.value = ''

  const deleteId = selectedKaryawan.value?.id
  if (!deleteId) return

  showDelete.value = false
  await nextTick()

  const res = await remove(deleteId)
  if (res.success) {
    fetchList()
    await showSuccess('Karyawan berhasil dihapus.')
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
    const res = await api.delete('/master/karyawan/bulk', { data: { ids: selectedItems.value.map(i => i.id) } })
    const deleted = res.data?.data?.deleted ?? selectedItems.value.length
    selectedItems.value = []
    fetchList()
    await showSuccess(`${deleted} karyawan berhasil dihapus.`)
  } catch (err) {
    await showError(err.response?.data?.message ?? 'Gagal menghapus data')
  } finally {
    closeAlert({ onlyLoading: true })
  }
}

onMounted(() => fetchList())
</script>
