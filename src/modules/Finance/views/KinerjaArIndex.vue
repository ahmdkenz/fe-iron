<template>
  <div>
    <PageHeader
      title="Kinerja AR per PIC"
      subtitle="Performa penagihan per AR officer"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Kinerja AR', disabled: true },
      ]"
    />

    <!-- Filter -->
    <VCard class="mb-4">
      <VCardText class="d-flex flex-wrap gap-3">
        <VTextField
          v-model="filters.periode_awal"
          label="Dari Tanggal"
          type="date"
          density="compact"
          hide-details
          style="max-width: 180px"
          @update:model-value="doFetch"
        />
        <VTextField
          v-model="filters.periode_akhir"
          label="Sampai Tanggal"
          type="date"
          density="compact"
          hide-details
          style="max-width: 180px"
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
              <VAvatar color="primary" variant="tonal" size="44">
                <VIcon icon="ri-user-star-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">Jumlah AR Officer</div>
                <div class="text-h6 font-weight-bold">{{ report.rows?.length ?? 0 }}</div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar color="warning" variant="tonal" size="44">
                <VIcon icon="ri-bill-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">Total Tagihan</div>
                <div class="text-h6 font-weight-bold">{{ formatCurrency(report.summary?.total_tagihan ?? 0) }}</div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3">
              <VAvatar color="success" variant="tonal" size="44">
                <VIcon icon="ri-money-cny-circle-line" />
              </VAvatar>
              <div>
                <div class="text-caption text-medium-emphasis">Total Terkumpul</div>
                <div class="text-h6 font-weight-bold">{{ formatCurrency(report.summary?.total_terkumpul ?? 0) }}</div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard :color="collectionRateColor(report.summary?.collection_rate ?? 0)" variant="tonal">
          <VCardText class="pa-3">
            <div class="text-caption font-weight-medium mb-1">Collection Rate Keseluruhan</div>
            <div class="text-subtitle-1 font-weight-bold">{{ report.summary?.collection_rate ?? 0 }}%</div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Tabel -->
    <VCard>
      <VCardText class="pb-0">
        <div class="text-caption text-medium-emphasis">
          Periode: <strong>{{ report.periode_awal ?? '-' }}</strong>
          s/d <strong>{{ report.periode_akhir ?? '-' }}</strong>
        </div>
      </VCardText>
      <VDivider class="mt-2" />

      <VProgressLinear v-if="loading" indeterminate color="primary" />

      <VTable density="compact" class="kinerja-table">
        <thead>
          <tr>
            <th>AR Officer</th>
            <th>Perusahaan</th>
            <th class="text-center">Klien</th>
            <th class="text-center">Invoice</th>
            <th class="text-right">Total Tagihan</th>
            <th class="text-right">Terkumpul</th>
            <th class="text-right">Sisa</th>
            <th class="text-center">Collection Rate</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in report.rows" :key="row.karyawan_id">
            <td>
              <div class="font-weight-medium">{{ row.nama_karyawan }}</div>
            </td>
            <td>
              <VChip v-if="row.perusahaan" color="secondary" size="small" variant="tonal" label>
                {{ row.perusahaan }}
              </VChip>
              <span v-else>-</span>
            </td>
            <td class="text-center">{{ row.jumlah_klien }}</td>
            <td class="text-center">{{ row.jumlah_invoice }}</td>
            <td class="text-right">{{ formatCurrency(row.total_tagihan) }}</td>
            <td class="text-right text-success font-weight-medium">{{ formatCurrency(row.total_terkumpul) }}</td>
            <td class="text-right" :class="row.total_sisa > 0 ? 'text-error' : 'text-success'">
              {{ formatCurrency(row.total_sisa) }}
            </td>
            <td class="text-center">
              <div class="d-flex align-center gap-2 justify-center">
                <VProgressLinear
                  :model-value="row.collection_rate"
                  :color="collectionRateColor(row.collection_rate)"
                  height="6"
                  rounded
                  style="max-width: 80px"
                />
                <span class="text-caption font-weight-bold" :class="`text-${collectionRateColor(row.collection_rate)}`">
                  {{ row.collection_rate }}%
                </span>
              </div>
            </td>
          </tr>

          <tr v-if="!loading && (!report.rows || report.rows.length === 0)">
            <td colspan="8" class="text-center text-medium-emphasis py-6">
              Tidak ada data kinerja AR
            </td>
          </tr>

          <tr v-if="report.rows?.length" class="font-weight-bold bg-surface-variant">
            <td colspan="4">Total</td>
            <td class="text-right">{{ formatCurrency(report.summary?.total_tagihan ?? 0) }}</td>
            <td class="text-right text-success">{{ formatCurrency(report.summary?.total_terkumpul ?? 0) }}</td>
            <td class="text-right text-error">{{ formatCurrency(report.summary?.total_sisa ?? 0) }}</td>
            <td class="text-center">
              <span :class="`text-${collectionRateColor(report.summary?.collection_rate ?? 0)}`">
                {{ report.summary?.collection_rate ?? 0 }}%
              </span>
            </td>
          </tr>
        </tbody>
      </VTable>
    </VCard>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useFormatter } from '@/composables/useFormatter'
import api from '@/utils/axios'

const { formatCurrency } = useFormatter()

const loading = ref(false)
const report  = reactive({ periode_awal: null, periode_akhir: null, summary: null, rows: [] })

const now      = new Date()
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

const filters = reactive({
  periode_awal:  firstDay,
  periode_akhir: lastDay,
})

function collectionRateColor(rate) {
  if (rate >= 90) return 'success'
  if (rate >= 70) return 'warning'
  return 'error'
}

async function doFetch() {
  loading.value = true
  try {
    const params = {}
    if (filters.periode_awal)  params.periode_awal  = filters.periode_awal
    if (filters.periode_akhir) params.periode_akhir = filters.periode_akhir

    const { data } = await api.get('/finance/kinerja-ar', { params })
    Object.assign(report, data.data)
  } finally {
    loading.value = false
  }
}

onMounted(doFetch)
</script>

<style scoped>
.kinerja-table th,
.kinerja-table td {
  padding: 8px 12px;
  white-space: nowrap;
}
</style>
