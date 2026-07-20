<template>
  <div>
    <PageHeader
      title="Tagihan AP"
      subtitle="Pengelolaan tagihan vendor"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Tagihan AP', disabled: true }
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

    <!-- ── Section: List Tagihan AP ─────────────────────────────────────────── -->
    <div class="d-flex align-center gap-2 mb-4">
      <VIcon
        icon="ri-list-check-2"
        color="primary"
      />
      <span class="text-h6 font-weight-semibold">List Tagihan AP</span>
    </div>

    <VRow class="mb-4">
      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar
                color="primary"
                variant="tonal"
                size="44"
              >
                <VIcon icon="ri-bill-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">
                  Total Tagihan
                </div>
                <div class="text-h6 font-weight-bold">
                  {{ summary.total_tagihan ?? '-' }}
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar
                color="info"
                variant="tonal"
                size="44"
              >
                <VIcon icon="ri-wallet-3-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">
                  Total Nominal
                </div>
                <div class="text-h6 font-weight-bold">
                  {{ formatCurrency(summary.total_nominal) }}
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar
                color="success"
                variant="tonal"
                size="44"
              >
                <VIcon icon="ri-money-cny-circle-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">
                  Total Terbayar
                </div>
                <div class="text-h6 font-weight-bold">
                  {{ formatCurrency(summary.total_pembayaran) }}
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar
                color="error"
                variant="tonal"
                size="44"
              >
                <VIcon icon="ri-error-warning-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">
                  Sisa Hutang
                </div>
                <div class="text-h6 font-weight-bold">
                  {{ formatCurrency(summary.total_sisa) }}
                </div>
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
      </VCardText>

      <BaseTable
        v-model:selected="selected"
        :headers="headers"
        :items="items"
        :total="meta.total"
        :loading="loading"
        :per-page="meta.per_page"
        :page="meta.current_page"
        show-select
        column-resize-key="ap-tagihan-index"
        class="mt-2"
        @update:options="onTableOptions"
      >
        <template #item.no="{ index }">
          {{ (meta.current_page - 1) * meta.per_page + index + 1 }}
        </template>
        <template #item.no_tagihan="{ item }">
          <VChip
            color="primary"
            size="small"
            variant="tonal"
            label
          >
            {{ item.no_tagihan }}
          </VChip>
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
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <VBtn
              icon
              size="small"
              variant="text"
              color="info"
              :to="{ name: 'ap-tagihan-show', params: { id: item.id } }"
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
              v-if="item.can_edit && authStore.canOperateTagihanAp"
              icon
              size="small"
              variant="text"
              color="primary"
              :to="{ name: 'ap-tagihan-edit', params: { id: item.id } }"
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
              v-if="item.can_edit && authStore.canOperateTagihanAp"
              icon
              size="small"
              variant="text"
              color="error"
              @click="confirmDeleteItem(item)"
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

    <BaseModal
      v-if="showDelete"
      v-model="showDelete"
      title="Hapus Tagihan"
      :loading="deleting"
      confirm-action="hapus"
      @confirm="doDelete"
    >
      <p>Apakah Anda yakin ingin menghapus tagihan <strong>{{ selectedTagihan?.no_tagihan }}</strong>?</p>
      <VAlert
        type="warning"
        variant="tonal"
        density="compact"
        class="mt-3"
      >
        Tindakan ini tidak dapat diurungkan — data akan dihapus permanen dari database.
      </VAlert>
      <VAlert
        v-if="deleteError"
        type="error"
        variant="tonal"
        class="mt-3"
      >
        {{ deleteError }}
      </VAlert>
    </BaseModal>

    <div
      v-if="eligibleForVoucher.length"
      class="bulk-voucher-bar"
    >
      <div class="d-flex align-center gap-3">
        <VIcon
          icon="ri-checkbox-multiple-line"
          color="primary"
        />
        <span class="text-body-2">{{ eligibleForVoucher.length }} tagihan siap dibuatkan Payment Voucher</span>
      </div>
      <VBtn
        color="primary"
        size="small"
        prepend-icon="ri-bill-line"
        @click="goToVoucher"
      >
        Buat Payment Voucher
      </VBtn>
    </div>

    <BulkDeleteBar
      :selected="selected"
      @delete="doBulkDelete"
      @clear="selected = []"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, onDeactivated, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useAuthStore } from '@/stores/auth.store'
import { useCrud } from '@/composables/useCrud'
import { useFormatter } from '@/composables/useFormatter'
import api from '@/utils/axios'
import BulkDeleteBar from '@/components/base/BulkDeleteBar.vue'
import TagihanApStatusBadge from '../components/TagihanApStatusBadge.vue'

const router = useRouter()
const authStore = useAuthStore()
const { showSuccess, showError, showLoading, closeAlert, confirmDelete: swalConfirmDelete } = useSweetAlert()
const { formatCurrency, formatDate, formatDateTime } = useFormatter()

// ── List Tagihan AP ──────────────────────────────────────────────────────────
const { items, loading, meta, params, fetchList, remove } = useCrud('/ap/tagihan')

const selected = ref([])
const showDelete = ref(false)
const deleteError = ref('')
const deleting = ref(false)
const selectedTagihan = ref(null)

const summary = reactive({ total_tagihan: null, total_nominal: null, total_pembayaran: null, total_sisa: null })

const eligibleForVoucher = computed(() =>
  selected.value.filter(t =>
    ['DITERIMA', 'SEBAGIAN'].includes(t.status) && t.approval_status === 'APPROVED',
  ),
)

function goToVoucher() {
  router.push({
    name: 'ap-pembayaran-create',
    query: { tagihan_ids: eligibleForVoucher.value.map(t => t.id).join(',') },
  })
}

const headers = [
  { title: 'No', key: 'no', sortable: false, width: '60px' },
  { title: 'No. Tagihan', key: 'no_tagihan', sortable: false, minWidth: '160px' },
  { title: 'Vendor', key: 'vendor_ap', sortable: false, minWidth: '200px' },
  { title: 'Tanggal', key: 'tanggal_tagihan', sortable: false, minWidth: '120px' },
  { title: 'Total Tagihan', key: 'total_tagihan', sortable: false, minWidth: '150px' },
  { title: 'Sisa', key: 'sisa_tagihan', sortable: false, minWidth: '150px' },
  { title: 'Status', key: 'status', sortable: false, minWidth: '120px' },
  { title: 'Aksi', key: 'actions', sortable: false, align: 'center', width: '120px' },
]

const statusOptions = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Diterima', value: 'DITERIMA' },
  { label: 'Sebagian', value: 'SEBAGIAN' },
  { label: 'Lunas', value: 'LUNAS' },
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
      params: { search: params.search, status: params.status },
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

<style scoped>
.bulk-voucher-bar {
  position: sticky;
  bottom: 16px;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid rgba(var(--v-theme-primary), 0.25);
  background: rgba(var(--v-theme-primary), 0.06);
}
</style>
