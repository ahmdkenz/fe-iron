<template>
  <div>
    <ManagementIndexShell
      ref="tableCard"
      v-model:search="params.search"
      v-model:status="statusFilter"
      tone="orange"
      icon="ri-store-2-line"
      title="Manajemen Resto"
      subtitle="Kelola data restoran"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Resto', disabled: true }
      ]"
      :stats="stats"
      :stats-loading="loading && !items.length"
      search-placeholder="Cari kode / nama resto / kota..."
      compact-actions
      @update:search="debouncedFetch"
      @update:status="onStatusChange"
    >
      <template #actions>
        <!-- Export -->
        <VBtn
          v-if="!xs"
          color="primary"
          prepend-icon="ri-file-excel-line"
          :loading="exporting"
          @click="exportCsv"
        >
          Export
        </VBtn>
        <VBtn
          v-else
          icon
          color="primary"
          size="small"
          :loading="exporting"
          aria-label="Export"
          @click="exportCsv"
        >
          <VIcon icon="ri-file-excel-line" />
          <VTooltip
            activator="parent"
            location="bottom"
          >
            Export
          </VTooltip>
        </VBtn>

        <!-- Tambah -->
        <template v-if="!authStore.isArOnly">
          <VBtn
            v-if="!xs"
            color="primary"
            prepend-icon="ri-add-line"
            @click="openCreate"
          >
            Tambah Resto
          </VBtn>
          <VBtn
            v-else
            icon
            color="primary"
            size="small"
            aria-label="Tambah Resto"
            @click="openCreate"
          >
            <VIcon icon="ri-add-line" />
            <VTooltip
              activator="parent"
              location="bottom"
            >
              Tambah Resto
            </VTooltip>
          </VBtn>
        </template>
      </template>

      <BaseTable
        v-model:selected="selectedItems"
        :headers="headers"
        :items="items"
        :total="meta.total"
        :loading="loading"
        :per-page="meta.per_page"
        :page="meta.current_page"
        wrap-text
        show-select
        mobile-cards
        mobile-menu-select
        @update:options="onTableOptions"
      >
        <template #mobile-card="{ item, selected, toggle }">
          <div class="d-flex align-center justify-space-between gap-2 mb-2">
            <div class="min-width-0">
              <div class="font-weight-medium text-truncate">
                {{ item.nama_resto }}
              </div>
              <div class="text-caption text-medium-emphasis text-truncate">
                {{ item.investor?.nama_investor ?? 'Tanpa investor' }}
              </div>
            </div>
            <StatusChip :active="item.status" />
          </div>
          <div class="d-flex align-center flex-wrap gap-1 mb-2">
            <VChip
              color="primary"
              size="x-small"
              variant="tonal"
              label
            >
              {{ item.kode_resto }}
            </VChip>
            <VChip
              v-if="item.perusahaan"
              color="secondary"
              size="x-small"
              variant="tonal"
              label
            >
              {{ item.perusahaan.nama_singkatan_perusahaan }}
            </VChip>
            <VChip
              v-if="item.brand"
              color="info"
              size="x-small"
              variant="tonal"
              label
            >
              {{ item.brand.nama_brand }}
            </VChip>
          </div>
          <div class="d-flex align-center justify-space-between gap-2">
            <div class="text-caption text-medium-emphasis text-truncate min-width-0">
              <VIcon
                icon="ri-user-line"
                size="12"
              />
              {{ item.pic_ar?.nama_karyawan ?? '-' }}
              · {{ [item.area, item.kota].filter(Boolean).join(', ') || '-' }}
            </div>
            <MobileCardActions
              :selected="selected"
              :editable="!authStore.isArOnly"
              :deletable="!authStore.isArOnly"
              @detail="openDetail(item)"
              @edit="openEdit(item)"
              @delete="confirmDelete(item)"
              @toggle-select="toggle"
            />
          </div>
        </template>

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
        <template #item.pic_ar="{ item }">
          {{ item.pic_ar?.nama_karyawan ?? '-' }}
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
          <StatusChip :active="item.status" />
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
    </ManagementIndexShell>



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
        label="PIC AR"
        :value="selectedResto?.pic_ar?.nama_karyawan"
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
        <StatusChip :active="selectedResto?.status" />
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
      confirm-action="hapus"
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
      :minimizable="true"
      @minimize="minimizeForm"
      @saved="onFormSaved"
    />

    <BulkDeleteBar
      v-if="!authStore.isArOnly"
      :selected="selectedItems"
      @delete="doBulkDelete"
      @clear="selectedItems = []"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, onActivated, onDeactivated, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useAuthStore } from '@/stores/auth.store'
