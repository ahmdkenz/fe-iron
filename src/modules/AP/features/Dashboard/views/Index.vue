<template>
  <div>
    <PageHeader
      title="Dashboard AP"
      subtitle="Ringkasan Account Payable"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Dashboard AP', disabled: true }
      ]"
    />

    <div v-if="loading" class="text-center py-16">
      <VProgressCircular indeterminate color="primary" size="48" />
    </div>

    <template v-else-if="summary">
      <VRow class="mb-4">
        <VCol cols="12" sm="6" md="3">
          <VCard>
            <VCardText>
              <div class="d-flex align-center gap-3">
                <VAvatar color="error" variant="tonal" size="48"><VIcon icon="ri-wallet-3-line" /></VAvatar>
                <div>
                  <div class="text-caption text-medium-emphasis">Total Hutang Outstanding</div>
                  <div class="text-h6 font-weight-bold">{{ formatCurrency(summary.total_outstanding) }}</div>
                </div>
              </div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="12" sm="6" md="3">
          <VCard>
            <VCardText>
              <div class="d-flex align-center gap-3">
                <VAvatar color="warning" variant="tonal" size="48"><VIcon icon="ri-timer-line" /></VAvatar>
                <div>
                  <div class="text-caption text-medium-emphasis">Jatuh Tempo 7 Hari</div>
                  <div class="text-h6 font-weight-bold">{{ formatCurrency(summary.jatuh_tempo_7_hari) }}</div>
                </div>
              </div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="12" sm="6" md="3">
          <VCard>
            <VCardText>
              <div class="d-flex align-center gap-3">
                <VAvatar color="success" variant="tonal" size="48"><VIcon icon="ri-money-cny-circle-line" /></VAvatar>
                <div>
                  <div class="text-caption text-medium-emphasis">Pembayaran Bulan Ini</div>
                  <div class="text-h6 font-weight-bold">{{ formatCurrency(summary.pembayaran_bulan_ini) }}</div>
                </div>
              </div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="12" sm="6" md="3">
          <VCard>
            <VCardText>
              <div class="d-flex align-center gap-3">
                <VAvatar color="info" variant="tonal" size="48"><VIcon icon="ri-history-line" /></VAvatar>
                <div>
                  <div class="text-caption text-medium-emphasis">Pembayaran Bulan Lalu</div>
                  <div class="text-h6 font-weight-bold">{{ formatCurrency(summary.pembayaran_bulan_lalu) }}</div>
                </div>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <VRow>
        <VCol cols="12" md="6">
          <VCard>
            <VCardTitle class="pa-4 pb-2">
              <span class="text-subtitle-1 font-weight-semibold">Aging Hutang (Overdue)</span>
            </VCardTitle>
            <VDivider />
            <VCardText>
              <div v-for="(label, key) in bucketLabels" :key="key" class="d-flex justify-space-between align-center py-2">
                <span class="text-body-2">{{ label }}</span>
                <span class="text-body-2 font-weight-medium">{{ formatCurrency(summary.overdue_buckets?.[key]) }}</span>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <VCol cols="12" md="6">
          <VCard>
            <VCardTitle class="pa-4 pb-2">
              <span class="text-subtitle-1 font-weight-semibold">Top 5 Vendor by Outstanding</span>
            </VCardTitle>
            <VDivider />
            <VTable density="compact">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th class="text-right">Outstanding</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!summary.top_vendors?.length">
                  <td colspan="2" class="text-center text-medium-emphasis py-4">Tidak ada data.</td>
                </tr>
                <tr v-for="v in summary.top_vendors" :key="v.vendor_ap_id">
                  <td>{{ v.nama_vendor }} <span class="text-caption text-medium-emphasis">({{ v.kode_vendor }})</span></td>
                  <td class="text-right">{{ formatCurrency(v.total_outstanding) }}</td>
                </tr>
              </tbody>
            </VTable>
          </VCard>
        </VCol>
      </VRow>
    </template>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useFormatter } from '@/composables/useFormatter'
import api from '@/utils/axios'

const { formatCurrency } = useFormatter()

const loading = ref(true)
const summary = ref(null)

const bucketLabels = {
  current: 'Belum Jatuh Tempo',
  '1-30': '1 - 30 Hari',
  '31-60': '31 - 60 Hari',
  '61-90': '61 - 90 Hari',
  '90+': '> 90 Hari',
}

onMounted(async () => {
  try {
    const { data } = await api.get('/ap/dashboard/summary')
    summary.value = data.data
  } catch {
    summary.value = null
  } finally {
    loading.value = false
  }
})
</script>
