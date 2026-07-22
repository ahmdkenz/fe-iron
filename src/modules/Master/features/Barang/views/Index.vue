<template>
  <div>
    <ManagementIndexShell
      v-model:search="params.search"
      v-model:status="statusFilter"
      tone="emerald"
      icon="ri-archive-2-line"
      title="Manajemen Barang"
      subtitle="Kelola data barang"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Barang', disabled: true }
      ]"
      :stats="stats"
      :stats-loading="loading && !items.length"
      search-placeholder="Cari kode / nama barang..."
      compact-actions
      @update:search="debouncedFetch"
      @update:status="onStatusChange"
    >
      <template #actions>
        <template v-if="!authStore.isArOnly">
          <VBtn
            v-if="!xs"
            color="primary"
            prepend-icon="ri-add-line"
            @click="openCreate"
          >
            Tambah Barang
          </VBtn>
          <VBtn
            v-else
            icon
            color="primary"
            size="small"
            aria-label="Tambah Barang"
            @click="openCreate"
          >
            <VIcon icon="ri-add-line" />
            <VTooltip
              activator="parent"
              location="bottom"
            >
              Tambah Barang
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
                {{ item.nama_barang }}
              </div>
              <div class="text-caption text-medium-emphasis text-truncate">
                {{ item.spesifikasi ?? '-' }}
              </div>
            </div>
            <StatusChip :active="item.status" />
          </div>
          <div class="d-flex align-center justify-space-between gap-2">
            <VChip
              color="primary"
              size="small"
              variant="tonal"
              label
            >
              {{ item.kode_barang }}
            </VChip>
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
        <template #item.kode_barang="{ item }">
          <VChip
            color="primary"
            size="small"
            variant="tonal"
            label
          >
            {{ item.kode_barang }}
          </VChip>
        </template>
        <template #item.spesifikasi="{ item }">
          {{ item.spesifikasi ?? '-' }}
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
      title="Detail Barang"
    >
      <template #hero>
        <VAvatar
          size="88"
          color="primary"
          class="mb-3"
        >
          <span class="text-h4 font-weight-bold text-white">{{ selectedBarang?.nama_barang?.charAt(0)?.toUpperCase() }}</span>
        </VAvatar>
        <div class="text-h6 font-weight-bold mb-2">
          {{ selectedBarang?.nama_barang }}
        </div>
        <VChip
          color="primary"
          size="small"
          variant="tonal"
          label
        >
          {{ selectedBarang?.kode_barang }}
        </VChip>
      </template>

      <DetailRow
        label="Spesifikasi"
        :value="selectedBarang?.spesifikasi"
      />
      <DetailRow
        label="Keterangan"
        :value="selectedBarang?.keterangan"
      />
      <DetailRow label="Status">
        <StatusChip :active="selectedBarang?.status" />
      </DetailRow>
      <DetailRow
        label="Created By"
        :value="selectedBarang?.created_by_name"
      />
      <DetailRow
        label="Updated By"
        :value="selectedBarang?.updated_by_name"
      />
      <DetailRow
        label="Created At"
        :value="selectedBarang?.created_at"
      />
      <DetailRow
        label="Updated At"
        :value="selectedBarang?.updated_at"
      />
    </DetailDialog>

    <!-- Confirm Delete -->
    <BaseModal
      v-if="showDelete"
      v-model="showDelete"
      title="Hapus Barang"
      :loading="loading"
      confirm-action="hapus"
      @confirm="doDelete"
    >
      <p>Apakah Anda yakin ingin menghapus barang <strong>{{ selectedBarang?.nama_barang }}</strong>?</p>
      <VAlert
        v-if="deleteError"
        type="error"
        variant="tonal"
        class="mt-3"
      >
        {{ deleteError }}
      </VAlert>
    </BaseModal>

    <!-- Form Tambah / Edit Barang -->
    <BarangForm
      v-model="showForm"
      :barang-data="selectedForm"
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
import { computed, nextTick, onMounted, ref } from 'vue'
import { useDisplay } from 'vuetify'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useAuthStore } from '@/stores/auth.store'
import { useCrud } from '@/composables/useCrud'
import api from '@/utils/axios'
import BulkDeleteBar from '@/components/base/BulkDeleteBar.vue'
import MobileCardActions from '@/components/shared/MobileCardActions.vue'

const { xs } = useDisplay()
const authStore = useAuthStore()
const { showSuccess, showError, showLoading, closeAlert, confirmDelete: swalConfirmDelete } = useSweetAlert()
const { items, loading, meta, params, fetchList, remove } = useCrud('/master/barang')

const showDelete  = ref(false)
const showDetail  = ref(false)
const showForm    = ref(false)
const deleteError = ref('')
const selectedBarang = ref(null)
const selectedForm   = ref(null)
const selectedItems  = ref([])
const statusFilter   = ref('all')

const stats = computed(() => ({
  total: meta.total,
  aktif: items.value.filter(i => i.status).length,
  nonaktif: items.value.filter(i => !i.status).length,
}))

const headers = [
  { title: 'No',           key: 'no',              sortable: false, width: '60px' },
  { title: 'Kode Barang',  key: 'kode_barang',     sortable: false },
  { title: 'Nama Barang',  key: 'nama_barang',     sortable: false },
  { title: 'Spesifikasi',  key: 'spesifikasi',     sortable: false },
  { title: 'Keterangan',   key: 'keterangan',      sortable: false },
  { title: 'Status',       key: 'status',          sortable: false },
  { title: 'Created By',   key: 'created_by_name', sortable: false },
  { title: 'Updated By',   key: 'updated_by_name', sortable: false },
  { title: 'Aksi',         key: 'actions',         sortable: false, align: 'center', width: '120px' },
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

function onStatusChange(val) {
  statusFilter.value = val
  if (val === 'all') delete params.status
  else params.status = val
  params.page = 1
  fetchList()
}

function openCreate()  { selectedForm.value = null; showForm.value = true }
function openEdit(b)   { selectedForm.value = b;    showForm.value = true }
function onFormSaved() { showForm.value = false; fetchList() }
function openDetail(b)     { selectedBarang.value = b;    showDetail.value = true }
function confirmDelete(b)  { selectedBarang.value = b;    deleteError.value = ''; showDelete.value = true }

async function doDelete() {
  deleteError.value = ''

  const deleteId = selectedBarang.value?.id
  if (!deleteId) return

  showDelete.value = false
  await nextTick()

  const res = await remove(deleteId)
  if (res.success) {
    fetchList()
    await showSuccess('Barang berhasil dihapus.')
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
    const res = await api.delete('/master/barang/bulk', { data: { ids: selectedItems.value.map(i => i.id) } })
    const deleted = res.data?.data?.deleted ?? selectedItems.value.length

    selectedItems.value = []
    fetchList()
    await showSuccess(`${deleted} barang berhasil dihapus.`)
  } catch (err) {
    await showError(err.response?.data?.message ?? 'Gagal menghapus data')
  } finally {
    closeAlert({ onlyLoading: true })
  }
}

onMounted(() => fetchList())
</script>
