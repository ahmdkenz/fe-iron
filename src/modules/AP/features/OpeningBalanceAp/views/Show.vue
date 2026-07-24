<template>
  <div>
    <PageHeader
      :title="tagihan?.no_tagihan ?? 'Detail Opening Balance'"
      :subtitle="tagihan?.vendor_ap?.nama_vendor"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Opening Balance AP', to: { name: 'ap-opening-balance-index' } },
        { title: tagihan?.no_tagihan ?? 'Detail', disabled: true },
      ]"
    >
      <div class="d-flex flex-wrap gap-2">
        <VBtn
          variant="tonal"
          color="secondary"
          :to="{ name: 'ap-opening-balance-index' }"
        >
          <VIcon
            icon="ri-arrow-left-line"
            class="me-1"
          />
          Kembali
        </VBtn>
        <VBtn
          v-if="tagihan?.can_edit && authStore.canOperateOpeningBalanceAp"
          color="primary"
          :to="{ name: 'ap-opening-balance-edit', params: { id } }"
        >
          <VIcon
            icon="ri-pencil-line"
            class="me-1"
          />
          Edit
        </VBtn>
        <VBtn
          v-if="tagihan?.can_print"
          color="info"
          variant="elevated"
          class="font-weight-bold text-white elevation-2"
          @click="printOpeningBalance"
        >
          <VIcon
            icon="ri-printer-line"
            class="me-1"
          />
          Cetak
        </VBtn>
      </div>
    </PageHeader>

    <div
      v-if="loading"
      class="text-center py-16"
    >
      <VProgressCircular
        indeterminate
        color="primary"
        size="48"
      />
    </div>

    <template v-else-if="tagihan">
      <VRow>
        <VCol
          cols="12"
          lg="8"
        >
          <VCard>
            <VCardTitle class="pa-4 pb-2 d-flex align-center justify-space-between">
              <span class="text-subtitle-1 font-weight-semibold">Informasi Opening Balance</span>
              <div class="d-flex gap-2">
                <VIcon
                  v-if="tagihan.is_eb_ap_locked"
                  icon="ri-lock-line"
                  size="18"
                  color="warning"
                >
                  <VTooltip activator="parent">
                    Periode opening balance ini sudah dikunci di Ending Balance AP — tidak dapat diedit
                  </VTooltip>
                </VIcon>
                <TagihanApStatusBadge :status="tagihan.status" />
                <ApprovalStatusBadge :status="tagihan.approval_status" />
              </div>
            </VCardTitle>
            <VDivider />
            <VCardText class="pt-4">
              <VRow>
                <VCol
                  cols="12"
                  md="6"
                >
                  <DetailRow
                    label="Vendor"
                    :value="tagihan.vendor_ap?.nama_vendor"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <DetailRow
                    label="Kode Vendor"
                    :value="tagihan.vendor_ap?.kode_vendor"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <DetailRow
                    label="Tanggal"
                    :value="formatDate(tagihan.tanggal_tagihan)"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <DetailRow
                    label="Jatuh Tempo"
                    :value="formatDate(tagihan.tanggal_jatuh_tempo)"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <DetailRow
                    label="PIC"
                    :value="tagihan.karyawan?.nama_karyawan"
                  />
                </VCol>
                <VCol cols="12">
                  <DetailRow
                    label="Keterangan"
                    :value="tagihan.keterangan"
                  />
                </VCol>
              </VRow>
            </VCardText>
          </VCard>
        </VCol>

        <VCol
          cols="12"
          lg="4"
        >
          <VCard>
            <VCardTitle class="pa-4 pb-2">
              <span class="text-subtitle-1 font-weight-semibold">Ringkasan</span>
            </VCardTitle>
            <VDivider />
            <VCardText class="pt-4">
              <div class="d-flex justify-space-between align-center mb-2">
                <span class="text-subtitle-2 font-weight-bold">Saldo Awal</span>
                <span class="text-h6 font-weight-bold text-primary">{{ formatCurrency(tagihan.total_tagihan) }}</span>
              </div>
              <div class="d-flex justify-space-between align-center mb-2">
                <span class="text-body-2">Total Terbayar</span>
                <span class="text-body-2 font-weight-medium text-success">{{ formatCurrency(tagihan.total_pembayaran) }}</span>
              </div>
              <div class="d-flex justify-space-between align-center">
                <span class="text-body-2">Sisa Tagihan</span>
                <span
                  class="text-body-2 font-weight-bold"
                  :class="tagihan.sisa_tagihan > 0 ? 'text-error' : 'text-success'"
                >
                  {{ formatCurrency(tagihan.sisa_tagihan) }}
                </span>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <VCard class="mt-4">
        <VCardTitle class="pa-4 pb-2">
          <span class="text-subtitle-1 font-weight-semibold">Rincian Invoice Asal & Item</span>
        </VCardTitle>
        <VDivider />
        <OpeningBalanceApDetailTable
          :details="tagihan.opening_balance_ap_details ?? []"
          readonly
          :saldo-awal="Number(tagihan.subtotal) || 0"
        />
      </VCard>

      <VCard class="mt-4">
        <VExpansionPanels variant="accordion">
          <VExpansionPanel title="Riwayat Approval">
            <template #text>
              <VTimeline
                density="compact"
                side="end"
              >
                <VTimelineItem
                  v-for="log in approvalLogs"
                  :key="log.id"
                  :dot-color="approvalLogColor(log.action)"
                  size="small"
                >
                  <div class="text-body-2 font-weight-medium">
                    {{ approvalLogLabel(log.action) }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ log.actor_name ?? '-' }} · {{ formatDateTime(log.created_at) }}
                  </div>
                  <div
                    v-if="log.note"
                    class="text-caption mt-1"
                  >
                    {{ log.note }}
                  </div>
                </VTimelineItem>
              </VTimeline>
            </template>
          </VExpansionPanel>
        </VExpansionPanels>
      </VCard>
    </template>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useCrud } from '@/composables/useCrud'
import { useFormatter } from '@/composables/useFormatter'
import { useSweetAlert } from '@/composables/useSweetAlert'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/utils/axios'
import { openLoadingPrintTab, openPrintTab } from '@/utils/printWindow.js'
import { readBlobError } from '@/utils/readBlobError'
import ApprovalStatusBadge from '@/modules/Finance/shared/components/ApprovalStatusBadge.vue'
import TagihanApStatusBadge from '../../TagihanAp/components/TagihanApStatusBadge.vue'
import OpeningBalanceApDetailTable from '../components/OpeningBalanceApDetailTable.vue'

const route = useRoute()
const authStore = useAuthStore()
const id = route.params.id

const { item: tagihan, loading, fetchOne } = useCrud('/ap/opening-balance')
const { formatCurrency, formatDate, formatDateTime } = useFormatter()
const { showError } = useSweetAlert()

const approvalLogs = ref([])

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

async function loadApprovalLogs() {
  const { data } = await api.get(`/ap/tagihan/${id}/approval-logs`)

  approvalLogs.value = data.data ?? []
}

async function printOpeningBalance() {
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

onMounted(async () => {
  await fetchOne(id)
  await loadApprovalLogs()
})
</script>
