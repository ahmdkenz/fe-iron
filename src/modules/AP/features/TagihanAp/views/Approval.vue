<template>
  <div>
    <PageHeader
      title="Approval Tagihan AP"
      subtitle="Tinjau dan proses tagihan yang menunggu persetujuan"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Approval Tagihan', disabled: true },
      ]"
    />

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
        <template #item.submitted_by_name="{ item }">
          {{ item.submitted_by_name ?? item.created_by_name ?? '-' }}
        </template>
        <template #item.submitted_at="{ item }">
          {{ formatDateTime(item.submitted_at) }}
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex gap-1 justify-center">
            <VBtn
              icon
              size="small"
              variant="text"
              color="success"
              :loading="actingId === item.id"
              @click="openApprove(item)"
            >
              <VIcon icon="ri-checkbox-circle-line" size="18" />
              <VTooltip activator="parent">Approve</VTooltip>
            </VBtn>
            <VBtn
              icon
              size="small"
              variant="text"
              color="error"
              @click="openReject(item)"
            >
              <VIcon icon="ri-close-circle-line" size="18" />
              <VTooltip activator="parent">Reject</VTooltip>
            </VBtn>
            <VBtn icon size="small" variant="text" color="info" :to="{ name: 'ap-tagihan-show', params: { id: item.id } }">
              <VIcon icon="ri-eye-line" size="18" />
              <VTooltip activator="parent">Review</VTooltip>
            </VBtn>
          </div>
        </template>
      </BaseTable>
    </VCard>

    <BaseModal
      v-if="showApproveModal"
      v-model="showApproveModal"
      title="Approve Tagihan"
      :loading="actingId === selectedItem?.id"
      @confirm="doApprove"
    >
      <p>Anda akan menyetujui tagihan <strong>{{ selectedItem?.no_tagihan }}</strong> dari vendor <strong>{{ selectedItem?.vendor_ap?.nama_vendor }}</strong>.</p>
      <VTextField v-model="note" label="Catatan (opsional)" density="compact" variant="outlined" class="mt-3" />
      <template #actions>
        <VBtn variant="tonal" color="secondary" @click="showApproveModal = false">Batal</VBtn>
        <VBtn color="success" :loading="actingId === selectedItem?.id" @click="doApprove">
          <VIcon icon="ri-checkbox-circle-line" class="me-1" />
          Ya, Approve
        </VBtn>
      </template>
    </BaseModal>

    <BaseModal
      v-if="showRejectModal"
      v-model="showRejectModal"
      title="Reject Tagihan"
      :loading="actingId === selectedItem?.id"
      @confirm="doReject"
    >
      <p>Anda akan menolak tagihan <strong>{{ selectedItem?.no_tagihan }}</strong>.</p>
      <VTextField
        v-model="note"
        label="Alasan Penolakan (wajib)"
        density="compact"
        variant="outlined"
        class="mt-3"
        :rules="[v => !!v || 'Alasan wajib diisi']"
      />
      <template #actions>
        <VBtn variant="tonal" color="secondary" @click="showRejectModal = false">Batal</VBtn>
        <VBtn color="error" :disabled="!note" :loading="actingId === selectedItem?.id" @click="doReject">
          <VIcon icon="ri-close-circle-line" class="me-1" />
          Ya, Reject
        </VBtn>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useCrud } from '@/composables/useCrud'
import { useFormatter } from '@/composables/useFormatter'
import { useSweetAlert } from '@/composables/useSweetAlert'
import api from '@/utils/axios'

const { items, loading, meta, params, fetchList } = useCrud('/ap/tagihan/approval')
const { formatCurrency, formatDate, formatDateTime } = useFormatter()
const { showSuccess, showError } = useSweetAlert()

const showApproveModal = ref(false)
const showRejectModal = ref(false)
const selectedItem = ref(null)
const actingId = ref(null)
const note = ref('')

const headers = [
  { title: 'No', key: 'no', sortable: false, width: '60px' },
  { title: 'No. Tagihan', key: 'no_tagihan', sortable: false },
  { title: 'Vendor', key: 'vendor_ap', sortable: false },
  { title: 'Tanggal', key: 'tanggal_tagihan', sortable: false },
  { title: 'Nominal', key: 'total_tagihan', sortable: false },
  { title: 'Pengaju', key: 'submitted_by_name', sortable: false },
  { title: 'Diajukan Pada', key: 'submitted_at', sortable: false },
  { title: 'Aksi', key: 'actions', sortable: false, align: 'center', width: '140px' },
]

let debounceTimer = null
function debouncedFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(doFetch, 400)
}

function doFetch() {
  params.page = 1
  fetchList()
}

function onTableOptions({ page, itemsPerPage }) {
  params.page = page
  params.per_page = itemsPerPage
  fetchList()
}

function openApprove(item) { selectedItem.value = item; note.value = ''; showApproveModal.value = true }
function openReject(item) { selectedItem.value = item; note.value = ''; showRejectModal.value = true }

async function doApprove() {
  if (!selectedItem.value) return
  actingId.value = selectedItem.value.id
  try {
    await api.patch(`/ap/tagihan/${selectedItem.value.id}/approve`, { note: note.value || null })
    showApproveModal.value = false
    await showSuccess(`Tagihan ${selectedItem.value.no_tagihan} berhasil disetujui.`)
    doFetch()
  } catch (err) {
    await showError(err.response?.data?.message ?? 'Gagal menyetujui tagihan.')
  } finally {
    actingId.value = null
  }
}

async function doReject() {
  if (!selectedItem.value || !note.value) return
  actingId.value = selectedItem.value.id
  try {
    await api.patch(`/ap/tagihan/${selectedItem.value.id}/reject`, { note: note.value })
    showRejectModal.value = false
    await showSuccess(`Tagihan ${selectedItem.value.no_tagihan} berhasil ditolak.`)
    doFetch()
  } catch (err) {
    await showError(err.response?.data?.message ?? 'Gagal menolak tagihan.')
  } finally {
    actingId.value = null
  }
}

doFetch()
</script>
