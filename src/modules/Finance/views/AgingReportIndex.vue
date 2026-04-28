<template>
  <div>
    <PageHeader
      title="Aging Report"
      subtitle="Laporan umur piutang belum terbayar"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Aging Report', disabled: true },
      ]"
    />

    <!-- Filter -->
    <VCard class="mb-4">
      <VCardText class="d-flex flex-wrap gap-3">
        <VTextField
          v-model="filters.as_of_date"
          label="Per Tanggal"
          type="date"
          density="compact"
          hide-details
          style="max-width: 180px"
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
      <VCol
        v-for="bucket in buckets"
        :key="bucket.key"
        cols="12"
        sm="6"
        md="2"
      >
        <VCard :color="bucket.color" variant="tonal">
          <VCardText class="pa-3">
            <div class="text-caption font-weight-medium mb-1">
              {{ bucket.label }}
            </div>
            <div class="text-subtitle-1 font-weight-bold">
              {{ formatCurrency(report.summary?.[bucket.key] ?? 0) }}
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Tabel -->
    <VCard>
      <VCardText class="pb-0">
        <div class="text-caption text-medium-emphasis">
          Per tanggal: <strong>{{ report.as_of_date ?? '-' }}</strong>
          &nbsp;·&nbsp; {{ report.rows?.length ?? 0 }} klien
        </div>
      </VCardText>
      <VDivider class="mt-2" />

      <VProgressLinear
        v-if="loading"
        indeterminate
        color="primary"
      />

      <VTable density="compact" class="aging-table">
        <thead>
          <tr>
            <th>Klien</th>
            <th>Perusahaan</th>
            <th
              v-for="bucket in buckets"
              :key="bucket.key"
              class="text-right"
            >
              {{ bucket.label }}
            </th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in report.rows"
            :key="row.klien_id"
          >
            <td>
              <div class="font-weight-medium">{{ row.nama_klien }}</div>
              <div class="text-caption text-medium-emphasis">{{ row.kode_klien }}</div>
            </td>
            <td>{{ row.perusahaan ?? '-' }}</td>
            <td
              v-for="bucket in buckets"
              :key="bucket.key"
              class="text-right"
              :class="row[bucket.key] > 0 && bucket.key !== 'current' ? `text-${bucket.color}` : ''"
            >
              {{ row[bucket.key] > 0 ? formatCurrency(row[bucket.key]) : '-' }}
            </td>
            <td class="text-right font-weight-bold">
              {{ formatCurrency(row.total) }}
            </td>
          </tr>

          <tr
            v-if="!loading && (!report.rows || report.rows.length === 0)"
          >
            <td
              :colspan="2 + buckets.length + 1"
              class="text-center text-medium-emphasis py-6"
            >
              Tidak ada data piutang
            </td>
          </tr>

          <!-- Total baris -->
          <tr
            v-if="report.rows?.length"
            class="font-weight-bold bg-surface-variant"
          >
            <td colspan="2">Total</td>
            <td
              v-for="bucket in buckets"
              :key="bucket.key"
              class="text-right"
            >
              {{ formatCurrency(report.summary?.[bucket.key] ?? 0) }}
            </td>
            <td class="text-right">
              {{ formatCurrency(report.summary?.total ?? 0) }}
            </td>
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

const { formatCurrency } = useFormatter()
const { items: klienList, loading: klienLoading, fetchAll: fetchKlien } = useCrud('/finance/klien-ar')
const { ensureLoaded: ensureKlienLoaded } = useLazyFetchAll(fetchKlien)

const loading = ref(false)
const report  = reactive({ as_of_date: null, summary: null, rows: [] })

const filters = reactive({
  as_of_date:  new Date().toISOString().slice(0, 10),
  klien_ar_id: null,
})

const buckets = [
  { key: 'current',      label: 'Belum Jatuh Tempo', color: 'success' },
  { key: 'hari_1_30',    label: '1–30 Hari',          color: 'info'    },
  { key: 'hari_31_60',   label: '31–60 Hari',          color: 'warning' },
  { key: 'hari_61_90',   label: '61–90 Hari',          color: 'deep-orange' },
  { key: 'hari_91_plus', label: '>90 Hari',             color: 'error'   },
]

async function doFetch() {
  loading.value = true
  try {
    const params = {}
    if (filters.as_of_date)  params.as_of_date  = filters.as_of_date
    if (filters.klien_ar_id) params.klien_ar_id = filters.klien_ar_id

    const { data } = await api.get('/finance/aging-report', { params })
    Object.assign(report, data.data)
  } finally {
    loading.value = false
  }
}

onMounted(doFetch)
</script>

<style scoped>
.aging-table th,
.aging-table td {
  padding: 8px 12px;
  white-space: nowrap;
}
</style>
