<template>
  <div>
    <PageHeader 
      title="Manajemen Resto" 
      subtitle="Kelola data restoran"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Resto', disabled: true }
      ]"
    >
      <VBtn
        v-if="!authStore.isArOnly && !authStore.isDirectorOnly"
        color="primary"
        prepend-icon="ri-add-line"
        @click="openCreate"
      >
        Tambah Resto
      </VBtn>
    </PageHeader>

    <VCard>
      <VCardText class="d-flex gap-4 pb-0">
        <VTextField
          v-model="params.search"
          placeholder="Cari kode / nama resto / kota..."
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
            {{ item.brand.kode_brand }}
          </VChip>
          <span v-else>-</span>
        </template>
        <template #item.pic="{ item }">
          {{ item.pic?.nama_karyawan ?? '-' }}
        </template>
        <template #item.tgl_aktif="{ item }">
          {{ item.tgl_aktif ? formatDate(item.tgl_aktif) : '-' }}
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
      width="420"
      temporary
    >
      <div class="d-flex align-center justify-space-between pa-4">
        <span class="text-h6 font-weight-semibold">Detail Resto</span>
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
        v-if="selectedResto"
        class="pa-4"
      >
        <div class="mb-4 text-center">
          <VAvatar
            size="72"
            color="primary"
            class="mb-3"
          >
            <span class="text-h5">{{ selectedResto.nama_resto?.charAt(0)?.toUpperCase() }}</span>
          </VAvatar>
          <div class="text-h6 font-weight-bold">
            {{ selectedResto.nama_resto }}
          </div>
          <VChip
            color="primary"
            size="small"
            variant="tonal"
            label
            class="mt-1"
          >
            {{ selectedResto.kode_resto }}
          </VChip>
        </div>
        <VDivider class="mb-4" />
        <DetailRow
          label="Investor"
          :value="selectedResto.investor?.nama_investor"
        />
        <DetailRow
          label="Perusahaan"
          :value="selectedResto.perusahaan?.nama_perusahaan"
        />
        <DetailRow
          label="Brand"
          :value="selectedResto.brand?.nama_brand"
        />
        <DetailRow
          label="PIC"
          :value="selectedResto.pic?.nama_karyawan"
        />
        <DetailRow
          label="Area"
          :value="selectedResto.area"
        />
        <DetailRow
          label="Kota"
          :value="selectedResto.kota"
        />
        <DetailRow
          label="Alamat"
          :value="selectedResto.alamat"
        />
        <DetailRow
          label="No. Telp"
          :value="selectedResto.no_telp"
        />
        <DetailRow
          label="Tanggal Aktif"
          :value="selectedResto.tgl_aktif ? formatDate(selectedResto.tgl_aktif) : '-'"
        />
        <DetailRow
          label="Keterangan"
          :value="selectedResto.keterangan"
        />
        <DetailRow label="Status">
          <VChip
            :color="selectedResto.status ? 'success' : 'error'"
            size="small"
            label
          >
            {{ selectedResto.status ? 'Aktif' : 'Nonaktif' }}
          </VChip>
        </DetailRow>
        <DetailRow
          label="Created By"
          :value="selectedResto.created_by_name"
        />
        <DetailRow
          label="Updated By"
          :value="selectedResto.updated_by_name"
        />
        <DetailRow
          label="Created At"
          :value="selectedResto.created_at"
        />
        <DetailRow
          label="Updated At"
          :value="selectedResto.updated_at"
        />
      </div>
    </VNavigationDrawer>

    <!-- Confirm Delete -->
    <BaseModal
      v-if="showDelete"
      v-model="showDelete"
      title="Hapus Resto"
      :loading="loading"
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
const { items, loading, meta, params, fetchList, remove } = useCrud('/master/resto')

const showDelete  = ref(false)
const showDetail  = ref(false)
const deleteError = ref('')
const selectedResto = ref(null)

const headers = [
  { title: 'No',            key: 'no',              sortable: false, width: '60px' },
  { title: 'Kode Resto',    key: 'kode_resto',      sortable: false },
  { title: 'Nama Resto',    key: 'nama_resto',      sortable: false },
  { title: 'Investor',      key: 'investor',        sortable: false },
  { title: 'Perusahaan',    key: 'perusahaan',      sortable: false },
  { title: 'Brand',         key: 'brand',           sortable: false },
  { title: 'PIC',           key: 'pic',             sortable: false },
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
  const dt = new Date(d)
  
  return dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

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

function openCreate()      { router.push({ name: 'master-resto-create' }) }
function openEdit(r)       { router.push({ name: 'master-resto-edit', params: { id: r.id } }) }
function openDetail(r)     { selectedResto.value = r;    showDetail.value = true }
function confirmDelete(r)  { selectedResto.value = r;    deleteError.value = ''; showDelete.value = true }

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

onMounted(() => fetchList())
</script>
