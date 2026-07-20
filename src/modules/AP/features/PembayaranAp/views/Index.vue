<template>
  <div>
    <PageHeader
      title="Payment Voucher"
      subtitle="Riwayat Payment Voucher ke vendor"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Payment Voucher', disabled: true }
      ]"
    >
      <VBtn
        color="secondary"
        variant="tonal"
        prepend-icon="ri-download-2-line"
        class="me-2"
        :loading="exportingExcel"
        @click="exportExcel"
      >
        Export Excel
      </VBtn>
      <VBtn
        v-if="authStore.canOperatePembayaranAp"
        color="primary"
        prepend-icon="ri-add-line"
        :to="{ name: 'ap-pembayaran-create' }"
      >
        Buat Payment Voucher
      </VBtn>
    </PageHeader>

    <VCard>
      <VCardText class="d-flex flex-wrap align-center gap-3 pb-0">
        <VSelect
          v-model="params.metode_pembayaran"
          placeholder="Semua Metode"
          clearable
          hide-details
          density="compact"
          style="max-width: 180px"
          :items="metodeOptions"
          item-title="label"
          item-value="value"
          @update:model-value="doFetch"
        />
        <VSelect
          v-model="params.kategori_voucher"
          placeholder="Semua Kategori"
          clearable
          hide-details
          density="compact"
          style="max-width: 180px"
          :items="kategoriOptions"
          item-title="label"
          item-value="value"
          @update:model-value="doFetch"
        />
        <VTextField
          v-model="params.tanggal_dari"
          type="date"
          label="Dari"
          density="compact"
          variant="outlined"
          hide-details
          style="max-width: 180px"
          @update:model-value="doFetch"
        />
        <VTextField
          v-model="params.tanggal_sampai"
          type="date"
          label="Sampai"
          density="compact"
          variant="outlined"
          hide-details
          style="max-width: 180px"
          @update:model-value="doFetch"
        />
        <VSpacer />
        <div class="text-body-2 text-medium-emphasis">
          Total: <strong>{{ formatCurrency(totalJumlah) }}</strong>
        </div>
      </VCardText>

      <BaseTable
        :headers="headers"
        :items="items"
        :total="meta.total"
        :loading="loading"
        :per-page="meta.per_page"
        :page="meta.current_page"
        show-expand
        class="mt-2"
        @update:options="onTableOptions"
      >
        <template #item.no="{ index }">
          {{ (meta.current_page - 1) * meta.per_page + index + 1 }}
        </template>
        <template #item.tanggal_pembayaran="{ item }">
          {{ item.tanggal_pembayaran }}
        </template>
        <template #item.no_referensi="{ item }">
          {{ item.no_referensi ?? '-' }}
        </template>
        <template #item.kategori_voucher_label="{ item }">
          <VChip
            size="small"
            variant="tonal"
            :color="item.kategori_voucher === 'BB' ? 'success' : item.kategori_voucher === 'NBB' ? 'info' : 'secondary'"
            label
          >
            {{ item.kategori_voucher_label }}
          </VChip>
        </template>
        <template #item.jumlah_pembayaran="{ item }">
          {{ formatCurrency(item.jumlah_pembayaran) }}
        </template>
        <template #item.jumlah_tagihan="{ item }">
          <VChip
            size="small"
            variant="tonal"
            color="secondary"
            label
          >
            {{ item.jumlah_tagihan }} tagihan
          </VChip>
        </template>
        <template #item.bukti_url="{ item }">
          <VBtn
            v-if="item.bukti_url"
            icon
            size="small"
            variant="text"
            color="info"
            :href="item.bukti_url"
            target="_blank"
            rel="noopener noreferrer"
          >
            <VIcon
              icon="ri-attachment-line"
              size="18"
            />
            <VTooltip activator="parent">
              Lihat Bukti
            </VTooltip>
          </VBtn>
          <span
            v-else
            class="text-medium-emphasis"
          >-</span>
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <VBtn
              icon
              size="small"
              variant="text"
              color="primary"
              @click="printVoucher(item)"
            >
              <VIcon
                icon="ri-printer-line"
                size="18"
              />
              <VTooltip activator="parent">
                Cetak Payment Voucher
              </VTooltip>
            </VBtn>
            <VBtn
              v-if="authStore.canOperatePembayaranAp"
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
        <template #item.data-table-expand="{ internalItem, toggleExpand, isExpanded }">
          <VBtn
            icon
            size="small"
            variant="text"
            @click="toggleExpand(internalItem)"
          >
            <VIcon
              :icon="isExpanded(internalItem) ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'"
              size="20"
            />
          </VBtn>
        </template>
        <template #expanded-row="{ columns, item }">
          <tr>
            <td
              :colspan="columns.length"
              class="pa-0"
            >
              <div class="detail-wrapper">
                <table class="detail-table w-100">
                  <thead>
                    <tr>
                      <th class="text-left">
                        No. Tagihan
                      </th>
                      <th class="text-left">
                        Vendor
                      </th>
                      <th class="text-right">
                        Dialokasikan
                      </th>
                      <th class="text-right">
                        Sisa Sebelum
                      </th>
                      <th class="text-right">
                        Sisa Setelah
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="detail in item.items"
                      :key="detail.id"
                    >
                      <td>
                        <VBtn
                          v-if="detail.tagihan_ap_id"
                          variant="text"
                          size="small"
                          color="primary"
                          :to="{ name: 'ap-tagihan-show', params: { id: detail.tagihan_ap_id } }"
                        >
                          {{ detail.no_tagihan }}
                        </VBtn>
                      </td>
                      <td>{{ detail.vendor ?? '-' }}</td>
                      <td class="text-right font-weight-medium">
                        {{ formatCurrency(detail.jumlah_dialokasikan) }}
                      </td>
                      <td class="text-right text-medium-emphasis">
                        {{ formatCurrency(detail.sisa_sebelum) }}
                      </td>
                      <td class="text-right text-medium-emphasis">
                        {{ formatCurrency(detail.sisa_sesudah) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </td>
          </tr>
        </template>
      </BaseTable>
    </VCard>

    <BaseModal
      v-if="showDelete"
      v-model="showDelete"
      title="Hapus Payment Voucher"
      :loading="deleting"
      confirm-action="hapus"
      @confirm="doDelete"
    >
      <p>Apakah Anda yakin ingin menghapus Payment Voucher ini?</p>
      <VAlert
        type="warning"
        variant="tonal"
        density="compact"
        class="mt-3"
      >
        Semua alokasi ke tagihan dalam voucher ini akan dibatalkan dan sisa tagihan terkait akan dikembalikan.
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
  </div>
</template>

<script setup>
import { computed, nextTick, onDeactivated, ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useCrud } from '@/composables/useCrud'
import { useFormatter } from '@/composables/useFormatter'
import { useSweetAlert } from '@/composables/useSweetAlert'
import api from '@/utils/axios'
import { openLoadingPrintTab } from '@/utils/printWindow.js'
import { readBlobError } from '@/utils/readBlobError'

const authStore = useAuthStore()
const { items, loading, meta, params, fetchList, remove } = useCrud('/ap/pembayaran')
const { formatCurrency } = useFormatter()
const { showSuccess, showError } = useSweetAlert()

// Backend menyertakan `total_jumlah` di response meta — useCrud.fetchList()
// meng-Object.assign seluruh meta, jadi field ini otomatis tersedia di sini.
const totalJumlah = computed(() => meta.total_jumlah ?? 0)

const showDelete = ref(false)
const deleteError = ref('')
const deleting = ref(false)
const selectedPembayaran = ref(null)
const exportingExcel = ref(false)

const headers = [
  { title: 'No', key: 'no', sortable: false, width: '60px' },
  { title: 'Tanggal', key: 'tanggal_pembayaran', sortable: false },
  { title: 'Kode Voucher', key: 'no_referensi', sortable: false },
  { title: 'Metode', key: 'metode_pembayaran', sortable: false },
  { title: 'Kategori', key: 'kategori_voucher_label', sortable: false },
  { title: 'Jumlah Total', key: 'jumlah_pembayaran', sortable: false },
  { title: 'Cakupan', key: 'jumlah_tagihan', sortable: false, align: 'center' },
  { title: 'Bukti', key: 'bukti_url', sortable: false, align: 'center' },
  { title: 'Aksi', key: 'actions', sortable: false, align: 'center', width: '110px' },
]

const metodeOptions = [
  { label: 'Transfer', value: 'TRANSFER' },
  { label: 'Cash', value: 'CASH' },
  { label: 'Giro', value: 'GIRO' },
]

const kategoriOptions = [
  { label: 'Bahan Baku', value: 'BB' },
  { label: 'Non Bahan Baku', value: 'NBB' },
]

function doFetch() {
  params.page = 1
  fetchList()
}

function onTableOptions({ page, itemsPerPage }) {
  params.page = page
  params.per_page = itemsPerPage
  fetchList()
}

async function printVoucher(item) {
  const printWindow = openLoadingPrintTab()
  try {
    const res = await api.get(`/ap/pembayaran/${item.id}/print`, { responseType: 'blob', timeout: 300000 })
    const blobUrl = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))

    if (!printWindow) {
      URL.revokeObjectURL(blobUrl)
      await showError('Popup diblokir browser. Izinkan popup untuk membuka dokumen cetak.')

      return
    }

    printWindow.location.href = blobUrl
    setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000)
  } catch (err) {
    printWindow?.close()
    await showError(await readBlobError(err, 'Gagal membuka dokumen cetak'))
  }
}

