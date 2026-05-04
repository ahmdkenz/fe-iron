<template>
  <div>
    <PageHeader
      title="Rekap Pembayaran"
      subtitle="Ringkasan pembayaran per metode dan per tanggal"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Rekap Pembayaran', disabled: true },
      ]"
    />

    <!-- Filter -->
    <VCard class="mb-4">
      <VCardText class="d-flex flex-wrap gap-3">
        <VTextField
          v-model="filters.tanggal_dari"
          label="Dari Tanggal"
          type="date"
          density="compact"
          hide-details
          style="max-width: 180px"
          @update:model-value="doFetch"
        />
        <VTextField
          v-model="filters.tanggal_sampai"
          label="Sampai Tanggal"
          type="date"
          density="compact"
          hide-details
          style="max-width: 180px"
          @update:model-value="doFetch"
        />
        <VSelect
          v-model="filters.metode_pembayaran"
          placeholder="Semua Metode"
          clearable
          hide-details
          density="compact"
          style="max-width: 160px"
          :items="metodeOptions"
          item-title="label"
          item-value="value"
          @update:model-value="doFetch"
        />
        <VAutocomplete
          v-model="filters.klien_ar_id"
          placeholder="Semua Klien"
          clearable
          hide-details
          density="compact"
          style="max-width: 240px"
          :items="klienList"
          item-title="nama_klien"
          item-value="id"
          :loading="klienLoading"
          @focus="ensureKlienLoaded()"
          @update:model-value="doFetch"
        />
      </VCardText>
    </VCard>

    <!-- Summary Cards -->
    <VRow class="mb-4">
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar color="success" variant="tonal" size="44">
                <VIcon icon="ri-money-cny-circle-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">Total Pembayaran</div>
                <div class="text-h6 font-weight-bold">{{ formatCurrency(report.summary?.total ?? 0) }}</div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard color="info" variant="tonal">
          <VCardText class="pa-3">
            <div class="text-caption font-weight-medium mb-1">Transfer</div>
            <div class="text-subtitle-1 font-weight-bold">{{ formatCurrency(report.summary?.transfer ?? 0) }}</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard color="success" variant="tonal">
          <VCardText class="pa-3">
            <div class="text-caption font-weight-medium mb-1">Cash</div>
            <div class="text-subtitle-1 font-weight-bold">{{ formatCurrency(report.summary?.cash ?? 0) }}</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard color="warning" variant="tonal">
          <VCardText class="pa-3">
            <div class="text-caption font-weight-medium mb-1">Giro</div>
            <div class="text-subtitle-1 font-weight-bold">{{ formatCurrency(report.summary?.giro ?? 0) }}</div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Tabel per Tanggal -->
    <VCard>
      <VCardText class="pb-0">
        <div class="text-caption text-medium-emphasis">
          Periode: <strong>{{ report.tanggal_dari ?? '-' }}</strong>
          s/d <strong>{{ report.tanggal_sampai ?? '-' }}</strong>
          &nbsp;·&nbsp; {{ report.summary?.jumlah_transaksi ?? 0 }} transaksi
        </div>
      </VCardText>
      <VDivider class="mt-2" />

      <VProgressLinear v-if="loading" indeterminate color="primary" />

      <VTable density="compact" class="rekap-table">
        <thead>
          <tr>
            <th>Tanggal</th>
            <th class="text-right">Transfer</th>
            <th class="text-right">Cash</th>
            <th class="text-right">Giro</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in report.rows" :key="row.tanggal">
            <td class="font-weight-medium">{{ formatDate(row.tanggal) }}</td>
            <td class="text-right">
              <span v-if="row.transfer > 0" class="text-info">{{ formatCurrency(row.transfer) }}</span>
              <span v-else class="text-medium-emphasis">-</span>
            </td>
            <td class="text-right">
              <span v-if="row.cash > 0" class="text-success">{{ formatCurrency(row.cash) }}</span>
              <span v-else class="text-medium-emphasis">-</span>
            </td>
            <td class="text-right">
              <span v-if="row.giro > 0" class="text-warning">{{ formatCurrency(row.giro) }}</span>
              <span v-else class="text-medium-emphasis">-</span>
            </td>
            <td class="text-right font-weight-bold">{{ formatCurrency(row.total) }}</td>
          </tr>

          <tr v-if="!loading && (!report.rows || report.rows.length === 0)">
            <td colspan="5" class="text-center text-medium-emphasis py-6">
              Tidak ada data pembayaran
            </td>
          </tr>

          <tr v-if="report.rows?.length" class="font-weight-bold bg-surface-variant">
            <td>Total</td>
            <td class="text-right text-info">{{ formatCurrency(report.summary?.transfer ?? 0) }}</td>
            <td class="text-right text-success">{{ formatCurrency(report.summary?.cash ?? 0) }}</td>
            <td class="text-right text-warning">{{ formatCurrency(report.summary?.giro ?? 0) }}</td>
            <td class="text-right">{{ formatCurrency(report.summary?.total ?? 0) }}</td>
          </tr>
        </tbody>
      </VTable>
    </VCard>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useCrud } from '@/composables/useCrud'
import { useLazyFetchAll } from '@/composables/useLazyFetchAll'
import { useFormatter } from '@/composables/useFormatter'
import api from '@/utils/axios'

const { formatCurrency, formatDate } = useFormatter()
const { items: klienList, loading: klienLoading, fetchAll: fetchKlien } = useCrud('/finance/klien-ar')
const { ensureLoaded: ensureKlienLoaded } = useLazyFetchAll(fetchKlien)

const loading = ref(false)
const report  = reactive({ tanggal_dari: null, tanggal_sampai: null, summary: null, rows: [] })

const now      = new Date()
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

const filters = reactive({
  tanggal_dari:       firstDay,
  tanggal_sampai:     lastDay,
  metode_pembayaran:  null,
  klien_ar_id:        null,
})

const metodeOptions = [
  { label: 'Transfer', value: 'TRANSFER' },
  { label: 'Cash',     value: 'CASH'     },
  { label: 'Giro',     value: 'GIRO'     },
]

async function doFetch() {
  loading.value = true
  try {
    const params = {}
    if (filters.tanggal_dari)      params.tanggal_dari      = filters.tanggal_dari
    if (filters.tanggal_sampai)    params.tanggal_sampai    = filters.tanggal_sampai
    if (filters.metode_pembayaran) params.metode_pembayaran = filters.metode_pembayaran
    if (filters.klien_ar_id)       params.klien_ar_id       = filters.klien_ar_id

    const { data } = await api.get('/finance/rekap-pembayaran', { params })
    Object.assign(report, data.data)
  } finally {
    loading.value = false
  }
}

onMounted(doFetch)
</script>

<style scoped>
.rekap-table th,
.rekap-table td {
  padding: 8px 12px;
  white-space: nowrap;
}
</style>
