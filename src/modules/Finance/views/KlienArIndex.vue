<template>
  <div>
    <PageHeader 
      title="Klien AR" 
      subtitle="Kelola data klien Account Receivable"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Klien AR', disabled: true }
      ]"
    >
      <VBtn
        v-if="!authStore.isArOnly && !authStore.isDirectorOnly"
        color="primary"
        prepend-icon="ri-add-line"
        @click="openCreate"
      >
        Tambah Klien
      </VBtn>
    </PageHeader>

    <VCard>
      <VCardText class="d-flex flex-wrap gap-4 pb-0">
        <VTextField
          v-model="params.search"
          placeholder="Cari kode / nama klien..."
          clearable
          hide-details
          density="compact"
          style="max-width: 300px"
          prepend-inner-icon="ri-search-line"
          @update:model-value="debouncedFetch"
        />
        <VBtnToggle
          v-model="activeKategori"
          density="compact"
          variant="outlined"
          divided
          @update:model-value="onKategoriChange"
        >
          <VBtn value="">
            Semua
          </VBtn>
          <VBtn value="INTERNAL">
            Internal
          </VBtn>
          <VBtn value="EKSTERNAL">
            Eksternal
          </VBtn>
        </VBtnToggle>
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
        <template #item.kode_klien="{ item }">
          <VChip
            color="primary"
            size="small"
            variant="tonal"
            label
          >
            {{ item.kode_klien }}
          </VChip>
        </template>
        <template #item.tipe_klien="{ item }">
          <VChip
            :color="tipeColor(item.tipe_klien)"
            size="small"
            variant="tonal"
            label
          >
            {{ item.tipe_klien }}
          </VChip>
        </template>
        <template #item.kategori_ar="{ item }">
          <VChip
            :color="item.kategori_ar === 'INTERNAL' ? 'secondary' : 'warning'"
            size="small"
            variant="tonal"
            label
          >
            {{ item.kategori_ar }}
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
        <template #item.karyawan_ar="{ item }">
          {{ item.karyawan_ar?.nama_karyawan ?? '-' }}
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
        <span class="text-h6 font-weight-semibold">Detail Klien AR</span>
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
        v-if="selectedKlien"
        class="pa-4"
      >
        <div class="mb-4 text-center">
          <VAvatar
            size="72"
            color="primary"
            class="mb-3"
          >
            <span class="text-h5">{{ selectedKlien.nama_klien?.charAt(0)?.toUpperCase() }}</span>
          </VAvatar>
          <div class="text-h6 font-weight-bold">
            {{ selectedKlien.nama_klien }}
          </div>
          <VChip
            color="primary"
            size="small"
            variant="tonal"
            label
            class="mt-1"
          >
            {{ selectedKlien.kode_klien }}
          </VChip>
        </div>
        <VDivider class="mb-4" />
        <DetailRow
          label="Alias"
          :value="selectedKlien.alias"
        />
        <DetailRow label="Tipe Klien">
          <VChip
            :color="tipeColor(selectedKlien.tipe_klien)"
            size="small"
            variant="tonal"
            label
          >
            {{ selectedKlien.tipe_klien }}
          </VChip>
        </DetailRow>
        <DetailRow label="Kategori AR">
          <VChip
            :color="selectedKlien.kategori_ar === 'INTERNAL' ? 'secondary' : 'warning'"
            size="small"
            variant="tonal"
            label
          >
            {{ selectedKlien.kategori_ar }}
          </VChip>
        </DetailRow>
        <DetailRow
          label="Tipe Outlet"
          :value="selectedKlien.tipe_outlet"
        />
        <DetailRow
          label="Area Stokis"
          :value="selectedKlien.stokis_area"
        />
        <DetailRow
          label="No. NPWP"
          :value="selectedKlien.no_npwp"
        />
        <DetailRow
          label="Kategori 1"
          :value="selectedKlien.kat_1"
        />
        <DetailRow
          label="Kategori 2"
          :value="selectedKlien.kat_2"
        />
        <DetailRow
          label="Perusahaan"
          :value="selectedKlien.perusahaan?.nama_perusahaan"
        />
        <DetailRow
          label="Staff AR"
          :value="selectedKlien.karyawan_ar?.nama_karyawan"
        />
        <DetailRow
          label="Resto"
          :value="selectedKlien.resto?.nama_resto"
        />
        <DetailRow label="Status">
          <VChip
            :color="selectedKlien.status ? 'success' : 'error'"
            size="small"
            label
          >
            {{ selectedKlien.status ? 'Aktif' : 'Nonaktif' }}
          </VChip>
        </DetailRow>
        <DetailRow
          label="Created By"
          :value="selectedKlien.created_by_name"
        />
        <DetailRow
          label="Updated By"
          :value="selectedKlien.updated_by_name"
        />
      </div>
    </VNavigationDrawer>

    <!-- Confirm Delete -->
    <BaseModal
      v-if="showDelete"
      v-model="showDelete"
      title="Hapus Klien AR"
      :loading="loading"
      @confirm="doDelete"
    >
      <p>
        Apakah Anda yakin ingin menghapus klien
        <strong>{{ selectedKlien?.nama_klien }}</strong>?
      </p>
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
const { items, loading, meta, params, fetchList, remove } = useCrud('/finance/klien-ar')

const showDelete = ref(false)
const showDetail = ref(false)
const deleteError = ref('')
const selectedKlien = ref(null)

const headers = [
  { title: 'No',          key: 'no',           sortable: false, width: '60px' },
  { title: 'Kode',        key: 'kode_klien',   sortable: false },
  { title: 'Nama Klien',  key: 'nama_klien',   sortable: false },
  { title: 'Alias',       key: 'alias',        sortable: false },
  { title: 'Tipe',        key: 'tipe_klien',   sortable: false },
  { title: 'Kategori AR', key: 'kategori_ar',  sortable: false },
  { title: 'Penagih',  key: 'perusahaan',   sortable: false },
  { title: 'Staff AR',    key: 'karyawan_ar',  sortable: false },
  { title: 'Status',      key: 'status',       sortable: false },
  { title: 'Aksi',        key: 'actions',      sortable: false, align: 'center', width: '120px' },
]

const activeKategori = ref('')

function tipeColor(tipe) {
  const map = { PT: 'primary', RESTO: 'info', STOKIS: 'warning', MITRA: 'success' }

  return map[tipe] ?? 'secondary'
}

function onKategoriChange(val) {
  params.kategori_ar = val || undefined
  params.page = 1
  fetchList()
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

function openCreate()      { router.push({ name: 'finance-klien-ar-create' }) }
function openEdit(k)       { router.push({ name: 'finance-klien-ar-edit', params: { id: k.id } }) }
function openDetail(k)     { selectedKlien.value = k;    showDetail.value = true }
function confirmDelete(k)  { selectedKlien.value = k;    deleteError.value = ''; showDelete.value = true }

async function doDelete() {
  deleteError.value = ''

  const deleteId = selectedKlien.value?.id
  if (!deleteId) return

  showDelete.value = false
  await nextTick()

  const res = await remove(deleteId)
  if (res.success) {
    fetchList()
    await showSuccess('Klien AR berhasil dihapus.')
  } else {
    deleteError.value = res.message || 'Gagal menghapus data'
    await showError(deleteError.value)
  }
}

onMounted(() => fetchList())
</script>
