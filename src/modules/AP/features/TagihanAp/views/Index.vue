<template>
  <div>
    <PageHeader
      title="Tagihan AP"
      subtitle="Kelola tagihan dari vendor"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Tagihan', disabled: true }
      ]"
    >
      <VBtn
        v-if="authStore.canOperateTagihanAp"
        color="primary"
        prepend-icon="ri-add-line"
        :to="{ name: 'ap-tagihan-create' }"
      >
        Input Tagihan
      </VBtn>
    </PageHeader>

    <VRow class="mb-4">
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar color="primary" variant="tonal" size="44"><VIcon icon="ri-bill-line" /></VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">Total Tagihan</div>
                <div class="text-h6 font-weight-bold">{{ summary.total_tagihan ?? '-' }}</div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar color="info" variant="tonal" size="44"><VIcon icon="ri-wallet-3-line" /></VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">Total Nominal</div>
                <div class="text-h6 font-weight-bold">{{ formatCurrency(summary.total_nominal) }}</div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar color="success" variant="tonal" size="44"><VIcon icon="ri-money-cny-circle-line" /></VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">Total Terbayar</div>
                <div class="text-h6 font-weight-bold">{{ formatCurrency(summary.total_pembayaran) }}</div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar color="error" variant="tonal" size="44"><VIcon icon="ri-error-warning-line" /></VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">Sisa Hutang</div>
                <div class="text-h6 font-weight-bold">{{ formatCurrency(summary.total_sisa) }}</div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VCard>
      <VCardText class="d-flex flex-wrap gap-3 pb-0">
        <VTextField
          v-model="params.search"
          placeholder="Cari no. tagihan / vendor..."
          clearable
          hide-details
          density="compact"
          style="max-width: 260px"
          prepend-inner-icon="ri-search-line"
          @update:model-value="debouncedFetch"
        />
        <VSelect
          v-model="params.status"
          placeholder="Semua Status"
          clearable
          hide-details
          density="compact"
          style="max-width: 180px"
          :items="statusOptions"
          item-title="label"
          item-value="value"
          @update:model-value="doFetch"
        />
        <VSelect
          v-model="params.approval_status"
          placeholder="Semua Approval"
          clearable
          hide-details
          density="compact"
          style="max-width: 200px"
          :items="approvalStatusOptions"
          item-title="label"
          item-value="value"
          @update:model-value="doFetch"
        />
      </VCardText>

      <BaseTable
        :headers="headers"
        :items="items"
        :total="meta.total"
        :loading="loading"
        :per-page="meta.per_page"
        :page="meta.current_page"
        show-select
        v-model:selected="selected"
        column-resize-key="ap-tagihan-index"
        class="mt-2"
        @update:options="onTableOptions"
      >
        <template #item.no="{ index }">
          {{ (meta.current_page - 1) * meta.per_page + index + 1 }}
        </template>
        <template #item.no_tagihan="{ item }">
          <VChip color="primary" size="small" variant="tonal" label>{{ item.no_tagihan }}</VChip>
        </template>
        <template #item.vendor_ap="{ item }">
          {{ item.vendor_ap?.nama_vendor ?? '-' }}
        </template>
        <template #item.tanggal_tagihan="{ item }">
          {{ formatDate(item.tanggal_tagihan) }}
        </template>
        <template #item.total_tagihan="{ item }">
          {{ formatCurrency(item.total_tagihan) }}
        </template>
        <template #item.sisa_tagihan="{ item }">
          <span :class="item.sisa_tagihan > 0 ? 'text-error' : 'text-success'">
            {{ formatCurrency(item.sisa_tagihan) }}
          </span>
        </template>
        <template #item.status="{ item }">
          <TagihanApStatusBadge :status="item.status" />
        </template>
        <template #item.approval_status="{ item }">
          <ApprovalStatusBadge :status="item.approval_status" />
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <VBtn icon size="small" variant="text" color="info" :to="{ name: 'ap-tagihan-show', params: { id: item.id } }">
              <VIcon icon="ri-eye-line" size="18" />
              <VTooltip activator="parent">Detail</VTooltip>
            </VBtn>
            <VBtn
              v-if="item.can_edit && authStore.canOperateTagihanAp"
              icon
              size="small"
              variant="text"
              color="primary"
              :to="{ name: 'ap-tagihan-edit', params: { id: item.id } }"
            >
              <VIcon icon="ri-pencil-line" size="18" />
              <VTooltip activator="parent">Edit</VTooltip>
            </VBtn>
            <VBtn
              v-if="item.status === 'DRAFT' && authStore.canOperateTagihanAp"
              icon
              size="small"
              variant="text"
              color="error"
              @click="confirmDeleteItem(item)"
            >
              <VIcon icon="ri-delete-bin-line" size="18" />
              <VTooltip activator="parent">Hapus</VTooltip>
            </VBtn>
          </div>
        </template>
      </BaseTable>
    </VCard>

    <BaseModal
      v-if="showDelete"
      v-model="showDelete"
      title="Hapus Tagihan"
      :loading="deleting"
      confirm-action="hapus"
      @confirm="doDelete"
    >
      <p>Apakah Anda yakin ingin menghapus tagihan <strong>{{ selectedTagihan?.no_tagihan }}</strong>?</p>
      <VAlert v-if="deleteError" type="error" variant="tonal" class="mt-3">{{ deleteError }}</VAlert>
    </BaseModal>

    <BulkDeleteBar :selected="selected" @delete="doBulkDelete" @clear="selected = []" />
  </div>
