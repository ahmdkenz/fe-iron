<template>
  <div>
    <ManagementIndexShell
      v-model:search="params.search"
      v-model:status="statusFilter"
      tone="teal"
      icon="ri-building-4-line"
      title="Manajemen Entitas"
      subtitle="Kelola data entitas"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Entitas', disabled: true }
      ]"
      :stats="stats"
      :stats-loading="loading && !items.length"
      search-placeholder="Cari kode / nama entitas..."
      compact-actions
      @update:search="debouncedFetch"
      @update:status="onStatusChange"
    >
      <template #actions>
        <VBtn
          v-if="!xs"
          color="primary"
          prepend-icon="ri-add-line"
          @click="openCreate"
        >
          Tambah Entitas
        </VBtn>
        <VBtn
          v-else
          icon
          color="primary"
          size="small"
          aria-label="Tambah Entitas"
          @click="openCreate"
        >
          <VIcon icon="ri-add-line" />
          <VTooltip
            activator="parent"
            location="bottom"
          >
            Tambah Entitas
          </VTooltip>
        </VBtn>
      </template>

      <BaseTable
        v-model:selected="selectedItems"
        :headers="headers"
        :items="items"
        :total="meta.total"
        :loading="loading"
        :per-page="meta.per_page"
        :page="meta.current_page"
        show-select
        mobile-cards
        mobile-menu-select
        @update:options="onTableOptions"
      >
        <template #mobile-card="{ item, selected, toggle }">
          <div class="d-flex align-center justify-space-between gap-2 mb-2">
            <div class="min-width-0">
              <div class="font-weight-medium text-truncate">
                {{ item.nama_perusahaan }}
              </div>
              <div class="text-caption text-medium-emphasis text-truncate">
                {{ item.nama_singkatan_perusahaan ?? '-' }}
              </div>
            </div>
            <StatusChip :active="item.status" />
          </div>
          <div class="d-flex align-center justify-space-between gap-2 mb-2">
            <VChip
              color="primary"
              size="x-small"
              variant="tonal"
              label
            >
              {{ item.kode_perusahaan }}
            </VChip>
            <SegmenChips :segmen="item.segmen" />
          </div>
          <div class="d-flex justify-end">
            <MobileCardActions
              :selected="selected"
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
        <template #item.kode_perusahaan="{ item }">
          <VChip
            color="primary"
            size="small"
            variant="tonal"
            label
          >
            {{ item.kode_perusahaan }}
          </VChip>
        </template>
        <template #item.segmen="{ item }">
          <SegmenChips :segmen="item.segmen" />
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
      title="Detail Entitas"
      size="lg"
      :status="selectedEntitas?.status ?? null"
      :created-by="selectedEntitas?.created_by_name"
      :updated-by="selectedEntitas?.updated_by_name"
      :created-at="selectedEntitas?.created_at"
      :updated-at="selectedEntitas?.updated_at"
    >
      <template #hero>
        <VAvatar
          size="88"
          color="primary"
          class="mb-3"
        >
          <span class="text-h4 font-weight-bold text-white">{{ selectedEntitas?.nama_singkatan_perusahaan?.charAt(0) }}</span>
        </VAvatar>
        <div class="text-h6 font-weight-bold mb-2">
          {{ selectedEntitas?.nama_perusahaan }}
        </div>
        <VChip
          color="primary"
          size="small"
          variant="tonal"
          label
        >
          {{ selectedEntitas?.kode_perusahaan }}
        </VChip>
      </template>

      <DetailSection
        title="Identitas Entitas"
        icon="ri-building-4-line"
      >
        <DetailField
          label="Kode Entitas"
          :value="selectedEntitas?.kode_perusahaan"
        />
        <DetailField
          label="Singkatan"
          :value="selectedEntitas?.nama_singkatan_perusahaan"
        />
        <DetailField label="Segmen">
          <SegmenChips :segmen="selectedEntitas?.segmen" />
        </DetailField>
        <DetailField
          label="Nama Entitas"
          :value="selectedEntitas?.nama_perusahaan"
        />
        <DetailField
          label="Nama Direktur"
          :value="selectedEntitas?.nama_direktur"
        />
        <DetailField
          label="Keterangan"
          :value="selectedEntitas?.keterangan"
          span
        />
      </DetailSection>

      <DetailSection
        title="Kontak & Lokasi"
        icon="ri-map-pin-line"
      >
        <DetailField
          label="Alamat"
          :value="selectedEntitas?.alamat"
          span
        />
        <DetailField
          label="Kota"
          :value="selectedEntitas?.kota"
        />
        <DetailField
          label="Kode POS"
          :value="selectedEntitas?.kode_pos"
        />
        <DetailField
          label="No. Telepon"
          :value="selectedEntitas?.no_telp"
        />
        <DetailField
          label="Email"
          :value="selectedEntitas?.email"
        />
        <DetailField
          label="NPWP"
          :value="selectedEntitas?.no_npwp"
        />
      </DetailSection>
    </DetailDialog>

    <!-- Confirm Delete -->
    <BaseModal
      v-if="showDelete"
      v-model="showDelete"
      title="Hapus Entitas"
      :disabled="loading"
      confirm-action="hapus"
      @confirm="doDelete"
    >
      <p>Apakah Anda yakin ingin menghapus entitas <strong>{{ selectedEntitas?.nama_perusahaan }}</strong>?</p>
      <VAlert
        v-if="deleteError"
        type="error"
        variant="tonal"
        class="mt-3"
      >
        {{ deleteError }}
      </VAlert>
    </BaseModal>

    <!-- Form Tambah / Edit Entitas -->
    <EntitasForm
      v-model="showForm"
      :entitas-data="selectedForm"
      :minimizable="!xs"
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
import { useDisplay } from 'vuetify'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useCrud } from '@/composables/useCrud.js'
import { useMinimizeWidgetStore } from '@/stores/minimize-widget.store'
import api from '@/utils/axios'
import BulkDeleteBar from '@/components/base/BulkDeleteBar.vue'
import MobileCardActions from '@/components/shared/MobileCardActions.vue'
import SegmenChips from '../components/SegmenChips.vue'

