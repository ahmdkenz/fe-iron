<template>
  <div>
    <PageHeader 
      title="Manajemen Investor" 
      subtitle="Kelola data investor"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Investor', disabled: true }
      ]"
    >
      <VBtn
        v-if="!authStore.isArOnly && !authStore.isDirectorOnly"
        color="primary"
        prepend-icon="ri-add-line"
        @click="openCreate"
      >
        Tambah Investor
      </VBtn>
    </PageHeader>

    <VCard>
      <VCardText class="d-flex gap-4 pb-0">
        <VTextField
          v-model="params.search"
          placeholder="Cari nama investor / pengelola..."
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
      width="400"
      temporary
    >
      <div class="d-flex align-center justify-space-between pa-4">
        <span class="text-h6 font-weight-semibold">Detail Investor</span>
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
        v-if="selectedInvestor"
        class="pa-4"
      >
        <div class="mb-4 text-center">
          <VAvatar
            size="72"
            color="primary"
            class="mb-3"
          >
            <span class="text-h5">{{ selectedInvestor.nama_investor?.charAt(0)?.toUpperCase() }}</span>
          </VAvatar>
          <div class="text-h6 font-weight-bold">
            {{ selectedInvestor.nama_investor }}
          </div>
        </div>
        <VDivider class="mb-4" />
        <DetailRow
          label="No. KTP"
          :value="selectedInvestor.ktp"
        />
        <DetailRow
          label="NPWP"
          :value="selectedInvestor.npwp"
        />
        <DetailRow
          label="No. HP"
          :value="selectedInvestor.no_hp"
        />
        <DetailRow
          label="Nama Pengelola"
          :value="selectedInvestor.pengelola"
        />
        <DetailRow
          label="No. HP Pengelola"
          :value="selectedInvestor.no_hp_pengelola"
        />
        <DetailRow
          label="Alamat"
          :value="selectedInvestor.alamat"
        />
        <DetailRow
          label="Keterangan"
          :value="selectedInvestor.keterangan"
        />
        <DetailRow label="Status">
          <VChip
            :color="selectedInvestor.status ? 'success' : 'error'"
            size="small"
            label
          >
            {{ selectedInvestor.status ? 'Aktif' : 'Nonaktif' }}
          </VChip>
        </DetailRow>
        <DetailRow
          label="Created By"
          :value="selectedInvestor.created_by_name"
        />
        <DetailRow
          label="Updated By"
          :value="selectedInvestor.updated_by_name"
        />
        <DetailRow
          label="Created At"
          :value="selectedInvestor.created_at"
        />
        <DetailRow
          label="Updated At"
          :value="selectedInvestor.updated_at"
        />
      </div>
    </VNavigationDrawer>

    <!-- Confirm Delete -->
    <BaseModal
      v-if="showDelete"
      v-model="showDelete"
      title="Hapus Investor"
      :loading="loading"
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
const { items, loading, meta, params, fetchList, remove } = useCrud('/master/investor')

const showDelete  = ref(false)
const showDetail  = ref(false)
const deleteError = ref('')
const selectedInvestor = ref(null)

const headers = [
  { title: 'No',               key: 'no',               sortable: false, width: '60px' },
  { title: 'Nama Investor',    key: 'nama_investor',    sortable: false },
  { title: 'No. HP',           key: 'no_hp',            sortable: false },
  { title: 'Nama Pengelola',   key: 'pengelola',        sortable: false },
  { title: 'No. HP Pengelola', key: 'no_hp_pengelola',  sortable: false },
  { title: 'Alamat',           key: 'alamat',           sortable: false },
  { title: 'Keterangan',       key: 'keterangan',       sortable: false },
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
  params.page = page
  params['per_page'] = itemsPerPage
  fetchList()
}

function openCreate()     { router.push({ name: 'master-investor-create' }) }
function openEdit(inv)    { router.push({ name: 'master-investor-edit', params: { id: inv.id } }) }
function openDetail(inv)  { selectedInvestor.value = inv;  showDetail.value = true }
function confirmDelete(inv) { selectedInvestor.value = inv; deleteError.value = ''; showDelete.value = true }

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

onMounted(() => fetchList())
</script>
