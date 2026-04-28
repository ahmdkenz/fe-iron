<template>
  <div>
    <PageHeader 
      title="Manajemen Barang" 
      subtitle="Kelola data barang"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Barang', disabled: true }
      ]"
    >
      <VBtn
        v-if="!authStore.isArOnly && !authStore.isDirectorOnly"
        color="primary"
        prepend-icon="ri-add-line"
        @click="openCreate"
      >
        Tambah Barang
      </VBtn>
    </PageHeader>

    <VCard>
      <VCardText class="d-flex gap-4 pb-0">
        <VTextField
          v-model="params.search"
          placeholder="Cari kode / nama barang..."
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
        <template #item.spesifikasi="{ item }">
          {{ item.spesifikasi ?? '-' }}
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
      width="380"
      temporary
    >
      <div class="d-flex align-center justify-space-between pa-4">
        <span class="text-h6 font-weight-semibold">Detail Barang</span>
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
        v-if="selectedBarang"
        class="pa-4"
      >
        <div class="mb-4 text-center">
          <VAvatar
            size="72"
            color="primary"
            class="mb-3"
          >
            <span class="text-h5">{{ selectedBarang.nama_barang?.charAt(0)?.toUpperCase() }}</span>
          </VAvatar>
          <div class="text-h6 font-weight-bold">
            {{ selectedBarang.nama_barang }}
          </div>
          <VChip
            color="primary"
            size="small"
            variant="tonal"
            label
            class="mt-1"
          >
            {{ selectedBarang.kode_barang }}
          </VChip>
        </div>
        <VDivider class="mb-4" />
        <DetailRow
          label="Spesifikasi"
          :value="selectedBarang.spesifikasi"
        />
        <DetailRow
          label="Perusahaan"
          :value="selectedBarang.perusahaan?.nama_perusahaan"
        />
        <DetailRow
          label="Brand"
          :value="selectedBarang.brand?.nama_brand"
        />
        <DetailRow
          label="Kode Brand"
          :value="selectedBarang.brand?.kode_brand"
        />
        <DetailRow
          label="Keterangan"
          :value="selectedBarang.keterangan"
        />
        <DetailRow label="Status">
          <VChip
            :color="selectedBarang.status ? 'success' : 'error'"
            size="small"
            label
          >
            {{ selectedBarang.status ? 'Aktif' : 'Nonaktif' }}
          </VChip>
        </DetailRow>
        <DetailRow
          label="Created By"
          :value="selectedBarang.created_by_name"
        />
        <DetailRow
          label="Updated By"
          :value="selectedBarang.updated_by_name"
        />
        <DetailRow
          label="Created At"
          :value="selectedBarang.created_at"
        />
        <DetailRow
          label="Updated At"
          :value="selectedBarang.updated_at"
        />
      </div>
    </VNavigationDrawer>

    <!-- Confirm Delete -->
    <BaseModal
      v-if="showDelete"
      v-model="showDelete"
      title="Hapus Barang"
      :loading="loading"
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
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useAuthStore } from '@/stores/auth.store'
import { useCrud } from '@/composables/useCrud'

const router = useRouter()
const authStore = useAuthStore()
const { showSuccess, showError } = useSweetAlert()
const { items, loading, meta, params, fetchList, remove } = useCrud('/master/barang')

const showDelete  = ref(false)
const showDetail  = ref(false)
const deleteError = ref('')
const selectedBarang = ref(null)

const headers = [
  { title: 'No',           key: 'no',              sortable: false, width: '60px' },
  { title: 'Kode Barang',  key: 'kode_barang',     sortable: false },
  { title: 'Nama Barang',  key: 'nama_barang',     sortable: false },
  { title: 'Spesifikasi',  key: 'spesifikasi',     sortable: false },
  { title: 'Perusahaan',   key: 'perusahaan',      sortable: false },
  { title: 'Brand',        key: 'brand',           sortable: false },
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

function openCreate()      { router.push({ name: 'master-barang-create' }) }
function openEdit(b)       { router.push({ name: 'master-barang-edit', params: { id: b.id } }) }
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

onMounted(() => fetchList())
</script>
