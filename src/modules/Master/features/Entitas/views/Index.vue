<template>
  <div>
    <ManagementIndexShell
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
          Tambah Entitas
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
              <div class="font-weight-medium text-truncate">{{ item.nama_perusahaan }}</div>
              <div class="text-caption text-medium-emphasis text-truncate">{{ item.nama_singkatan_perusahaan ?? '-' }}</div>
            </div>
            <StatusChip :active="item.status" />
          </div>
          <div class="d-flex align-center justify-space-between gap-2">
            <VChip color="primary" size="small" variant="tonal" label>
              {{ item.kode_perusahaan }}
            </VChip>
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

      <!-- Section: Identitas Entitas -->
      <div class="detail-section-header">
        <VIcon
          icon="ri-building-4-line"
          size="14"
          class="detail-section-icon-primary"
        />
        <span class="detail-section-title detail-section-title-primary">Identitas Entitas</span>
      </div>
      <VDivider />
      <DetailRow
        label="Kode Entitas"
        :value="selectedEntitas?.kode_perusahaan"
      />
      <DetailRow
        label="Singkatan"
        :value="selectedEntitas?.nama_singkatan_perusahaan"
      />
      <DetailRow
        label="Nama Entitas"
        :value="selectedEntitas?.nama_perusahaan"
      />
      <DetailRow
        label="Nama Direktur"
        :value="selectedEntitas?.nama_direktur"
      />
      <DetailRow
        label="Keterangan"
        :value="selectedEntitas?.keterangan"
      />

      <!-- Section: Kontak & Lokasi -->
      <div class="detail-section-header">
        <VIcon
          icon="ri-map-pin-line"
          size="14"
          class="detail-section-icon-info"
        />
        <span class="detail-section-title detail-section-title-info">Kontak &amp; Lokasi</span>
      </div>
      <VDivider />
      <DetailRow
        label="Alamat"
        :value="selectedEntitas?.alamat"
      />
      <DetailRow
        label="Kota"
        :value="selectedEntitas?.kota"
      />
      <DetailRow
        label="Kode POS"
        :value="selectedEntitas?.kode_pos"
      />
      <DetailRow
        label="No. Telepon"
        :value="selectedEntitas?.no_telp"
      />
      <DetailRow
        label="Email"
        :value="selectedEntitas?.email"
      />
      <DetailRow
        label="NPWP"
        :value="selectedEntitas?.no_npwp"
      />

      <!-- Section: Status & Audit -->
      <div class="detail-section-header">
        <VIcon
          icon="ri-history-line"
          size="14"
          class="detail-section-icon-secondary"
        />
        <span class="detail-section-title detail-section-title-secondary">Status &amp; Audit</span>
      </div>
      <VDivider />
      <DetailRow label="Status">
        <StatusChip :active="selectedEntitas?.status" />
      </DetailRow>
      <DetailRow
        label="Created By"
        :value="selectedEntitas?.created_by_name"
      />
      <DetailRow
        label="Updated By"
        :value="selectedEntitas?.updated_by_name"
      />
      <DetailRow
        label="Created At"
        :value="selectedEntitas?.created_at"
      />
      <DetailRow
        label="Updated At"
        :value="selectedEntitas?.updated_at"
      />
    </DetailDialog>

    <!-- Confirm Delete -->
    <BaseModal
      v-if="showDelete"
      v-model="showDelete"
      title="Hapus Entitas"
      :loading="loading"
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
import { computed, nextTick, onActivated, onMounted, ref, watch } from 'vue'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useCrud } from '@/composables/useCrud.js'
import { useMinimizeWidgetStore } from '@/stores/minimize-widget.store'
import api from '@/utils/axios'
import BulkDeleteBar from '@/components/base/BulkDeleteBar.vue'

const { showSuccess, showError, showLoading, closeAlert, confirmDelete: swalConfirmDelete } = useSweetAlert()
const { items, loading, meta, params, fetchList, remove } = useCrud('/master/perusahaan')
const minimizeStore = useMinimizeWidgetStore()

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

watch(showForm, (val) => {
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
.detail-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  background: rgba(var(--v-theme-on-surface), 0.03);
}

.detail-section-title {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.detail-section-icon-primary,
.detail-section-title-primary {
  color: rgb(var(--v-theme-primary));
}

.detail-section-icon-info,
.detail-section-title-info {
  color: rgb(var(--v-theme-info));
}

.detail-section-icon-secondary,
.detail-section-title-secondary {
  color: rgb(var(--v-theme-secondary));
}
</style>
