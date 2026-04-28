<template>
  <div>
    <PageHeader 
      title="Manajemen User" 
      subtitle="Kelola akun pengguna sistem"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Manajemen User', disabled: true }
      ]"
    >
      <VBtn
        color="primary"
        prepend-icon="ri-add-line"
        @click="openCreate"
      >
        Tambah User
      </VBtn>
    </PageHeader>

    <VCard>
      <VCardText class="d-flex gap-4 pb-0">
        <VTextField
          v-model="params.search"
          placeholder="Cari username / email..."
          clearable
          hide-details
          density="compact"
          style="max-width: 280px"
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
        <template #item.karyawan="{ item }">
          {{ item.karyawan?.nama_karyawan ?? '-' }}
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
        <template #item.role="{ item }">
          <VChip
            v-if="item.role"
            color="primary"
            size="small"
            variant="tonal"
            label
          >
            {{ item.role.nama_role }}
          </VChip>
          <span v-else>-</span>
        </template>        <template #item.created_by_name="{ item }">
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
        <span class="text-h6 font-weight-semibold">Detail User</span>
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
        v-if="selectedUser"
        class="pa-4"
      >
        <div class="mb-4 text-center">
          <VAvatar
            size="72"
            color="primary"
            class="mb-3"
          >
            <span class="text-h5">{{ selectedUser.username?.charAt(0)?.toUpperCase() }}</span>
          </VAvatar>
          <div class="text-h6 font-weight-bold">
            {{ selectedUser.username }}
          </div>
          <VChip
            :color="selectedUser.status ? 'success' : 'error'"
            size="small"
            label
            class="mt-1"
          >
            {{ selectedUser.status ? 'Aktif' : 'Nonaktif' }}
          </VChip>
        </div>
        <VDivider class="mb-4" />
        <DetailRow
          label="Email"
          :value="selectedUser.email"
        />
        <DetailRow
          label="No. HP"
          :value="selectedUser.no_hp"
        />
        <DetailRow
          label="Karyawan"
          :value="selectedUser.karyawan?.nama_karyawan"
        />
        <DetailRow label="Role">
          <template #default>
            <VChip
              v-if="selectedUser.role"
              color="primary"
              size="small"
              variant="tonal"
              label
            >
              {{ selectedUser.role.nama_role }}
            </VChip>
            <span v-else>-</span>
          </template>
        </DetailRow>
        <DetailRow
          label="Created By"
          :value="selectedUser.created_by_name"
        />
        <DetailRow
          label="Updated By"
          :value="selectedUser.updated_by_name"
        />
        <DetailRow
          label="Created At"
          :value="selectedUser.created_at"
        />
        <DetailRow
          label="Updated At"
          :value="selectedUser.updated_at"
        />
      </div>
    </VNavigationDrawer>

    <!-- Confirm Delete -->
    <BaseModal
      v-if="showDelete"
      v-model="showDelete"
      title="Hapus User"
      :loading="loading"
      @confirm="doDelete"
    >
      <p>Apakah Anda yakin ingin menghapus user <strong>{{ selectedUser?.username }}</strong>?</p>
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
const { items, loading, meta, params, fetchList, remove } = useCrud('/iam/users')

const showDelete = ref(false)
const showDetail = ref(false)
const deleteError = ref('')
const selectedUser = ref(null)

const headers = [
  { title: 'No', key: 'no', sortable: false, width: '60px' },
  { title: 'Karyawan', key: 'karyawan', sortable: false },
  { title: 'Username', key: 'username', sortable: false },
  { title: 'Email', key: 'email', sortable: false },
  { title: 'No. HP', key: 'no_hp', sortable: false },
  { title: 'Role', key: 'role', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Created By', key: 'created_by_name', sortable: false },
  { title: 'Updated By', key: 'updated_by_name', sortable: false },
  { title: 'Aksi', key: 'actions', sortable: false, align: 'center', width: '120px' },
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

function openCreate() {
  router.push({ name: 'iam-users-create' })
}

function openEdit(user) {
  router.push({ name: 'iam-users-edit', params: { id: user.id } })
}

function openDetail(user) {
  selectedUser.value = user
  showDetail.value = true
}

function confirmDelete(user) {
  selectedUser.value = user
  deleteError.value = ''
  showDelete.value = true
}

async function doDelete() {
  deleteError.value = ''

  const deleteId = selectedUser.value?.id
  if (!deleteId) return

  showDelete.value = false
  await nextTick()

  const res = await remove(deleteId)
  if (res.success) {
    fetchList()
    await showSuccess('User berhasil dihapus.')
  } else {
    deleteError.value = res.message || 'Gagal menghapus data'
    await showError(deleteError.value)
  }
}

onMounted(() => fetchList())
</script>
