<template>
  <div>
    <PageHeader 
      title="Manajemen Karyawan" 
      subtitle="Kelola data karyawan"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Karyawan', disabled: true }
      ]"
    >
      <VBtn
        color="primary"
        prepend-icon="ri-add-line"
        @click="openCreate"
      >
        Tambah Karyawan
      </VBtn>
    </PageHeader>

    <VCard>
      <VCardText class="d-flex gap-4 pb-0">
        <VTextField
          v-model="params.search"
          placeholder="Cari NIK / nama karyawan..."
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
        <VChip
          :color="selectedKaryawan?.status ? 'success' : 'error'"
          size="small"
          label
        >
          {{ selectedKaryawan?.status ? 'Aktif' : 'Nonaktif' }}
        </VChip>
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
      @saved="onFormSaved"
    />
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref } from 'vue'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useCrud } from '@/composables/useCrud.js'

const { showSuccess, showError } = useSweetAlert()
const { items, loading, meta, params, fetchList, remove } = useCrud('/master/karyawan')

const showDelete = ref(false)
const showDetail = ref(false)
const showForm   = ref(false)
const deleteError = ref('')
const selectedKaryawan = ref(null)
const selectedForm = ref(null)

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

function openCreate() { selectedForm.value = null; showForm.value = true }
function openEdit(k) { selectedForm.value = k; showForm.value = true }
function onFormSaved() { showForm.value = false; fetchList() }
function openDetail(k)    { selectedKaryawan.value = k;    showDetail.value = true }
function confirmDelete(k) { selectedKaryawan.value = k;    deleteError.value = ''; showDelete.value = true }

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

onMounted(() => fetchList())
</script>