const { showSuccess, showError, showLoading, closeAlert, confirmDelete: swalConfirmDelete } = useSweetAlert()
const { items, loading, meta, params, fetchList, remove } = useCrud('/master/perusahaan')
const minimizeStore = useMinimizeWidgetStore()
const { xs } = useDisplay()

const FORM_WIDGET_ID = 'entitas-form'

const showDelete  = ref(false)
const showDetail  = ref(false)
const showForm    = ref(false)
const deleteError = ref('')
const selectedEntitas = ref(null)
const selectedForm = ref(null)
const selectedItems = ref([])
const statusFilter = ref('all')

const stats = computed(() => ({
  total: meta.total,
  aktif: items.value.filter(i => i.status).length,
  nonaktif: items.value.filter(i => !i.status).length,
}))

const headers = [
  { title: 'No',         key: 'no',                        sortable: false, width: '60px' },
  { title: 'Kode',       key: 'kode_perusahaan',           sortable: false },
  { title: 'Nama Entitas',   key: 'nama_perusahaan',       sortable: false },
  { title: 'Singkatan',  key: 'nama_singkatan_perusahaan', sortable: false },
  { title: 'Segmen',     key: 'segmen',                    sortable: false },
  { title: 'Keterangan', key: 'keterangan',                sortable: false },
  { title: 'Status',     key: 'status',                    sortable: false },
  { title: 'Created By', key: 'created_by_name',           sortable: false },
  { title: 'Updated By', key: 'updated_by_name',           sortable: false },
  { title: 'Aksi',       key: 'actions',                   sortable: false, align: 'center', width: '120px' },
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
  minimizeStore.register(FORM_WIDGET_ID, { title: 'Form Tambah Entitas', routeName: 'master-perusahaan', type: 'form', minimized: false })
  selectedForm.value = null
  showForm.value = true
}
function openEdit(p) {
  minimizeStore.register(FORM_WIDGET_ID, { title: 'Form Edit Entitas', routeName: 'master-perusahaan', type: 'form', minimized: false })
  selectedForm.value = p
  showForm.value = true
}
function minimizeForm() {
  minimizeStore.setMinimized(FORM_WIDGET_ID, true)
  showForm.value = false
}
function onFormSaved() { minimizeStore.remove(FORM_WIDGET_ID); showForm.value = false; fetchList() }

watch(showForm, val => {
  if (!val) {
    const w = minimizeStore.widgets[FORM_WIDGET_ID]
    if (w && !w.minimized) minimizeStore.remove(FORM_WIDGET_ID)
  }
})

onActivated(() => {
  if (minimizeStore.widgets[FORM_WIDGET_ID]?.pendingRestore) {
    minimizeStore.clearPendingRestore(FORM_WIDGET_ID)
    minimizeStore.setMinimizedFalse(FORM_WIDGET_ID)
    showForm.value = true
  }
})
function openDetail(p)           { selectedEntitas.value = p;     showDetail.value = true }
function confirmDelete(p)        { selectedEntitas.value = p;     deleteError.value = ''; showDelete.value = true }

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

  const deleteId = selectedEntitas.value?.id
  if (!deleteId) return

  showDelete.value = false
  await nextTick()

  const res = await remove(deleteId)
  if (res.success) {
    fetchList()
    await showSuccess('Entitas berhasil dihapus.')
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
    const res = await api.delete('/master/perusahaan/bulk', { data: { ids: selectedItems.value.map(i => i.id) } })
    const deleted = res.data?.data?.deleted ?? selectedItems.value.length

    selectedItems.value = []
    fetchList()
    await showSuccess(`${deleted} entitas berhasil dihapus.`)
  } catch (err) {
    await showError(err.response?.data?.message ?? 'Gagal menghapus data')
  } finally {
    closeAlert({ onlyLoading: true })
  }
}

onMounted(() => fetchList())
</script>

<style scoped>
/* Ringkas lagi tampilan mobile khusus halaman ini (tidak menyentuh
   BaseTable.vue/ManagementIndexShell.vue supaya modul lain tidak ikut berubah). */
@media (max-width: 599.98px) {
  :deep(.base-table-mobile-card__body) {
    font-size: 0.8125rem !important;
  }

  :deep(.base-table-mobile-card) {
    padding: 8px !important;
  }

  :deep(.mis__title) {
    font-size: 0.95rem !important;
  }

  :deep(.mis__stat-value) {
    font-size: 0.875rem !important;
  }

  :deep(.mis__stat-label) {
    font-size: 0.55rem !important;
  }
}
</style>
