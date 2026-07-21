<template>
  <div>
    <PageHeader
      :title="tagihan?.no_tagihan ?? 'Detail Tagihan'"
      :subtitle="tagihan?.vendor_ap?.nama_vendor"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Tagihan', to: { name: 'ap-tagihan-index' } },
        { title: tagihan?.no_tagihan ?? 'Detail', disabled: true },
      ]"
    >
      <div class="d-flex flex-wrap gap-2">
        <VBtn variant="tonal" color="secondary" :to="{ name: 'ap-tagihan-index' }">
          <VIcon icon="ri-arrow-left-line" class="me-1" />
          Kembali
        </VBtn>
        <VBtn
          v-if="tagihan?.can_edit && authStore.canOperateTagihanAp"
          color="primary"
          :to="{ name: 'ap-tagihan-edit', params: { id } }"
        >
          <VIcon icon="ri-pencil-line" class="me-1" />
          Edit
        </VBtn>
        <VBtn
          v-if="canRecordPayment"
          color="success"
          variant="tonal"
          @click="showPembayaran = true"
        >
          <VIcon icon="ri-money-cny-circle-line" class="me-1" />
          Catat Bayar
        </VBtn>
        <VBtn
          v-if="tagihan?.can_print"
          color="info"
          variant="elevated"
          class="font-weight-bold text-white elevation-2"
          @click="printTagihan"
        >
          <VIcon icon="ri-printer-line" class="me-1" />
          Cetak
        </VBtn>
      </div>
    </PageHeader>

    <div v-if="loading" class="text-center py-16">
      <VProgressCircular indeterminate color="primary" size="48" />
    </div>

    <template v-else-if="tagihan">

      <VRow>
        <VCol cols="12" lg="8">
          <VCard>
            <VCardTitle class="pa-4 pb-2 d-flex align-center justify-space-between">
              <span class="text-subtitle-1 font-weight-semibold">Informasi Tagihan</span>
              <div class="d-flex gap-2">
                <VChip v-if="tagihan.source_system === 'SHZ360'" color="info" size="small" variant="tonal" prepend-icon="ri-refresh-line">
                  Import SHZ360
                </VChip>
                <VIcon
                  v-if="tagihan.is_eb_ap_locked"
                  icon="ri-lock-line"
                  size="18"
                  color="warning"
                >
                  <VTooltip activator="parent">Periode tagihan ini sudah dikunci di Ending Balance AP — tidak dapat diedit/dihapus</VTooltip>
                </VIcon>
                <InvoiceLikeStatusBadge :status="tagihan.status" />
              </div>
            </VCardTitle>
            <VDivider />
            <VCardText class="pt-4">
              <VRow>
                <VCol cols="12" md="6"><DetailRow label="Vendor" :value="tagihan.vendor_ap?.nama_vendor" /></VCol>
                <VCol cols="12" md="6"><DetailRow label="Kode Vendor" :value="tagihan.vendor_ap?.kode_vendor" /></VCol>
                <VCol cols="12" md="6"><DetailRow label="No. Invoice Vendor" :value="tagihan.no_invoice_vendor" /></VCol>
                <VCol cols="12" md="6"><DetailRow label="Tanggal Tagihan" :value="formatDate(tagihan.tanggal_tagihan)" /></VCol>
                <VCol cols="12" md="6"><DetailRow label="Jatuh Tempo" :value="formatDate(tagihan.tanggal_jatuh_tempo)" /></VCol>
                <VCol cols="12" md="6"><DetailRow label="No. PO" :value="tagihan.no_po" /></VCol>
                <VCol cols="12" md="6"><DetailRow label="No. Terima Barang" :value="tagihan.no_terima_barang" /></VCol>
                <VCol cols="12" md="6"><DetailRow label="PIC AP" :value="tagihan.karyawan?.nama_karyawan" /></VCol>
                <VCol cols="12"><DetailRow label="Keterangan" :value="tagihan.keterangan" /></VCol>
              </VRow>
            </VCardText>
          </VCard>
        </VCol>

        <VCol cols="12" lg="4">
          <VCard>
            <VCardTitle class="pa-4 pb-2">
              <span class="text-subtitle-1 font-weight-semibold">Ringkasan</span>
            </VCardTitle>
            <VDivider />
            <VCardText class="pt-4">
              <table class="summary-table w-100">
                <tr>
                  <td class="text-body-2 text-medium-emphasis pb-2">Subtotal</td>
                  <td class="text-body-2 text-right font-weight-medium pb-2">{{ formatCurrency(tagihan.subtotal) }}</td>
                </tr>
                <tr>
                  <td class="text-body-2 text-medium-emphasis pb-2">PPN Masukan</td>
                  <td class="text-body-2 text-right font-weight-medium pb-2">{{ formatCurrency(tagihan.ppn_masukan) }}</td>
                </tr>
                <tr>
                  <td class="text-body-2 text-medium-emphasis pb-2">PPh 23</td>
                  <td class="text-body-2 text-right font-weight-medium pb-2">- {{ formatCurrency(tagihan.pph23) }}</td>
                </tr>
              </table>
              <VDivider class="my-3" />
              <div class="d-flex justify-space-between align-center mb-2">
                <span class="text-subtitle-2 font-weight-bold">Total Tagihan</span>
                <span class="text-h6 font-weight-bold text-primary">{{ formatCurrency(tagihan.total_tagihan) }}</span>
              </div>
              <div class="d-flex justify-space-between align-center mb-2">
                <span class="text-body-2">Total Terbayar</span>
                <span class="text-body-2 font-weight-medium text-success">{{ formatCurrency(tagihan.total_pembayaran) }}</span>
              </div>
              <div class="d-flex justify-space-between align-center">
                <span class="text-body-2">Sisa Tagihan</span>
                <span class="text-body-2 font-weight-bold" :class="tagihan.sisa_tagihan > 0 ? 'text-error' : 'text-success'">
                  {{ formatCurrency(tagihan.sisa_tagihan) }}
                </span>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <VCard class="mt-4">
        <VCardTitle class="pa-4 pb-2">
          <span class="text-subtitle-1 font-weight-semibold">Item Tagihan</span>
        </VCardTitle>
        <VDivider />
        <div class="overflow-x-auto">
          <VTable density="compact">
            <thead>
              <tr>
                <th>Barang / Jasa</th>
                <th class="text-right">Qty PO</th>
                <th class="text-right">Qty</th>
                <th>Satuan</th>
                <th>Status</th>
                <th class="text-right">Harga Satuan</th>
                <th class="text-right">PPN</th>
                <th class="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="it in tagihan.items" :key="it.id">
                <tr>
                  <td>
                    {{ it.nama_barang }}
                    <div v-if="it.kode_barang" class="text-caption text-medium-emphasis">{{ it.kode_barang }}</div>
                  </td>
                  <td class="text-right">{{ it.qty_po ?? '-' }}</td>
                  <td class="text-right">{{ it.qty }}</td>
                  <td>{{ it.satuan }}</td>
                  <td>
                    <VChip
                      v-if="itemStatusMap[it.status_detail_terima_po]"
                      size="x-small"
                      variant="tonal"
                      :color="itemStatusMap[it.status_detail_terima_po].color"
                      label
                    >
                      {{ itemStatusMap[it.status_detail_terima_po].label }}
                    </VChip>
                    <span v-else>-</span>
                  </td>
                  <td class="text-right">{{ formatCurrency(it.harga_satuan) }}</td>
                  <td class="text-right">{{ it.ppn !== null ? `${it.ppn}%` : '-' }}</td>
                  <td class="text-right">{{ formatCurrency(it.subtotal) }}</td>
                </tr>
                <tr v-if="it.qty_tolak > 0">
                  <td colspan="8" class="text-caption text-warning py-1">
                    <span class="d-inline-flex align-center gap-1">
                      <VIcon icon="ri-error-warning-line" size="14" />
                      <span>Ditolak {{ it.qty_tolak }} {{ it.satuan }}<span v-if="it.keterangan_tolak"> — {{ it.keterangan_tolak }}</span></span>
                    </span>
                  </td>
                </tr>
              </template>
            </tbody>
          </VTable>
        </div>
      </VCard>

      <VCard class="mt-4">
        <VCardTitle class="pa-4 pb-2">
          <span class="text-subtitle-1 font-weight-semibold">Riwayat Pembayaran</span>
        </VCardTitle>
        <VDivider />
        <VTable density="compact">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th class="text-right">Jumlah</th>
              <th>Metode</th>
              <th>Kode Voucher</th>
              <th>Dicatat Oleh</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!pembayaranList.length">
              <td colspan="5" class="text-center text-medium-emphasis py-4">Belum ada pembayaran.</td>
            </tr>
            <tr v-for="p in pembayaranList" :key="p.id">
              <td>{{ p.tanggal_pembayaran }}</td>
              <td class="text-right">{{ formatCurrency(p.jumlah_pembayaran) }}</td>
              <td>{{ p.metode_pembayaran }}</td>
              <td>{{ p.no_referensi ?? '-' }}</td>
              <td>{{ p.created_by_name ?? '-' }}</td>
            </tr>
          </tbody>
        </VTable>
      </VCard>

      <VCard class="mt-4">
        <VExpansionPanels variant="accordion">
          <VExpansionPanel title="Riwayat Approval">
            <template #text>
              <VTimeline density="compact" side="end">
                <VTimelineItem
                  v-for="log in approvalLogs"
                  :key="log.id"
                  :dot-color="approvalLogColor(log.action)"
                  size="small"
                >
                  <div class="text-body-2 font-weight-medium">{{ approvalLogLabel(log.action) }}</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ log.actor_name ?? '-' }} · {{ formatDateTime(log.created_at) }}
                  </div>
                  <div v-if="log.note" class="text-caption mt-1">{{ log.note }}</div>
                </VTimelineItem>
              </VTimeline>
            </template>
          </VExpansionPanel>
        </VExpansionPanels>
      </VCard>
    </template>

    <TagihanApPembayaranForm
      v-if="tagihan"
      v-model="showPembayaran"
      :tagihan-id="tagihan.id"
      :sisa-tagihan="tagihan.sisa_tagihan"
      @saved="onPembayaranSaved"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useCrud } from '@/composables/useCrud'
