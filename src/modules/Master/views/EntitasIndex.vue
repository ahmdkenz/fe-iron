<template>
  <div>
    <PageHeader
      title="Manajemen Entitas"
      subtitle="Kelola data entitas"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Entitas', disabled: true }
      ]"
    >
      <VBtn
        color="primary"
        prepend-icon="ri-add-line"
        @click="openCreate"
      >
        Tambah Entitas
      </VBtn>
    </PageHeader>

    <VCard>
      <VCardText class="d-flex gap-4 pb-0">
        <VTextField
          v-model="params.search"
          placeholder="Cari kode / nama entitas..."
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
        @update:options="onTableOptions"
      >
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
          <VChip
            :color="item.status ? 'success' : 'error'"
            size="small"
            label
          >
            {{ item.status ? 'Aktif' : 'Nonaktif' }}
          </VChip>
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
        <span class="text-h6 font-weight-semibold">Detail Entitas</span>
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
        v-if="selectedEntitas"
        class="pa-4"
      >
        <div class="mb-4 text-center">
          <VAvatar
            size="72"
            color="primary"
            class="mb-3"
          >
            <span class="text-h5">{{ selectedEntitas.nama_singkatan_perusahaan?.charAt(0) }}</span>
          </VAvatar>
          <div class="text-h6 font-weight-bold">
            {{ selectedEntitas.nama_perusahaan }}
          </div>
          <VChip
            color="primary"
            size="small"
            variant="tonal"
            label
            class="mt-1"
          >
            {{ selectedEntitas.kode_perusahaan }}
          </VChip>
        </div>
        <VDivider class="mb-4" />
        <DetailRow
          label="Singkatan"
          :value="selectedEntitas.nama_singkatan_perusahaan"
        />
        <DetailRow
          label="Keterangan"
          :value="selectedEntitas.keterangan"
        />
        <DetailRow
          label="Nama Direktur"
          :value="selectedEntitas.nama_direktur"
        />
        <DetailRow label="Status">
          <VChip
            :color="selectedEntitas.status ? 'success' : 'error'"
            size="small"
            label
          >
            {{ selectedEntitas.status ? 'Aktif' : 'Nonaktif' }}
          </VChip>
        </DetailRow>
        <DetailRow
          label="Created By"
          :value="selectedEntitas.created_by_name"
        />
        <DetailRow
          label="Updated By"
          :value="selectedEntitas.updated_by_name"
        />
        <DetailRow
          label="Created At"
          :value="selectedEntitas.created_at"
        />
        <DetailRow
          label="Updated At"
          :value="selectedEntitas.updated_at"
        />
      </div>
    </VNavigationDrawer>

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
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useCrud } from '@/composables/useCrud.js'

const router = useRouter()
const { showSuccess, showError } = useSweetAlert()
const { items, loading, meta, params, fetchList, remove } = useCrud('/master/perusahaan')

const showDelete  = ref(false)
const showDetail  = ref(false)
const deleteError = ref('')
const selectedEntitas = ref(null)

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

function openCreate()            { router.push({ name: 'master-perusahaan-create' }) }
function openEdit(p)             { router.push({ name: 'master-perusahaan-edit', params: { id: p.id } }) }
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

onMounted(() => fetchList())
</script>
