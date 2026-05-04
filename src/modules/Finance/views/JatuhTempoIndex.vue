<template>
  <div>
    <PageHeader
      title="Invoice Jatuh Tempo"
      subtitle="Daftar invoice yang akan dan sudah jatuh tempo"
      :breadcrumbs="[
        { title: 'Dashboard', to: { name: 'dashboard' } },
        { title: 'Invoice Jatuh Tempo', disabled: true },
      ]"
    />

    <!-- Filter -->
    <VCard class="mb-4">
      <VCardText class="d-flex flex-wrap gap-3 align-center">
        <VBtnToggle
          v-model="filters.filter_type"
          density="compact"
          variant="outlined"
          mandatory
          @update:model-value="doFetch"
        >
          <VBtn value="upcoming">Akan Jatuh Tempo</VBtn>
          <VBtn value="overdue">Sudah Lewat</VBtn>
          <VBtn value="all">Semua</VBtn>
        </VBtnToggle>

        <VSelect
          v-if="filters.filter_type === 'upcoming'"
          v-model="filters.days"
          label="Dalam"
          density="compact"
          hide-details
          style="max-width: 140px"
          :items="daysOptions"
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
        <VCard :color="report.summary?.sudah_lewat > 0 ? 'error' : undefined" variant="tonal">
          <VCardText class="pa-3">
            <div class="text-caption font-weight-medium mb-1">Sudah Lewat Jatuh Tempo</div>
            <div class="text-subtitle-1 font-weight-bold">{{ report.summary?.sudah_lewat ?? 0 }} invoice</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard color="warning" variant="tonal">
          <VCardText class="pa-3">
            <div class="text-caption font-weight-medium mb-1">Jatuh Tempo Hari Ini</div>
            <div class="text-subtitle-1 font-weight-bold">{{ report.summary?.jatuh_tempo_hari_ini ?? 0 }} invoice</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard color="info" variant="tonal">
          <VCardText class="pa-3">
            <div class="text-caption font-weight-medium mb-1">Total Invoice</div>
            <div class="text-subtitle-1 font-weight-bold">{{ report.summary?.total_invoice ?? 0 }} invoice</div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard color="error" variant="tonal">
          <VCardText class="pa-3">
            <div class="text-caption font-weight-medium mb-1">Total Sisa Tagihan</div>
            <div class="text-subtitle-1 font-weight-bold">{{ formatCurrency(report.summary?.total_sisa ?? 0) }}</div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Tabel -->
    <VCard>
      <VCardText class="pb-0">
        <div class="text-caption text-medium-emphasis">
          Per tanggal: <strong>{{ report.as_of_date ?? '-' }}</strong>
        </div>
      </VCardText>
      <VDivider class="mt-2" />

      <VProgressLinear v-if="loading" indeterminate color="primary" />

      <VTable density="compact" class="jatuh-tempo-table">
        <thead>
          <tr>
            <th>No Invoice</th>
            <th>Klien</th>
            <th>Perusahaan</th>
            <th>PIC AR</th>
            <th class="text-center">Jatuh Tempo</th>
            <th class="text-center">Status Hari</th>
            <th class="text-center">Status</th>
            <th class="text-right">Sisa Tagihan</th>
            <th class="text-center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in report.rows" :key="row.invoice_id">
            <td>
              <RouterLink
                :to="{ name: 'finance-invoice-show', params: { id: row.invoice_id } }"
                class="text-primary text-decoration-none font-weight-medium"
              >
                {{ row.no_invoice }}
              </RouterLink>
            </td>
            <td>
              <div class="font-weight-medium">{{ row.nama_klien }}</div>
              <div class="text-caption text-medium-emphasis">{{ row.kode_klien }}</div>
            </td>
            <td>
              <VChip v-if="row.perusahaan" color="secondary" size="small" variant="tonal" label>
                {{ row.perusahaan }}
              </VChip>
              <span v-else>-</span>
            </td>
            <td>{{ row.pic_ar ?? '-' }}</td>
            <td class="text-center">
              {{ row.tanggal_jatuh_tempo ? formatDate(row.tanggal_jatuh_tempo) : '-' }}
            </td>
            <td class="text-center">
              <VChip
                :color="selisihColor(row.selisih_hari)"
                size="small"
                label
              >
                {{ selisihLabel(row.selisih_hari) }}
              </VChip>
            </td>
            <td class="text-center">
              <VChip :color="statusColor(row.status)" size="small" label variant="tonal">
                {{ row.status }}
              </VChip>
            </td>
            <td class="text-right font-weight-bold text-error">
              {{ formatCurrency(row.sisa_tagihan) }}
            </td>
            <td class="text-center">
              <VBtn
                icon size="small" variant="text" color="info"
                :to="{ name: 'finance-invoice-show', params: { id: row.invoice_id } }"
              >
                <VIcon icon="ri-eye-line" size="18" />
                <VTooltip activator="parent">Lihat Invoice</VTooltip>
              </VBtn>
            </td>
          </tr>

          <tr v-if="!loading && (!report.rows || report.rows.length === 0)">
            <td colspan="9" class="text-center text-medium-emphasis py-6">
              Tidak ada invoice jatuh tempo
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

const { formatCurrency, formatDate } = useFormatter()
const { items: klienList, loading: klienLoading, fetchAll: fetchKlien } = useCrud('/finance/klien-ar')
const { ensureLoaded: ensureKlienLoaded } = useLazyFetchAll(fetchKlien)

const loading = ref(false)
const report  = reactive({ as_of_date: null, summary: null, rows: [] })

const filters = reactive({
  filter_type: 'upcoming',
  days:        30,
  klien_ar_id: null,
})

const daysOptions = [
  { label: '7 Hari',  value: 7  },
  { label: '14 Hari', value: 14 },
  { label: '30 Hari', value: 30 },
  { label: '60 Hari', value: 60 },
  { label: '90 Hari', value: 90 },
]

function selisihColor(hari) {
  if (hari === null) return 'default'
  if (hari < 0) return 'error'
  if (hari === 0) return 'warning'
  if (hari <= 7) return 'deep-orange'
  if (hari <= 14) return 'warning'
  return 'info'
}

function selisihLabel(hari) {
  if (hari === null) return 'Tdk Ada JT'
  if (hari < 0) return `${Math.abs(hari)} hari lewat`
  if (hari === 0) return 'Hari ini'
  return `${hari} hari lagi`
}

function statusColor(status) {
  return { TERKIRIM: 'info', SEBAGIAN: 'warning' }[status] ?? 'default'
}

async function doFetch() {
  loading.value = true
  try {
    const params = { filter_type: filters.filter_type }
    if (filters.filter_type === 'upcoming') params.days = filters.days
    if (filters.klien_ar_id) params.klien_ar_id = filters.klien_ar_id

    const { data } = await api.get('/finance/jatuh-tempo', { params })
    Object.assign(report, data.data)
  } finally {
    loading.value = false
  }
}

onMounted(doFetch)
</script>

<style scoped>
.jatuh-tempo-table th,
.jatuh-tempo-table td {
  padding: 8px 12px;
  white-space: nowrap;
}
</style>