import { useCrud } from '@/composables/useCrud'
import { useMinimizeWidgetStore } from '@/stores/minimize-widget.store'
import api from '@/utils/axios'
import BulkDeleteBar from '@/components/base/BulkDeleteBar.vue'
import MobileCardActions from '@/components/shared/MobileCardActions.vue'

const { xs } = useDisplay()
const authStore = useAuthStore()
const { showSuccess, showError, showLoading, closeAlert, confirmDelete: swalConfirmDelete } = useSweetAlert()
const { items, loading, meta, params, fetchList, remove } = useCrud('/master/resto')
const minimizeStore = useMinimizeWidgetStore()

const FORM_WIDGET_ID = 'resto-form'

const tableCard     = ref(null)
let prevItemsPerPage = null

const showDelete    = ref(false)
const showDetail    = ref(false)
const showForm      = ref(false)
const deleteError   = ref('')
const selectedResto = ref(null)
const selectedForm  = ref(null)
const selectedItems = ref([])

const exporting = ref(false)
const statusFilter = ref('all')

const stats = computed(() => ({
  total: meta.total,
  aktif: items.value.filter(i => i.status).length,
  nonaktif: items.value.filter(i => !i.status).length,
}))

const headers = [
  { title: 'No',            key: 'no',              sortable: false, width: '60px' },
  { title: 'Kode Resto',    key: 'kode_resto',      sortable: false },
  { title: 'Nama Resto',    key: 'nama_resto',      sortable: false },
  { title: 'Investor',      key: 'investor',        sortable: false },
  { title: 'Entitas',       key: 'perusahaan',      sortable: false },
  { title: 'Brand',         key: 'brand',           sortable: false },
  { title: 'PIC AR',        key: 'pic_ar',          sortable: false },
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
  const parts = d.split('-')

  const dt = parts.length === 3 && parts[2].length === 4
    ? new Date(+parts[2], +parts[1] - 1, +parts[0])
    : new Date(d)

  if (isNaN(dt.getTime())) return d
  
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

function onStatusChange(val) {
  statusFilter.value = val
  if (val === 'all') delete params.status
  else params.status = val
  params.page = 1
  fetchList()
}

function openCreate() {
  minimizeStore.register(FORM_WIDGET_ID, { title: 'Form Tambah Resto', routeName: 'master-resto', type: 'form', minimized: false, mode: 'create', recordId: null, endpoint: null })
  selectedForm.value = null
  showForm.value = true
}
function openEdit(r) {
  minimizeStore.register(FORM_WIDGET_ID, { title: 'Form Edit Resto', routeName: 'master-resto', type: 'form', minimized: false, mode: 'edit', recordId: r.id, endpoint: '/master/resto' })
  selectedForm.value = r
  showForm.value = true
}
function minimizeForm() {
  minimizeStore.setMinimized(FORM_WIDGET_ID, true)
  showForm.value = false
}
function onFormSaved() { minimizeStore.remove(FORM_WIDGET_ID); showForm.value = false; fetchList() }
function openDetail(r)    { selectedResto.value = r;    showDetail.value = true }
function confirmDelete(r) { selectedResto.value = r;    deleteError.value = ''; showDelete.value = true }

// Dialog teleports (VDialog) survive keep-alive deactivation, so force-close
// anything not intentionally minimized to avoid a stuck scrim on other pages.
onDeactivated(() => {
  showDetail.value = false
  showDelete.value = false

  const widget = minimizeStore.widgets[FORM_WIDGET_ID]
  if (showForm.value && !widget?.minimized)
    showForm.value = false
})

watch(showForm, val => {
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

async function doBulkDelete() {
  if (!selectedItems.value.length) return
  const { isConfirmed } = await swalConfirmDelete(`Sebanyak ${selectedItems.value.length} data yang dipilih akan dihapus.`)
  if (!isConfirmed) return
  showLoading({ title: 'Menghapus Data', text: 'Mohon tunggu...' })
  try {
    const res = await api.delete('/master/resto/bulk', { data: { ids: selectedItems.value.map(i => i.id) } })
    const deleted = res.data?.data?.deleted ?? selectedItems.value.length

    selectedItems.value = []
    fetchList()
    await showSuccess(`${deleted} resto berhasil dihapus.`)
  } catch (err) {
    await showError(err.response?.data?.message ?? 'Gagal menghapus data')
  } finally {
    closeAlert({ onlyLoading: true })
  }
}

onMounted(() => {
  if (authStore.isArOnly && authStore.user?.karyawan_id) {
    params.karyawan_id = authStore.user.karyawan_id
  }
  fetchList()
})
</script>