async function exportExcel() {
  exportingExcel.value = true
  try {
    const res = await api.get('/ap/pembayaran/export-excel', {
      params: {
        metode_pembayaran: params.metode_pembayaran,
        kategori_voucher: params.kategori_voucher,
        tanggal_dari: params.tanggal_dari,
        tanggal_sampai: params.tanggal_sampai,
      },
      responseType: 'blob',
      timeout: 300000,
    })

    const blobUrl = URL.createObjectURL(new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }))

    const link = document.createElement('a')

    link.href = blobUrl
    link.download = `payment-voucher-ap-${buildTimestamp()}.xlsx`
    link.click()
    URL.revokeObjectURL(blobUrl)
  } catch (err) {
    await showError(await readBlobError(err, 'Gagal mengekspor data'))
  } finally {
    exportingExcel.value = false
  }
}

function buildTimestamp() {
  const n = new Date()

  return (
    String(n.getFullYear()) +
    String(n.getMonth() + 1).padStart(2, '0') +
    String(n.getDate()).padStart(2, '0') +
    '-' +
    String(n.getHours()).padStart(2, '0') +
    String(n.getMinutes()).padStart(2, '0') +
    String(n.getSeconds()).padStart(2, '0')
  )
}

function confirmDeleteItem(item) { selectedPembayaran.value = item; deleteError.value = ''; showDelete.value = true }

onDeactivated(() => { showDelete.value = false })

async function doDelete() {
  deleteError.value = ''

  const deleteId = selectedPembayaran.value?.id
  if (!deleteId) return

  showDelete.value = false
  await nextTick()
  deleting.value = true

  const res = await remove(deleteId)

  deleting.value = false
  if (res.success) {
    fetchList()
    await showSuccess('Payment Voucher berhasil dihapus.')
  } else {
    deleteError.value = res.message || 'Gagal menghapus data'
    await showError(deleteError.value)
  }
}

doFetch()
</script>

<style scoped>
.detail-wrapper {
  padding: 12px 24px;
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.detail-table th,
.detail-table td {
  padding: 6px 10px;
  font-size: 0.8125rem;
}

.detail-table th {
  text-transform: uppercase;
  font-size: 0.6875rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
}
</style>
