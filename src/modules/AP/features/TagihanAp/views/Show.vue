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
          v-if="tagihan?.can_resubmit && authStore.canOperateTagihanAp"
          color="primary"
          variant="tonal"
          :loading="resubmitting"
          @click="doResubmit"
        >
          <VIcon icon="ri-send-plane-line" class="me-1" />
          Ajukan Ulang
        </VBtn>
        <VBtn
          v-if="tagihan?.can_approve && authStore.canApproveTagihanAp"
          color="success"
          @click="showApproveModal = true"
        >
          <VIcon icon="ri-checkbox-circle-line" class="me-1" />
          Approve
        </VBtn>
        <VBtn
          v-if="tagihan?.can_approve && authStore.canApproveTagihanAp"
          color="error"
          variant="tonal"
          @click="showRejectModal = true"
        >
          <VIcon icon="ri-close-circle-line" class="me-1" />
          Reject
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
      </div>
    </PageHeader>

    <div v-if="loading" class="text-center py-16">
      <VProgressCircular indeterminate color="primary" size="48" />
    </div>

    <template v-else-if="tagihan">
      <VAlert v-if="actionMessage" type="success" variant="tonal" class="mb-4">{{ actionMessage }}</VAlert>
      <VAlert v-if="actionErrorMessage" type="error" variant="tonal" class="mb-4">{{ actionErrorMessage }}</VAlert>

      <VRow>
        <VCol cols="12" lg="8">
          <VCard class="mb-4">
            <VCardTitle class="pa-4 pb-2 d-flex align-center justify-space-between">
              <span class="text-subtitle-1 font-weight-semibold">Informasi Tagihan</span>
              <div class="d-flex gap-2">
                <VChip v-if="tagihan.source_system === 'SHZ360'" color="info" size="small" variant="tonal" prepend-icon="ri-refresh-line">
                  Import SHZ360
                </VChip>
                <InvoiceLikeStatusBadge :status="tagihan.status" />
                <ApprovalStatusBadge :status="tagihan.approval_status" />
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

          <VCard class="mb-4">
            <VCardTitle class="pa-4 pb-2">
              <span class="text-subtitle-1 font-weight-semibold">Item Tagihan</span>
            </VCardTitle>
            <VDivider />
            <VTable density="compact">
              <thead>
                <tr>
                  <th>Barang / Jasa</th>
                  <th class="text-right">Qty</th>
                  <th>Satuan</th>
                  <th class="text-right">Harga Satuan</th>
                  <th class="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="it in tagihan.items" :key="it.id">
                  <td>{{ it.nama_barang }}</td>
                  <td class="text-right">{{ it.qty }}</td>
                  <td>{{ it.satuan }}</td>
                  <td class="text-right">{{ formatCurrency(it.harga_satuan) }}</td>
                  <td class="text-right">{{ formatCurrency(it.subtotal) }}</td>
                </tr>
              </tbody>
            </VTable>
          </VCard>

          <VCard class="mb-4">
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
                  <th>No. Referensi</th>
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

          <VCard>
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
        </VCol>

        <VCol cols="12" lg="4">
          <VCard class="mb-4">
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
    </template>

    <!-- Approve Modal -->
    <BaseModal
      v-if="showApproveModal"
      v-model="showApproveModal"
      title="Approve Tagihan"
      :loading="approving"
      @confirm="doApprove"
    >
      <p>Anda akan menyetujui tagihan <strong>{{ tagihan?.no_tagihan }}</strong> dari vendor <strong>{{ tagihan?.vendor_ap?.nama_vendor }}</strong>.</p>
      <VTextField v-model="approveNote" label="Catatan (opsional)" density="compact" variant="outlined" class="mt-3" />
      <template #actions>
        <VBtn variant="tonal" color="secondary" :disabled="approving" @click="showApproveModal = false">Batal</VBtn>
        <VBtn color="success" :loading="approving" @click="doApprove">
          <VIcon icon="ri-checkbox-circle-line" class="me-1" />
          Ya, Approve
        </VBtn>
      </template>
    </BaseModal>

    <!-- Reject Modal -->
    <BaseModal
      v-if="showRejectModal"
      v-model="showRejectModal"
      title="Reject Tagihan"
      :loading="rejecting"
      @confirm="doReject"
    >
      <p>Anda akan menolak tagihan <strong>{{ tagihan?.no_tagihan }}</strong>.</p>
      <VTextField
        v-model="rejectNote"
        label="Alasan Penolakan (wajib)"
        density="compact"
        variant="outlined"
        class="mt-3"
        :rules="[v => !!v || 'Alasan wajib diisi']"
      />
      <template #actions>
        <VBtn variant="tonal" color="secondary" :disabled="rejecting" @click="showRejectModal = false">Batal</VBtn>
        <VBtn color="error" :loading="rejecting" :disabled="!rejectNote" @click="doReject">
          <VIcon icon="ri-close-circle-line" class="me-1" />
          Ya, Reject
        </VBtn>
      </template>
    </BaseModal>

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
import { useAuthStore } from '@/stores/auth.store'
import api from '@/utils/axios'
import ApprovalStatusBadge from '@/modules/Finance/shared/components/ApprovalStatusBadge.vue'
import InvoiceLikeStatusBadge from '../components/TagihanApStatusBadge.vue'
import TagihanApPembayaranForm from '../components/TagihanApPembayaranForm.vue'

const route = useRoute()
const authStore = useAuthStore()
const id = route.params.id

const { item: tagihan, loading, fetchOne } = useCrud('/ap/tagihan')
const { formatCurrency, formatDate, formatDateTime } = useFormatter()

const pembayaranList = ref([])
const approvalLogs = ref([])

const showApproveModal = ref(false)
const showRejectModal = ref(false)
const showPembayaran = ref(false)
const approveNote = ref('')
const rejectNote = ref('')
const approving = ref(false)
const rejecting = ref(false)
const resubmitting = ref(false)
const actionMessage = ref('')
const actionErrorMessage = ref('')

const canRecordPayment = computed(() =>
  authStore.canOperatePembayaranAp
  && tagihan.value?.approval_status === 'APPROVED'
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

async function doApprove() {
  approving.value = true
  actionErrorMessage.value = ''
  try {
    await api.patch(`/ap/tagihan/${id}/approve`, { note: approveNote.value || null })
    showApproveModal.value = false
    approveNote.value = ''
    actionMessage.value = 'Tagihan berhasil disetujui.'
    await refreshAll()
  } catch (err) {
    actionErrorMessage.value = err.response?.data?.message ?? 'Gagal menyetujui tagihan.'
  } finally {
    approving.value = false
  }
}

async function doReject() {
  if (!rejectNote.value) return
  rejecting.value = true
  actionErrorMessage.value = ''
  try {
    await api.patch(`/ap/tagihan/${id}/reject`, { note: rejectNote.value })
    showRejectModal.value = false
    rejectNote.value = ''
    actionMessage.value = 'Tagihan berhasil ditolak.'
    await refreshAll()
  } catch (err) {
    actionErrorMessage.value = err.response?.data?.message ?? 'Gagal menolak tagihan.'
  } finally {
    rejecting.value = false
  }
}

async function doResubmit() {
  resubmitting.value = true
  actionErrorMessage.value = ''
  try {
    await api.patch(`/ap/tagihan/${id}/resubmit`, {})
    actionMessage.value = 'Tagihan berhasil diajukan ulang.'
    await refreshAll()
  } catch (err) {
    actionErrorMessage.value = err.response?.data?.message ?? 'Gagal mengajukan ulang tagihan.'
  } finally {
    resubmitting.value = false
  }
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
