<template>
  <div>
    <ManagementIndexShell
      ref="tableCard"
      v-model:search="params.search"
      v-model:status="statusFilter"
      tone="rose"
      icon="ri-hand-coin-line"
      title="Manajemen Investor"
      subtitle="Kelola data investor"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Investor', disabled: true }
      ]"
      :stats="stats"
      :stats-loading="loading && !items.length"
      search-placeholder="Cari nama, pengelola, kode/ID cabang..."
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
            Tambah Investor
          </VBtn>
          <VBtn
            v-else
            icon
            color="primary"
            size="small"
            aria-label="Tambah Investor"
            @click="openCreate"
          >
            <VIcon icon="ri-add-line" />
            <VTooltip
              activator="parent"
              location="bottom"
            >
              Tambah Investor
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
                {{ item.nama_investor }}
              </div>
              <div class="text-caption text-medium-emphasis text-truncate">
                <VIcon
                  icon="ri-phone-line"
                  size="12"
                />
                {{ item.no_hp ?? '-' }}
              </div>
            </div>
            <StatusChip :active="item.status" />
          </div>
          <div class="d-flex align-center flex-wrap gap-1 mb-2">
            <VChip
              v-if="item.kode_cabang"
              color="secondary"
              size="x-small"
              variant="tonal"
              label
            >
              {{ item.kode_cabang }}
            </VChip>
            <VChip
              v-if="item.id_cabang"
              color="secondary"
              size="x-small"
              variant="tonal"
              label
            >
              ID: {{ item.id_cabang }}
            </VChip>
            <span class="text-caption text-medium-emphasis text-truncate">{{ item.pengelola ?? 'Tanpa pengelola' }}</span>
          </div>
          <div class="d-flex justify-end">
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
        <template #item.kode_cabang="{ item }">
          <VChip
            v-if="item.kode_cabang"
            color="secondary"
            size="small"
            variant="tonal"
            label
          >
            {{ item.kode_cabang }}
          </VChip>
          <span v-else>-</span>
        </template>
        <template #item.id_cabang="{ item }">
          {{ item.id_cabang ?? '-' }}
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
        <StatusChip :active="selectedInvestor?.status" />
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
      confirm-action="hapus"
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
const { items, loading, meta, params, fetchList, remove } = useCrud('/master/investor')
const minimizeStore = useMinimizeWidgetStore()

const FORM_WIDGET_ID = 'investor-form'

const tableCard        = ref(null)
let prevItemsPerPage   = null

const showDelete       = ref(false)
const showDetail       = ref(false)
const showForm         = ref(false)
const deleteError      = ref('')
const selectedInvestor = ref(null)
const selectedForm     = ref(null)
const selectedItems    = ref([])

const exporting = ref(false)
const statusFilter = ref('all')

const stats = computed(() => ({
  total: meta.total,
  aktif: items.value.filter(i => i.status).length,
  nonaktif: items.value.filter(i => !i.status).length,
}))

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

function onStatusChange(val) {
  statusFilter.value = val
  if (val === 'all') delete params.status
  else params.status = val
  params.page = 1
  fetchList()
}

function openCreate() {
  minimizeStore.register(FORM_WIDGET_ID, { title: 'Form Tambah Investor', routeName: 'master-investor', type: 'form', minimized: false, mode: 'create', recordId: null, endpoint: null })
  selectedForm.value = null
  showForm.value = true
}
function openEdit(inv) {
  minimizeStore.register(FORM_WIDGET_ID, { title: 'Form Edit Investor', routeName: 'master-investor', type: 'form', minimized: false, mode: 'edit', recordId: inv.id, endpoint: '/master/investor' })
  selectedForm.value = inv
  showForm.value = true
}
function minimizeForm() {
  minimizeStore.setMinimized(FORM_WIDGET_ID, true)
  showForm.value = false
}
function onFormSaved() { minimizeStore.remove(FORM_WIDGET_ID); showForm.value = false; fetchList() }
function openDetail(inv)  { selectedInvestor.value = inv;  showDetail.value = true }
function confirmDelete(inv) { selectedInvestor.value = inv; deleteError.value = ''; showDelete.value = true }

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
</script>