import { useFormatter } from '@/composables/useFormatter'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/utils/axios'
import { openLoadingPrintTab, openPrintTab } from '@/utils/printWindow.js'
import { readBlobError } from '@/utils/readBlobError'
import { AP_ITEM_RECEIPT_STATUS_MAP } from '@/utils/status'
import InvoiceLikeStatusBadge from '../components/TagihanApStatusBadge.vue'
import TagihanApPembayaranForm from '../components/TagihanApPembayaranForm.vue'

const route = useRoute()
const authStore = useAuthStore()
const id = route.params.id

const { item: tagihan, loading, fetchOne } = useCrud('/ap/tagihan')
const { formatCurrency, formatDate, formatDateTime } = useFormatter()
const { showError } = useSweetAlert()
const itemStatusMap = AP_ITEM_RECEIPT_STATUS_MAP

const pembayaranList = ref([])
const approvalLogs = ref([])

const showPembayaran = ref(false)

const canRecordPayment = computed(() =>
  authStore.canOperatePembayaranAp
  && tagihan.value?.status !== 'LUNAS',
)

function approvalLogLabel(action) {
  return {
    SUBMITTED: 'Diajukan',
    RESUBMITTED: 'Diajukan Ulang',
    APPROVED: 'Disetujui',
    REJECTED: 'Ditolak',
  }[action] ?? action
}