</template>

<script setup>
import { nextTick, onDeactivated, reactive, ref } from 'vue'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useAuthStore } from '@/stores/auth.store'
import { useCrud } from '@/composables/useCrud'
import { useFormatter } from '@/composables/useFormatter'
import api from '@/utils/axios'
import BulkDeleteBar from '@/components/base/BulkDeleteBar.vue'
import ApprovalStatusBadge from '@/modules/Finance/shared/components/ApprovalStatusBadge.vue'
import TagihanApStatusBadge from '../components/TagihanApStatusBadge.vue'

const authStore = useAuthStore()
const { showSuccess, showError, showLoading, closeAlert, confirmDelete: swalConfirmDelete } = useSweetAlert()
const { formatCurrency, formatDate } = useFormatter()

const { items, loading, meta, params, fetchList, remove } = useCrud('/ap/tagihan')

const selected = ref([])
const showDelete = ref(false)
const deleteError = ref('')
const deleting = ref(false)
const selectedTagihan = ref(null)

const summary = reactive({ total_tagihan: null, total_nominal: null, total_pembayaran: null, total_sisa: null })

const headers = [
  { title: 'No', key: 'no', sortable: false, width: '60px' },
  { title: 'No. Tagihan', key: 'no_tagihan', sortable: false, minWidth: '160px' },
  { title: 'Vendor', key: 'vendor_ap', sortable: false, minWidth: '200px' },
  { title: 'Tanggal', key: 'tanggal_tagihan', sortable: false, minWidth: '120px' },
  { title: 'Total Tagihan', key: 'total_tagihan', sortable: false, minWidth: '150px' },
  { title: 'Sisa', key: 'sisa_tagihan', sortable: false, minWidth: '150px' },
  { title: 'Status', key: 'status', sortable: false, minWidth: '120px' },
  { title: 'Approval', key: 'approval_status', sortable: false, minWidth: '150px' },
  { title: 'Aksi', key: 'actions', sortable: false, align: 'center', width: '120px' },
]

const statusOptions = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Diterima', value: 'DITERIMA' },
  { label: 'Sebagian', value: 'SEBAGIAN' },
  { label: 'Lunas', value: 'LUNAS' },
]

const approvalStatusOptions = [
  { label: 'Menunggu Persetujuan', value: 'PENDING' },
  { label: 'Disetujui', value: 'APPROVED' },
  { label: 'Ditolak', value: 'REJECTED' },
]

let debounceTimer = null
function debouncedFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(doFetch, 400)
}

function doFetch() {
  params.page = 1
  fetchList()
  loadSummary()
}

function onTableOptions({ page, itemsPerPage }) {
  params.page = page
  params.per_page = itemsPerPage
  fetchList()
}

async function loadSummary() {
  try {
    const { data } = await api.get('/ap/tagihan/summary', {
      params: { search: params.search, status: params.status, approval_status: params.approval_status },
    })
    Object.assign(summary, data.data)
  } catch {
    // biarkan summary kosong jika gagal
  }
}

function confirmDeleteItem(item) { selectedTagihan.value = item; deleteError.value = ''; showDelete.value = true }

onDeactivated(() => { showDelete.value = false })

async function doDelete() {
  deleteError.value = ''
  const deleteId = selectedTagihan.value?.id
  if (!deleteId) return

  showDelete.value = false
  await nextTick()
  deleting.value = true

  const res = await remove(deleteId)
  deleting.value = false
  if (res.success) {
    fetchList()
    loadSummary()
    await showSuccess('Tagihan berhasil dihapus.')
  } else {
    deleteError.value = res.message || 'Gagal menghapus data'
    await showError(deleteError.value)
  }
}

async function doBulkDelete() {
  if (!selected.value.length) return
  const { isConfirmed } = await swalConfirmDelete(`Sebanyak ${selected.value.length} data yang dipilih akan dihapus.`)
  if (!isConfirmed) return
  showLoading({ title: 'Menghapus Data', text: 'Mohon tunggu...' })
  try {
    const res = await api.delete('/ap/tagihan/bulk', { data: { ids: selected.value.map(i => i.id) } })
    const deleted = res.data?.data?.deleted ?? selected.value.length
    selected.value = []
    fetchList()
    loadSummary()
    await showSuccess(`${deleted} tagihan berhasil dihapus.`)
  } catch (err) {
    await showError(err.response?.data?.message ?? 'Gagal menghapus data')
  } finally {
    closeAlert({ onlyLoading: true })
  }
}

doFetch()
</script>