function approvalLogColor(action) {
  return {
    SUBMITTED: 'info',
    RESUBMITTED: 'info',
    APPROVED: 'success',
    REJECTED: 'error',
  }[action] ?? 'secondary'
}

async function printTagihan() {
  if (tagihan.value?.share_url) {
    if (!openPrintTab(tagihan.value.share_url))
      await showError('Popup diblokir browser. Izinkan popup untuk membuka dokumen cetak.')

    return
  }

  const printWindow = openLoadingPrintTab()
  try {
    const res = await api.get(`/ap/tagihan/${id}/print`, { responseType: 'blob', timeout: 300000 })
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

async function loadPembayaran() {
  const { data } = await api.get(`/ap/tagihan/${id}/pembayaran`)
  pembayaranList.value = data.data ?? []
}

async function loadApprovalLogs() {
  const { data } = await api.get(`/ap/tagihan/${id}/approval-logs`)
  approvalLogs.value = data.data ?? []
}

async function refreshAll() {
  await fetchOne(id)
  await Promise.all([loadPembayaran(), loadApprovalLogs()])
}

function onPembayaranSaved() {
  refreshAll()
}

onMounted(refreshAll)
</script>

<style scoped>
.summary-table {
  border-collapse: collapse;
  width: 100%;
}

.summary-table td {
  padding: 3px 0;
}
</style>
